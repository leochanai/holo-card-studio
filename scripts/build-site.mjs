import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web=path.join(root, 'web');
const output=path.join(root, 'dist');
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
for(const entry of await readdir(web, {withFileTypes:true})) {
  if(['assets','cards','previews'].includes(entry.name) || /\.(html|css|js|json)$/.test(entry.name) && !entry.name.startsWith('package')) {
    await cp(path.join(web,entry.name),path.join(output,entry.name),{recursive:true});
  }
}
await mkdir(path.join(output,'vendor/three'),{recursive:true});
for(const directory of ['build','examples/jsm']) {
  await cp(path.join(web,'node_modules/three',directory),path.join(output,'vendor/three',directory),{recursive:true});
}
for(const page of ['index.html','gallery.html','card.html']) {
  const filename=path.join(output,page);
  let html=await readFile(filename,'utf8');
  html=html.replaceAll('./node_modules/three/','./vendor/three/');
  if(page==='index.html') html=html.replace('</head>', '<script>if(new URLSearchParams(location.search).has("card"))location.replace("./card.html"+location.search+location.hash);</script></head>');
  await writeFile(filename,html);
}
await cp(path.join(web,'node_modules/three/LICENSE'),path.join(output,'vendor/three/LICENSE'));
console.log('Built static site in dist/');
