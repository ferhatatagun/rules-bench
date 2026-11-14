const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){await p.goto('file://'+process.cwd()+'/'+f);await p.screenshot({path:f.replace('.html','.png')});}
await b.close();})();
