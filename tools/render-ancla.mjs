import puppeteer from 'puppeteer';
import path from 'node:path';import {pathToFileURL} from 'node:url';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage();await p.setViewport({width:1500,height:1000});
await p.goto(pathToFileURL(path.resolve('tools/ancla.html')).href);await p.waitForFunction('window.READY');
await p.screenshot({path:'assets/ancla.png',clip:{x:0,y:0,width:1500,height:1000}});await b.close();console.log('ok');
