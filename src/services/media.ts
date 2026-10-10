export type MediaKind='mp3'|'mp4'
export type MediaQuality={value:string;label:string}
export type MediaPreview={url:string;title:string;author:string;duration:number;thumbnail:string;qualities:MediaQuality[]}
export type MediaJob={
 id:string;format?:MediaKind;state:'queued'|'processing'|'complete'|'failed';message?:string;error?:string;
 title?:string;duration?:number;progress?:number;reportedKbps?:number;
 files?:{name:string;url:string;fileName:string}[]
}
export async function mediaRequest<T=any>(action:string,body:Record<string,unknown>={},signal?:AbortSignal):Promise<T>{
 const res=await fetch(`/api/media?action=${encodeURIComponent(action)}`,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal,cache:'no-store'
 })
 const data=await res.json().catch(()=>({error:'The conversion server returned an unreadable response.'}))
 if(!res.ok)throw new Error(data.error||`Media API failed (${res.status}).`)
 return data
}
/** Poll the remote background job. Do not cancel remote conversion on client navigation. */
export async function waitForJob(id:string,format:MediaKind,onUpdate:(job:MediaJob)=>void,signal?:AbortSignal){
 const started=Date.now();let failures=0
 for(;;){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError')
  if(Date.now()-started>90*60_000)throw new Error('The job is still taking too long. Save its ID to check again; the server may still be processing.')
  try{
   const job=await mediaRequest<MediaJob>('status',{id,format},signal)
   failures=0;onUpdate(job)
   if(job.state==='complete')return job
   if(job.state==='failed')throw new Error('Conversion failed: '+(job.error||'Processing server reported an error.'))
  }catch(e){
   if(signal?.aborted)throw e
   if(e instanceof Error&&/Conversion failed:|Invalid job ID|authentication|401|403/i.test(e.message))throw e
   if(++failures>=4)throw e
  }
  const interval=failures?6000:Date.now()-started<20_000?2100:Date.now()-started<100_000?3500:6000
  await new Promise<void>((resolve,reject)=>{
   const timer=window.setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve()},interval)
   const stop=()=>{window.clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'))}
   signal?.addEventListener('abort',stop,{once:true})
  })
 }
}
const cleanTitle=(s:string)=>s.replace(/[\\/<>|:*?"\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,145)||'YouTube video'
export function downloadFile(file:{url:string;fileName:string},title:string,format:MediaKind){
 const url=new URL(file.url,window.location.href)
 if(url.origin!==window.location.origin||url.pathname!=='/api/media'||url.searchParams.get('action')!=='file')throw new Error('Invalid media download location.')
 url.searchParams.set('format',format);url.searchParams.set('title',cleanTitle(title))
 const a=document.createElement('a');a.href=url.href;a.download=`${cleanTitle(title)} (Audixo ${format.toUpperCase()}).${format}`;a.rel='noreferrer';document.body.append(a);a.click();a.remove()
}
export function localMetadata(file:File):Promise<number>{return new Promise((resolve,reject)=>{
 const a=document.createElement('audio'),url=URL.createObjectURL(file),timer=setTimeout(()=>finish(new Error('Metadata timeout')),15000)
 const finish=(error?:Error)=>{clearTimeout(timer);const duration=a.duration;a.removeAttribute('src');a.load();URL.revokeObjectURL(url);error?reject(error):resolve(duration)}
 a.preload='metadata';a.onloadedmetadata=()=>Number.isFinite(a.duration)?finish():finish(new Error('Unknown duration'));a.onerror=()=>finish(new Error('Unsupported audio format'));a.src=url
})}
