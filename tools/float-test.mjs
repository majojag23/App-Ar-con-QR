import puppeteer from 'puppeteer';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.cwd()+'/test/cam.mjpeg','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:390,height:694,deviceScaleFactor:1,isMobile:true,hasTouch:true});
p.on('console',m=>{const t=m.text();if(!/GL Driver|404|deprecated/.test(t))console.log('[page]',m.type(),t.slice(0,300))});p.on('pageerror',e=>console.log('[pageerror]',e.message));
await p.goto('http://localhost:8099/index.html?float=1',{waitUntil:'load'});await p.click('#b-start');
await p.waitForFunction('window.__ar&&window.__ar.running',{timeout:60000});
await new Promise(r=>setTimeout(r,500));
await p.evaluate('window.__ar.step(2.6)');await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'test/f_1.png'});
await p.evaluate('window.__ar.step(12)');await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'test/f_2.png'});
// tocar menú "Progreso" (índice 2)
let pt=await p.evaluate('window.__ar.project(112,322)');console.log('menu2',pt);
await p.mouse.click(pt[0],pt[1]);await p.evaluate('window.__ar.step(1.3)');await new Promise(r=>setTimeout(r,300));
console.log('tab',await p.evaluate('window.__ar.tab'));await p.screenshot({path:'test/f_3.png'});
// tocar ícono 3 (Logros)
pt=await p.evaluate('window.__ar.iconPos(3)');console.log('icon3',pt);await p.mouse.click(pt[0],pt[1]);await p.evaluate('window.__ar.step(1.3)');await new Promise(r=>setTimeout(r,300));
console.log('tab',await p.evaluate('window.__ar.tab'));
// botón Descargar
pt=await p.evaluate('window.__ar.project(695,505)');console.log('dl',pt);await p.mouse.click(pt[0],pt[1]);await p.evaluate('window.__ar.step(0.7)');await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'test/f_4.png'});
pt=await p.evaluate('window.__ar.ctaPos()');console.log('cta',pt);
await b.close();
