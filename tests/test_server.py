import concurrent.futures,json,sqlite3,sys,tempfile,threading,unittest,urllib.error,urllib.request,uuid
from pathlib import Path
from contextlib import closing
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import serve

class ContentAndStorage(unittest.TestCase):
 def test_feedback_retries_and_snapshot_conflict(self):
  with tempfile.TemporaryDirectory() as tmp:
   db=Path(tmp)/'feedback.sqlite3';raw=dict(request_key=str(uuid.uuid4()),feedback=dict(kind='内容纠错',message='测试内容',context='RAG',contact='',page='/jargon/canvas.html'))
   with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(lambda _:serve.receive_feedback(raw,db),range(4)))
   self.assertEqual(len({r['id'] for r in rows}),1)
   with closing(sqlite3.connect(db)) as c:self.assertEqual(c.execute('SELECT COUNT(*) FROM feedback').fetchone()[0],1)
   changed={**raw,'feedback':{**raw['feedback'],'message':'另一份反馈'}}
   with self.assertRaises(ValueError):serve.receive_feedback(changed,db)
 def test_bad_feedback_and_model_result_rejected(self):
  with self.assertRaises(ValueError):serve.receive_feedback(dict(request_key=str(uuid.uuid4()),feedback=dict(kind='bad',message='测试',page='/jargon/')))
  valid=dict(verdict='部分理解',feedback='已理解角色区别，还需补充核验。',evidence='回答提到了应用执行。',next_question='怎样确认执行结果？')
  self.assertEqual(serve.parse_result(json.dumps(valid)),valid)
  with self.assertRaises(ValueError):serve.parse_result(json.dumps({**valid,'verdict':'百分百正确'}))
 def test_local_ai_address_rejected_before_request(self):
  with patch('serve.socket.getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))]),patch('serve.urllib.request.build_opener') as opener:
   with self.assertRaises(ValueError):serve.judge(dict(AI_BASE_URL='https://localhost/v1',AI_MODEL='test',AI_API_KEY='fixture-not-a-real-key'),{},'测试')
   opener.assert_not_called()

class HTTPIsolation(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.server=serve.make_server(0);cls.server.settings={k:'' for k in ('AI_BASE_URL','AI_MODEL','AI_API_KEY')};cls.port=cls.server.server_port;cls.base=f'http://127.0.0.1:{cls.port}';cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start();cls.http=urllib.request.build_opener(urllib.request.ProxyHandler({}))
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join()
 def request(self,path,body=None,origin=None):
  headers={'Content-Type':'application/json','X-Jargon-Request':'1'}
  if origin is not None:headers['Origin']=origin
  request=urllib.request.Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
  try:response=self.http.open(request)
  except urllib.error.HTTPError as error:response=error
  with response:return response.status,response.read(),response.headers
 def test_static_pages_and_offline_config(self):
  for path in ['/','/jargon/','/jargon/glossary.html','/jargon/canvas.html','/jargon/canvas-topics-data.json']:
   code,_,headers=self.request(path);self.assertEqual(code,200);self.assertIn("connect-src 'self'",headers['Content-Security-Policy'])
  code,body,_=self.request('/api/config');self.assertEqual(code,200);self.assertEqual(json.loads(body),dict(ai_enabled=False))
 def test_secrets_and_outside_files_not_served(self):
  for path in ['/.env','/.git/config','/%2e%2e/serve.py','/serve.py','/api/control/me']:
   code,_,_=self.request(path);self.assertEqual(code,404)
 def test_no_model_call_when_unconfigured_or_foreign_origin(self):
  with patch('serve.judge') as judge:
   code,_,_=self.request('/api/judge',dict(concept='jargon-alignment',answer='测试回答'),self.base);self.assertEqual(code,503)
   code,_,_=self.request('/api/judge',dict(concept='jargon-alignment',answer='测试回答'),'https://example.com');self.assertEqual(code,403);judge.assert_not_called()

if __name__=='__main__':unittest.main()
