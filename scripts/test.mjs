import {build} from 'esbuild'
import {mkdir,rm,writeFile} from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {Worker} from 'node:worker_threads'
await mkdir('.test',{recursive:true})
await build({entryPoints:['tests/editor.test.ts'],outdir:'.test',outExtension:{'.js':'.mjs'},bundle:true,platform:'node',format:'esm'})
const result=spawnSync(process.execPath,['--test','.test/editor.test.mjs'],{stdio:'inherit'})
if(result.status)process.exit(result.status)
await build({entryPoints:['src/editor/mp3.worker.ts'],outfile:'.test/mp3.mjs',bundle:true,platform:'node',format:'esm'})
await writeFile('.test/worker-runner.mjs',`import {parentPort} from 'node:worker_threads';globalThis.self={postMessage:data=>parentPort.postMessage(data)};await import('./mp3.mjs');parentPort.on('message',data=>self.onmessage({data}));`)
for(const kbps of [128,320]){
 const data=await new Promise((resolve,reject)=>{const w=new Worker(new URL('../.test/worker-runner.mjs',import.meta.url));w.on('error',reject);w.once('message',message=>{w.terminate();message.error?reject(new Error(message.error)):resolve(message.blob)});const channels=[new Float32Array(88200),new Float32Array(88200)];for(let i=0;i<88200;i++){channels[0][i]=.2*Math.sin(2*Math.PI*440*i/44100);channels[1][i]=channels[0][i]}w.postMessage({channels,sampleRate:44100,kbps})})
 const file=`.test/encoded-${kbps}.mp3`;await writeFile(file,Buffer.from(await data.arrayBuffer()));const check=spawnSync('ffprobe',['-v','error','-show_entries','stream=bit_rate,duration,codec_name','-of','json',file],{encoding:'utf8'});if(check.status)throw new Error(check.stderr);const stream=JSON.parse(check.stdout).streams[0];if(Number(stream.bit_rate)!==kbps*1000)throw new Error(`Wrong bitrate: ${stream.bit_rate}`);console.log(`Real background MP3 encoding verified: ${kbps} kbps, ${stream.codec_name}, ${stream.duration}s`)
}
await build({entryPoints:['src/services/audioSlices.ts'],outfile:'.test/slices.mjs',bundle:true,platform:'node',format:'esm'})
const {sliceAudio}=await import('../.test/slices.mjs')
const {readFile}=await import('node:fs/promises')
for(const kbps of [128,320]){
 const result=await sliceAudio(new Blob([await readFile(`.test/encoded-${kbps}.mp3`)]),[{start:.25,end:.6},{start:.8,end:1.5}]);const file=`.test/cut-${kbps}.mp3`;await writeFile(file,Buffer.from(await result.blob.arrayBuffer()));const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=duration,bit_rate','-of','json',file],{encoding:'utf8'});if(probe.status)throw new Error(probe.stderr);const info=JSON.parse(probe.stdout).streams[0];if(Math.abs(Number(info.duration)-1.05)>.12||Number(info.bit_rate)!==kbps*1000)throw new Error('Local MP3 cut output failed verification');console.log(`Local frame-cut MP3 verified: ${kbps} kbps, ${info.duration}s`)
}
const long=spawnSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','anullsrc=r=8000:cl=mono','-t','7200','-c:a','libmp3lame','-b:a','8k','.test/two-hour.mp3'],{encoding:'utf8'});if(long.status)throw new Error(long.stderr)
const ending=await sliceAudio(new Blob([await readFile('.test/two-hour.mp3')]),[{start:7198,end:7200}]);await writeFile('.test/ending.mp3',Buffer.from(await ending.blob.arrayBuffer()));const endProbe=spawnSync('ffprobe',['-v','error','-show_entries','stream=duration','-of','json','.test/ending.mp3'],{encoding:'utf8'});if(endProbe.status||Math.abs(Number(JSON.parse(endProbe.stdout).streams[0].duration)-2)>.16)throw new Error('Two-hour MP3 ending failed');console.log('Real two-hour MP3 indexed locally; final two seconds exported successfully.')
await rm('.test',{recursive:true,force:true})
