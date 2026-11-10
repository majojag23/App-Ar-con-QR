import puppeteer from 'puppeteer';
const url=process.argv[2]||'http://localhost:8099/index.html';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.cwd()+'/test/cam.mjpeg','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:390,height:694,deviceScaleFactor:1,isMobile:true,hasTouch:true});
p.on('pageerror',e=>console.log('[pageerror]',e.message));
await p.goto(url,{waitUntil:'load'});await p.click('#b-start');
await p.waitForFunction('window.__ar&&window.__ar.targetVisible',{timeout:60000});
await new Promise(r=>setTimeout(r,9000));
const j=await p.evaluate('JSON.stringify(window.__ar.jit())');const d=JSON.parse(j);
const std=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)};
const comp=arr=>[0,1,2,3,4,5,6].map(k=>std(arr.map(r=>r[k])));
const rp=comp(d.raw),op=comp(d.out);
const pos=a=>Math.hypot(a[0],a[1],a[2]), rot=a=>Math.hypot(a[3],a[4],a[5],a[6]);
// diferencia frame a frame (temblor visible)
const step=arr=>{let s=0,sr=0;for(let i=1;i<arr.length;i++){s+=Math.hypot(arr[i][0]-arr[i-1][0],arr[i][1]-arr[i-1][1],arr[i][2]-arr[i-1][2]);sr+=Math.hypot(arr[i][3]-arr[i-1][3],arr[i][4]-arr[i-1][4],arr[i][5]-arr[i-1][5],arr[i][6]-arr[i-1][6])}return [s/(arr.length-1),sr/(arr.length-1)]};
const sr=step(d.raw),so=step(d.out);
console.log('muestras',d.raw.length);
console.log('desv. posición  (anchos de tarjeta)  crudo',pos(rp).toFixed(5),' estabilizado',pos(op).toFixed(5));
console.log('salto medio por cuadro posición     crudo',sr[0].toFixed(5),' estabilizado',so[0].toFixed(5));
console.log('salto medio por cuadro rotación     crudo',sr[1].toFixed(5),' estabilizado',so[1].toFixed(5));
// retraso: distancia media out vs raw
let lag=0;for(let i=0;i<d.raw.length;i++)lag+=Math.hypot(d.raw[i][0]-d.out[i][0],d.raw[i][1]-d.out[i][1],d.raw[i][2]-d.out[i][2]);console.log('desfase medio out vs crudo',(lag/d.raw.length).toFixed(5));
await p.screenshot({path:process.argv[3]||'test/jit.png'});await b.close();
