const fs=require('node:fs');const path=require('node:path');
const root=__dirname;const dist=path.join(root,'dist');fs.mkdirSync(dist,{recursive:true});
for(const file of ['index.html','refinements.css','refinements.js','styles.css','script.js','resume.html','assets','about','hobbies','.nojekyll'])fs.cpSync(path.join(root,file),path.join(dist,file),{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)){if(!fs.existsSync(path.join(dist,m[1].split('?')[0])))throw new Error('Missing asset: '+m[1]);}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);if(new Set(ids).size!==ids.length)throw new Error('Duplicate IDs');
for(const m of html.matchAll(/href="#([^"]+)"/g)){if(!ids.includes(m[1]))throw new Error('Missing anchor '+m[1]);}
console.log('Static site prepared; local assets and navigation anchors verified.');


