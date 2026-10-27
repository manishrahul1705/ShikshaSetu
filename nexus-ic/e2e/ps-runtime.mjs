import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import http from 'node:http';
import dotenv from 'dotenv';
dotenv.config({path:fileURLToPath(new URL('../.env',import.meta.url))});
process.env.MONGODB_URI='mongodb://127.0.0.1:27017/awaaz_dastak_showcase';
process.env.CLIENT_ORIGIN='http://127.0.0.1:5317';
process.env.APP_MODE='demo';process.env.NODE_ENV='development';
if(!process.env.VAULT_KEY || !process.env.DOCS_KEY)throw new Error('REHEARSAL_ENCRYPTION_KEYS_REQUIRED');
const require=createRequire(new URL('../server/package.json',import.meta.url));
const express=require('express');
const [{createApp},{connectDB,disconnectDB}]=await Promise.all([import('../server/src/app.js'),import('../server/src/config/db.js')]);
await connectDB(process.env.MONGODB_URI);
const {default:User}=await import('../server/src/modules/auth/User.js');
if(!await User.exists({username:'supervisor1'}))throw new Error('PREPARED_SHOWCASE_REQUIRED');
const api=createApp().listen(4317,'127.0.0.1');
await new Promise((resolve,reject)=>{api.once('listening',resolve);api.once('error',reject);});
const app=express();
app.use('/api',(req,res)=>{
  const proxy=http.request({hostname:'127.0.0.1',port:4317,path:req.originalUrl,method:req.method,headers:req.headers},upstream=>{res.writeHead(upstream.statusCode,upstream.headers);upstream.pipe(res);});
  proxy.on('error',()=>res.status(502).end());req.pipe(proxy);
});
const dist=fileURLToPath(new URL('../client/dist/',import.meta.url));
app.use(express.static(dist));app.get('*',(_req,res)=>res.sendFile(dist+'index.html'));
const client=app.listen(5317,'127.0.0.1');
let stopping=false;
async function stop(){if(stopping)return;stopping=true;await Promise.all([new Promise(r=>client.close(r)),new Promise(r=>api.close(r))]);await disconnectDB();}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>stop().then(()=>process.exit(0)));
