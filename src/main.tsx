import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/app.css'
import './styles/ax39.css'

document.documentElement.classList.add('audixo-light')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>
)

const loader=document.getElementById('audixo-loader')
// The intro is deliberately short; the hero never waits behind a six-second splash.
const duration=1400
const shortLine='MAKE • SHAPE • SOUND'
const slogan=document.getElementById('audixo-loader-slogan')
let cursor=0
const ticker=window.setInterval(()=>{
 if(!slogan||cursor>=shortLine.length){window.clearInterval(ticker);return}
 cursor+=1;slogan.textContent=shortLine.slice(0,cursor)
},37)
const finishIntro=()=>{
 window.clearInterval(ticker)
 loader?.classList.add('done')
 document.documentElement.dataset.audixoReady='true'
 window.dispatchEvent(new Event('audixo:loader-complete'))
}
window.setTimeout(finishIntro,duration)
window.setTimeout(()=>loader?.remove(),duration+500)
