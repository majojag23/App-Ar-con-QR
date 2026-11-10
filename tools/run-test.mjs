import puppeteer from 'puppeteer';
const url=process.argv[2]||'http://localhost:8099/index.html?debug=1';
const shots=(process.argv[3]||'3,6,9,13').split(',').map(Number);
const out=process.argv[4]||'test/shot';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.cwd()+'/test/cam.mjpeg','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:390,height:694,deviceScaleFactor:1,isMobile:true,hasTouch:true});
p.on('console',m=>console.log('[page]',m.type(),m.text().slice(0,300)));p.on('pageerror',e=>console.log('[pageerror]',e.message));
await p.goto(url,{waitUntil:'load'});
await p.screenshot({path:out+'_start.png'});
await p.click('#b-start');
let t0=Date.now();
for(const s of shots){ const wait=s*1000-(Date.now()-t0); if(wait>0) await new Promise(r=>setTimeout(r,wait)); await p.screenshot({path:out+'_'+s+'.png'}); const st=await p.evaluate('window.__ar?{T:window.__ar.T,tab:window.__ar.tab,run:window.__ar.running,tv:window.__ar.targetVisible}:null'); console.log('t',s,JSON.stringify(st)); }
await b.close();
