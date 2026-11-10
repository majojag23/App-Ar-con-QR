import puppeteer from 'puppeteer';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const p=await b.newPage();await p.setViewport({width:900,height:1500});p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto('http://localhost:8099/imprimir.html');await p.screenshot({path:'test/print.png',fullPage:true});await b.close();
