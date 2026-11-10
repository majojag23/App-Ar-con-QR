import puppeteer from 'puppeteer';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const p=await b.newPage();await p.setViewport({width:1000,height:1250});
p.on('requestfailed',r=>console.log('FAILED',r.url()));
await p.goto('https://ar.virtualelearning.co/imprimir.html',{waitUntil:'networkidle0'});
console.log('input:',await p.evaluate(()=>document.getElementById('url').value),'qr svg:',await p.evaluate(()=>!!document.querySelector('#qr svg')),'img ok:',await p.evaluate(()=>document.querySelector('.ancla').naturalWidth));
await p.screenshot({path:'test/live_print.png'});await b.close();
