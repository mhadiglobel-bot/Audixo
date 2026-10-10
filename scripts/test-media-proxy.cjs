// AUDIXO V39 simulated upstream API contract tests. These do not test the live user's API.
const assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module')
const {PassThrough}=require('node:stream')
const ts=require('typescript')
const source=path.join(process.cwd(),'api/media.ts')
const js=ts.transpileModule(fs.readFileSync(source,'utf8'),{fileName:source,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
const m=new Module(source,module);m.filename=source;m.paths=module.paths;m._compile(js,source)
const handler=m.exports.default
function response(){const x=new PassThrough();x.statusCode=200;x.headers={};x.setHeader=(k,v)=>x.headers[k]=v;x.status=n=>{x.statusCode=n;return x};x.json=v=>{x.payload=v;return x};return x}
async function call(action,body={},method='POST',query={}){const r=response();await handler({query:{action,...query},method,body},r);return r}
const url='https://www.youtube.com/watch?v=abcdefghijk';const title='Beautiful Coastline - A creative mix'
let calls=[]
let previewPayload={ok:true,data:{title,duration:7201,channel:'Official artist',qualities:[{value:'720',label:'720p'},{value:'1080',label:'1080p'},{value:'2160',label:'2160p'}]}}
global.fetch=async(requestUrl,options)=>{
 calls.push({url:String(requestUrl),body:options.body?JSON.parse(options.body):null,headers:options.headers})
 const route=String(requestUrl).split('https://ytdl.tiers.rest')[1]
 if(route==='/ytdl/status')return new Response(JSON.stringify({ok:true,authenticated:true,max_concurrent:2}),{headers:{'content-type':'application/json'}})
 if(route==='/api/preview')return new Response(JSON.stringify(previewPayload),{headers:{'content-type':'application/json'}})
 if(route==='/api/download')return new Response(JSON.stringify({ok:true,job_id:options.body?.includes('"mp4"')?'job_mp4':'job_mp3',status:'queued'}),{headers:{'content-type':'application/json'}})
 if(route?.includes('/api/download/status/'))return new Response(JSON.stringify({status:'completed',job_id:route.split('/').at(-1)}),{headers:{'content-type':'application/json'}})
 if(route?.includes('/api/download/file/')){
  const mp4=route.endsWith('job_mp4')
  return new Response(mp4?Uint8Array.from([0,0,0,20,102,116,121,112]):Uint8Array.from([73,68,51,4,0,0]),{headers:{'content-type':mp4?'video/mp4':'audio/mpeg'}})
 }
 throw Error('Unexpected fake endpoint: '+route)
}
;(async()=>{
 delete process.env.AUDIXO_YTDL_BASE_URL
 let r=await call('health');assert.equal(r.payload.ready,false)
 process.env.AUDIXO_YTDL_BASE_URL='https://ytdl.tiers.rest'
 process.env.AUDIXO_YTDL_AUTH_TOKEN='sample-test-secret'
 r=await call('health');assert.equal(r.payload.ready,true);assert.equal(r.payload.maxConcurrent,2)
 r=await call('meta',{url});assert.equal(r.payload.duration,7201);assert.equal(r.payload.title,title)
 assert.deepEqual(r.payload.qualities.map(q=>q.value),['720','1080'])
 assert.deepEqual(calls.at(-1).body,{url})
 // The live API contract can place qualities outside data, or in nested formats.
 previewPayload={ok:true,title,qualities:[{value:'480p'},{value:'1080p'}]}
 r=await call('meta',{url});assert.deepEqual(r.payload.qualities.map(q=>q.value),['480','1080'])
 previewPayload={ok:true,data:{title},qualities:[{height:720},{resolution:'1920x1080'}]}
 r=await call('meta',{url});assert.deepEqual(r.payload.qualities.map(q=>q.value),['720','1080'])
 previewPayload={ok:true,result:{data:{title,metadata:{formats:{mp4:['240p','360p',{quality:'1440p'}]}}}}}
 r=await call('meta',{url});assert.deepEqual(r.payload.qualities.map(q=>q.value),['240','360','1440'])
 previewPayload={ok:true,data:{title}}
 r=await call('meta',{url});assert.deepEqual(r.payload.qualities,[])
 // The frontend explicitly enables an unverified Try mode for this case.
 const ui=fs.readFileSync(path.join(process.cwd(),'src/pages/YouTubeConverter.tsx'),'utf8')
 assert.ok(ui.includes('Try - unverified')&&ui.includes('!reported||available'))
 r=await call('convert',{url,format:'mp3'});assert.equal(r.payload.id,'job_mp3');assert.equal(r.payload.requestedQuality,'320')
 assert.deepEqual(calls.at(-1).body,{url,format:'mp3',bitrate:320})
 assert.equal(calls.at(-1).headers.Authorization,'Bearer sample-test-secret')
 r=await call('convert',{url,format:'mp4',quality:'1080'});assert.equal(r.payload.id,'job_mp4');assert.equal(r.payload.requestedQuality,'1080')
 assert.deepEqual(calls.at(-1).body,{url,format:'mp4',quality:'1080'})
 r=await call('status',{id:'job_mp4',format:'mp4'});assert.equal(r.payload.state,'complete');assert.equal(r.payload.files[0].name,'MP4')
 r=await call('status',{id:'job_mp3',format:'mp3'});assert.equal(r.payload.files[0].name,'MP3')
 r=await call('convert',{url,format:'mp4',quality:'99'});assert.equal(r.statusCode,400)
 r=await call('convert',{url:'https://bad.example/watch?v=abcdefghijk',format:'mp3'});assert.equal(r.statusCode,400)
 r=await call('status',{id:'../../etc/passwd',format:'mp4'});assert.equal(r.statusCode,400)
 async function download(id,format,expectedType,expectedFilename){
  const raw=response(),buf=[];raw.on('data',d=>buf.push(d))
  await handler({method:'GET',query:{action:'file',id,format,title},body:{}},raw)
  assert.ok(Buffer.concat(buf).length>4)
  assert.equal(raw.headers['Content-Type'],expectedType)
  assert.ok(raw.headers['Content-Disposition'].includes(encodeURIComponent(expectedFilename).replace(/[\'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())))
 }
 await download('job_mp3','mp3','audio/mpeg',`${title} (Audixo MP3).mp3`)
 await download('job_mp4','mp4','video/mp4',`${title} (Audixo MP4).mp4`)
 assert.ok(calls.every(row=>row.url.startsWith('https://ytdl.tiers.rest/')))
 console.log('PASS offline API contract and MP4 quality-shape checks: API health, 2-hour metadata, available qualities, formats, 320 target, job polling, MP3 & MP4 streams, exact sanitized filename, auth, invalid input.')
 console.log('NOTE: 2-hour duration is only mock metadata, not a real 2-hour conversion test. Live upstream, MP3 bitrate and Vercel streaming remain unverified.')
})().catch(e=>{console.error(e);process.exit(1)})
