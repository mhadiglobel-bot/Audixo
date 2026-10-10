import {useEffect,useRef,useState} from 'react'
import Seo from '../components/Seo'
import SiteShell from '../components/SiteShell'
import {downloadFile,mediaRequest,waitForJob,type MediaPreview,type MediaJob,type MediaKind} from '../services/media'

type Health={ready:boolean;authenticated?:boolean;maxConcurrent?:number;message?:string}
type SavedJob={id:string;title:string;format:MediaKind;quality:string}
const KEY='audixo-conversion-job-v39'
const qualities=['240','360','480','720','1080','1440'] as const
const shortTime=(seconds:number)=>!Number.isFinite(seconds)||seconds<=0?'Duration unavailable':[Math.floor(seconds/3600),Math.floor(seconds/60)%60,Math.floor(seconds%60)].filter((_,i)=>i>0||seconds>=3600).map((v,i)=>i===0?String(v):String(v).padStart(2,'0')).join(':')
function savedJob():SavedJob|null{try{const value=JSON.parse(sessionStorage.getItem(KEY)||'null');return value&&/^[\w-]{1,128}$/.test(value.id)&&['mp3','mp4'].includes(value.format)?value:null}catch{return null}}

export default function YouTubeConverter(){
 const [url,setUrl]=useState(''),[preview,setPreview]=useState<MediaPreview|null>(null)
 const [format,setFormat]=useState<MediaKind>('mp3'),[quality,setQuality]=useState('')
 const [busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[job,setJob]=useState<MediaJob|null>(null)
 const [permission,setPermission]=useState(false),[health,setHealth]=useState<Health|null>(null)
 const [saved,setSaved]=useState<SavedJob|null>(savedJob)
 const change=useRef(0),running=useRef<AbortController|null>(null)
 useEffect(()=>{
  let alive=true
  mediaRequest<Health>('health').then(h=>{if(alive)setHealth(h)}).catch(e=>{if(alive)setHealth({ready:false,message:e instanceof Error?e.message:'API health check failed.'})})
  return()=>{alive=false;running.current?.abort()}
 },[])
 const clear=()=>{change.current++;running.current?.abort();running.current=null;setUrl('');setPreview(null);setQuality('');setBusy('');setNotice('');setJob(null)}
 const updateUrl=(value:string)=>{change.current++;setUrl(value);setPreview(null);setQuality('');setJob(null);setNotice('')}
 const analyze=async()=>{
  const v=++change.current
  setBusy('Analyzing video…');setNotice('');setPreview(null);setQuality('');setJob(null)
  try{
   const info=await mediaRequest<MediaPreview>('meta',{url:url.trim()})
   if(v!==change.current)return
   setPreview(info)
   setQuality(info.qualities?.find(x=>x.value==='1080')?.value||info.qualities?.at(-1)?.value||'')
  }catch(e){if(v===change.current)setNotice(e instanceof Error?e.message:'Could not analyze video.')}
  finally{if(v===change.current)setBusy('')}
 }
 const save=(row:SavedJob)=>{setSaved(row);try{sessionStorage.setItem(KEY,JSON.stringify(row))}catch{}}
 const dropSaved=()=>{setSaved(null);try{sessionStorage.removeItem(KEY)}catch{}}
 const finish=async(record:SavedJob,controller:AbortController)=>{
  setBusy(`Preparing ${record.format.toUpperCase()}…`)
  const finished=await waitForJob(record.id,record.format,item=>{
   setJob(item)
   const percent=item.progress&&item.progress>0?` · ${Math.round(item.progress)}%`:''
   setBusy(item.state==='queued'?'Queued — waiting for the server…':`Processing ${record.format.toUpperCase()}${percent}…`)
  },controller.signal)
  setJob(finished)
  const file=finished.files?.[0]
  if(!file)throw Error('The API marked this job complete but returned no downloadable file.')
  downloadFile(file,record.title,record.format)
  dropSaved()
  setNotice(`${record.format.toUpperCase()} ready. Browser download requested as “${record.title} (Audixo ${record.format.toUpperCase()}).${record.format}”.${record.format==='mp3'?' Check the saved file for its actual bitrate.':''}`)
 }
 const start=async()=>{
  if(!preview||!permission||busy||(format==='mp4'&&!quality))return
  running.current?.abort();const controller=new AbortController();running.current=controller
  setNotice('');setJob(null);setBusy(`Starting ${format.toUpperCase()} job…`)
  try{
   const created=await mediaRequest<MediaJob>('convert',{url:preview.url,format,...(format==='mp4'?{quality}:{})},controller.signal)
   if(!created.id)throw Error('API did not return a job ID.')
   if(created.state==='failed')throw Error(created.error||'The server rejected this conversion.')
   setJob(created)
   const record:SavedJob={id:created.id,title:preview.title,format,quality:format==='mp3'?'320':quality}
   save(record)
   await finish(record,controller)
  }catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setNotice(e instanceof Error?e.message:'Conversion failed.')}
  finally{if(running.current===controller){running.current=null;setBusy('')}}
 }
 const resume=async()=>{
  if(!saved||busy)return
  running.current?.abort();const controller=new AbortController();running.current=controller
  setNotice('')
  try{await finish(saved,controller)}catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setNotice(e instanceof Error?e.message:'Could not restore job.')}
  finally{if(running.current===controller){running.current=null;setBusy('')}}
 }
 const stop=()=>{running.current?.abort();running.current=null;setBusy('');setNotice('Stopped checking progress. Your remote job may continue; use Resume previous job to check it later.')}
 const formats=[{id:'mp3' as const,title:'MP3 Audio',copy:'Audio only · fixed 320 kbps target',glyph:'♫'},{id:'mp4' as const,title:'MP4 Video',copy:'Video & sound · select resolution',glyph:'▶'}]
 return <SiteShell><Seo title="YouTube to MP3 & MP4 Downloader | AUDIXO" description="Analyze an authorized YouTube video and request an MP3 audio file at a 320 kbps encoding target, or select an API-supported MP4 video resolution." path="/tools/youtube-to-mp3"/>
  <main className="page-shell ax39-converter">
   <div className="ax39-converter-hero"><div><div className="ax25-kicker"><i/> AUDIXO / MEDIA CONVERTER</div><h1>One link.<br/><em>Sound or video.</em></h1><p>Choose MP3 audio or MP4 video in one clear workspace. Analyze the original title, select a supported format and let your conversion server handle the rest.</p><div className={`ax39-server ${health?.ready?'ready':health?'not-ready':'loading'}`}><i/>{health?.ready?'Conversion API connected':health?'Connection requires attention':'Checking API connection'}{health?.ready&&health.maxConcurrent?` · ${health.maxConcurrent} concurrent jobs`:''}</div></div><div className="ax39-hero-art" aria-hidden="true"><span className="ax39-art-orbit a"/><span className="ax39-art-orbit b"/><div className="ax39-art-disc"><span>♫</span></div><div className="ax39-art-chip one">MP3 · 320 kbps</div><div className="ax39-art-chip two">MP4 · up to 1440p*</div></div></div>
   <section className="ax39-converter-panel" aria-label="YouTube media converter">
    <div className="ax39-converter-top"><div><small>FORMAT</small><strong>What would you like to save?</strong></div><span>01 / 03</span></div>
    <div className="ax39-format-toggle" role="group" aria-label="Output file format">{formats.map(item=><button type="button" key={item.id} className={format===item.id?'active':''} aria-pressed={format===item.id} disabled={!!busy} onClick={()=>{setFormat(item.id);setNotice('')}}><span className="ax39-format-icon">{item.glyph}</span><span><strong>{item.title}</strong><small>{item.copy}</small></span><span className="ax39-format-selected">{format===item.id?'●':'○'}</span></button>)}</div>
    <div className="ax39-steps">
     <div className="ax39-step"><span className="ax39-step-num">01</span><div className="ax39-step-content"><h2>Paste your YouTube link</h2><p>A clean source preview appears after Analyze. Use × to clear the field instantly.</p><div className="ax39-urlbar"><div><span aria-hidden="true">↗</span><input aria-label="YouTube video URL" type="url" placeholder="Paste a YouTube video link…" value={url} disabled={!!busy} onChange={e=>updateUrl(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!busy&&url.trim())void analyze()}}/>{url&&<button className="ax39-clear" aria-label="Clear YouTube URL" title="Clear URL" type="button" onClick={clear}>×</button>}</div><button type="button" disabled={!!busy||!url.trim()} className="ax39-analyze" onClick={analyze}>{busy.startsWith('Analyzing')?'Checking…':'Analyze'} <span>↗</span></button></div>
       {preview&&<div className="ax39-preview"><img src={preview.thumbnail} alt="Video thumbnail" loading="lazy" referrerPolicy="no-referrer"/><div><small>VIDEO IDENTIFIED · {shortTime(preview.duration)}</small><strong title={preview.title}>{preview.title}</strong><span>{preview.author||'YouTube source'}</span></div><b>✓</b></div>}
      </div></div>
     <div className="ax39-step"><span className="ax39-step-num">02</span><div className="ax39-step-content"><h2>{format==='mp3'?'Premium MP3 audio':'Select video quality'}</h2>{format==='mp3'?<div className="ax39-fixed-quality"><span className="ax39-quality-icon">✧</span><div><strong>320 <small>kbps MP3</small></strong><p>Fixed high-quality encoding target. No confusing bitrate options.</p></div><span className="ax39-quality-pill">ONLY OPTION</span></div>:<><p>Choose a resolution that the API actually reports for this video. Unavailable choices remain disabled.</p><div className="ax39-quality-grid">{qualities.map(value=>{const available=preview?.qualities?.some(q=>q.value===value)===true;return <button type="button" key={value} className={quality===value&&available?'active':''} aria-pressed={quality===value&&available} disabled={!preview||!available||!!busy} onClick={()=>setQuality(value)}><strong>{value}p{value==='1080'&&<sup>HD</sup>}{value==='1440'&&<sup>QHD</sup>}</strong><small>{!preview?'Analyze first':available?'Available':'Not supported'}</small></button>})}</div>{preview&&(!preview.qualities||preview.qualities.length===0)&&<p className="ax39-quality-warning">The API did not return a supported MP4 resolution. Video download is disabled until preview reports one.</p>}</>}
       <p className="ax39-quality-foot">{format==='mp3'?'320 kbps is the requested MP3 output setting; YouTube source fidelity may be lower. Confirm actual encoding with a media inspector.':'1440p is available only where your source and REST YTDL API support it.'}</p>
      </div></div>
     <div className="ax39-step"><span className="ax39-step-num">03</span><div className="ax39-step-content"><h2>Prepare & download</h2><p>File name keeps the analyzed video title, followed by <b>(Audixo {format.toUpperCase()})</b>.</p><label className="ax39-permission"><input type="checkbox" checked={permission} onChange={e=>setPermission(e.target.checked)}/><span>I own this video or have permission to download or transform it.</span></label><button type="button" className="ax39-create" disabled={!preview||!permission||!!busy||(format==='mp4'&&!quality)} onClick={start}><span>{busy||`Download ${format.toUpperCase()}${format==='mp4'&&quality?` · ${quality}p`:''}`}</span><b>↓</b></button>
       {busy&&!busy.startsWith('Analyzing')&&<div className="ax39-progress" role="status"><div><strong>{busy}</strong><button onClick={stop}>Stop checking</button></div><span><i style={{width:`${Math.min(99,Math.max(3,Number(job?.progress)||3))}%`}}/></span><small>Conversion continues on the remote server. Long videos depend on backend capacity and serverless download limits.</small></div>}
       {saved&&!busy&&<button className="ax39-resume" onClick={resume}>↻ Resume earlier {saved.format.toUpperCase()} job</button>}
       {job?.files?.[0]&&!busy&&<button className="ax39-resume" onClick={()=>downloadFile(job.files![0],preview?.title||saved?.title||job.title||'YouTube video',job.format||format)}>↓ Download again</button>}
      </div></div>
    </div>
    <div className="ax39-converter-bottom"><span>✓ Original video title</span><span>✓ Private API proxy</span><span>✓ Background-job progress</span><span>✓ MP3 and MP4</span></div>
   </section>
   {health&&!health.ready&&<div role="status" className="ax39-alert">{health.message||'API connection is unavailable. Check your Vercel environment variables and API server authentication.'}</div>}
   {notice&&<div role="status" className="ax39-alert" data-type={/ready\. Browser download requested/.test(notice)?'success':'info'}>{notice}</div>}
  </main>
 </SiteShell>
}
