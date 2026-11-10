import puppeteer from 'puppeteer';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',
 args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+process.cwd()+'/test/cam.mjpeg','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:390,height:694,deviceScaleFactor:1,isMobile:true,hasTouch:true});
p.on('pageerror',e=>console.log('[pageerror]',e.message));
await p.goto('http://localhost:8099/index.html?debug=1',{waitUntil:'load'});await p.click('#b-start');
await p.waitForFunction('window.__ar&&window.__ar.targetVisible',{timeout:60000});
await new Promise(r=>setTimeout(r,1500));
console.log(await p.evaluate(()=>{const d=window.__ar.dbg();const s=d.swirl;const pos=s.geometry.attributes.position.array;return JSON.stringify({T:window.__ar.T,op:s.material.opacity,vis:s.visible,p0:[pos[0],pos[1],pos[2]],p100:[pos[300],pos[301],pos[302]],camNear:d.camera.near,camFar:d.camera.far,camfov:d.camera.fov,root:d.root.parent&&d.root.parent.type,scale:d.panelG.scale.x,anchorPos:d.anchor.group.position.toArray(),anchorScale:d.anchor.group.scale.toArray()})}));
await p.evaluate(()=>{const d=window.__ar.dbg();d.panelMesh.visible=false;d.glowFrame.visible=false;});
await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:'test/probe.png'});await b.close();
