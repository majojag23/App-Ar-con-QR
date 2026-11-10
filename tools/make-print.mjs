// Genera la hoja imprimible (PDF) y el QR (PNG) apuntando a la URL publicada.
import puppeteer from 'puppeteer';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const URL_AR = process.argv[2] || 'https://ar.virtualelearning.co/';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 900, height: 1300 });
await p.goto(pathToFileURL(path.resolve('imprimir.html')).href);
await p.evaluate(u => { document.getElementById('url').value = u; document.getElementById('gen').click(); }, URL_AR);
await p.pdf({ path: 'entrega/tarjeta-AR-virtual-elearning.pdf', format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
const svg = await p.evaluate(() => document.querySelector('#qr').innerHTML);
const q = await b.newPage();
await q.setViewport({ width: 1024, height: 1024 });
await q.setContent('<body style="margin:0;background:#fff;display:grid;place-items:center;height:100vh"><div style="width:896px;height:896px">' + svg.replace('<svg', '<svg style="width:100%;height:100%;shape-rendering:crispEdges"') + '</div></body>');
await q.screenshot({ path: 'entrega/qr-ar-virtual-elearning.png' });
await b.close();
console.log('ok', URL_AR);
