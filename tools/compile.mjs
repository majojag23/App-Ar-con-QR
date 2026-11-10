import puppeteer from 'puppeteer';import fs from 'node:fs';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const p=await b.newPage();p.on('console',m=>console.log('[page]',m.text()));p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto('http://localhost:8099/tools/compile.html');
await p.waitForFunction('window.DONE',{timeout:300000});
const d=await p.evaluate('window.MIND_B64');fs.writeFileSync('assets/ancla.mind',Buffer.from(d,'base64'));
console.log('mind bytes',fs.statSync('assets/ancla.mind').size);await b.close();
