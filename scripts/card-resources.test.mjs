import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source=await readFile(new URL('../web/card-resources.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 return {promise,resolve,reject};
}

function disposable(){
 return {disposals:0,dispose(){this.disposals++;}};
}

async function createHarness(){
 const requests=[],fetches=[],attempts=new Map();
 const noColorSpace='test-no-color-space';
 function request(url,type){
  const pending=deferred();
  const resource=type==='texture'?disposable():{
   meshes:[
    {isMesh:true,geometry:disposable(),material:disposable()},
    {isMesh:true,geometry:disposable(),material:[disposable(),disposable()]}
   ],
   traverse(visit){visit({isMesh:false});this.meshes.forEach(visit);}
  };
  const entry={url,type,resource,...pending};
  requests.push(entry);
  return pending.promise;
 }
 const context=vm.createContext({
  fetch:async url=>{
   fetches.push(url);
   const id=url.split('/')[1],attempt=(attempts.get(id)||0)+1;
   attempts.set(id,attempt);
   return {ok:true,json:async()=>({id,assets:Object.fromEntries(
    ['subject','background','lineart','model'].map(name=>[name,`${id}/${attempt}/${name}`])
   )})};
  }
 });
 const three=new vm.SyntheticModule(['TextureLoader','NoColorSpace'],function(){
  this.setExport('TextureLoader',class{loadAsync(url){return request(url,'texture');}});
  this.setExport('NoColorSpace',noColorSpace);
 },{context});
 const gltf=new vm.SyntheticModule(['GLTFLoader'],function(){
  this.setExport('GLTFLoader',class{loadAsync(url){return request(url,'model');}});
 },{context});
 const catalog=new vm.SyntheticModule(['configPath'],function(){
  this.setExport('configPath',id=>`config/${id}`);
 },{context});
 const module=new vm.SourceTextModule(source,{context});
 await module.link(specifier=>({
  three,'three/addons/loaders/GLTFLoader.js':gltf,'./catalog.js':catalog
 })[specifier]);
 await module.evaluate();
 const {loadCardResources,retainCards}=module.namespace;
 const cardRequests=(id,attempt=attempts.get(id))=>requests.filter(entry=>entry.url.startsWith(`${id}/${attempt}/`));
 function finish(id,{attempt=attempts.get(id),failure}={}){
  for(const entry of cardRequests(id,attempt)){
   if(entry.url.endsWith(`/${failure?.name}`))entry.reject(failure.error);
   else entry.resolve(entry.type==='model'?{scene:entry.resource}:entry.resource);
  }
 }
 async function load(id){
  const promise=loadCardResources(id);
  await flush();finish(id);
  return promise;
 }
 function disposalCounts(id,attempt=attempts.get(id)){
  return cardRequests(id,attempt).flatMap(entry=>entry.type==='texture'?[entry.resource.disposals]:
   entry.resource.meshes.flatMap(mesh=>[mesh.geometry,...[].concat(mesh.material)].map(value=>value.disposals)));
 }
 function assertDisposed(id,count,attempt){
  const counts=disposalCounts(id,attempt);
  assert.equal(counts.length,8,`all textures, geometries and materials of ${id} exist`);
  assert.ok(counts.every(value=>value===count),`${id} disposal counts: ${counts}`);
 }
 return {loadCardResources,retainCards,load,finish,requests,fetches,attempts,cardRequests,assertDisposed,noColorSpace};
}

test('deduplicates a card and starts its model and three textures together',async()=>{
 const h=await createHarness();
 const first=h.loadCardResources('001'),second=h.loadCardResources('001');
 assert.strictEqual(first,second);
 await flush();
 assert.deepEqual(h.fetches,['config/001']);
 assert.deepEqual(h.cardRequests('001').map(entry=>entry.url.split('/').at(-1)).sort(),
  ['background','lineart','model','subject']);
 // No individual asset has resolved yet: all four must already be in flight.
 h.finish('001');
 const resources=await first;
 assert.equal(resources.config.id,'001');
 assert.equal(resources.textures.length,3);
 assert.ok(resources.textures.every(texture=>texture.colorSpace===h.noColorSpace));
 assert.strictEqual(await h.loadCardResources('001'),resources);
 assert.equal(h.fetches.length,1);
 h.assertDisposed('001',0);
});

test('evicts the least recently used completed card beyond three and releases every resource',async()=>{
 const h=await createHarness();
 for(const id of ['001','002','003'])await h.load(id);
 await h.loadCardResources('001');
 await h.load('004');
 h.assertDisposed('002',1);
 for(const id of ['001','003','004'])h.assertDisposed(id,0);
 await h.load('005');
 h.assertDisposed('003',1);
 h.assertDisposed('002',1);
 for(const id of ['001','004','005'])h.assertDisposed(id,0);
 await h.load('002');
 assert.equal(h.attempts.get('002'),2,'an evicted card loads fresh resources');
 h.assertDisposed('002',1,1);
 h.assertDisposed('002',0,2);
});

test('protects displayed/requested cards and does not release unfinished loads',async()=>{
 const h=await createHarness();
 h.retainCards('001');
 await h.load('001');
 const second=h.loadCardResources('002'),third=h.loadCardResources('003');
 h.retainCards('001','004');
 await h.load('004');
 for(const id of ['001','002','003','004'])h.assertDisposed(id,0);
 assert.strictEqual(h.loadCardResources('003'),third,'an unfinished load stays deduplicated');
 h.finish('002');await second;
 h.assertDisposed('002',1);
 for(const id of ['001','003','004'])h.assertDisposed(id,0);
 h.finish('003');await third;
 h.assertDisposed('003',0);
 h.assertDisposed('001',0);
 h.assertDisposed('004',0);
});

test('preloading the new neighbor preserves the card just viewed',async()=>{
 const h=await createHarness();
 const previous=await h.load('001');
 await h.load('002');
 await h.load('020');
 h.retainCards('002','003','001');
 await h.load('003');
 h.assertDisposed('020',1);
 for(const id of ['001','002','003'])h.assertDisposed(id,0);
 const before=h.fetches.length;
 assert.strictEqual(await h.loadCardResources('001'),previous);
 assert.equal(h.fetches.length,before,'returning to the previous card needs no download');
});

test('cleans up a partially failed load and allows the same card to retry',async()=>{
 const h=await createHarness(),failure=new Error('texture download failed');
 const failed=h.loadCardResources('007');
 const rejected=assert.rejects(failed,error=>error===failure);
 await flush();
 h.finish('007',{failure:{name:'background',error:failure}});
 await rejected;
 for(const entry of h.cardRequests('007')){
  if(entry.type==='texture')assert.equal(entry.resource.disposals,entry.url.endsWith('/background')?0:1);
  else for(const mesh of entry.resource.meshes){
   assert.equal(mesh.geometry.disposals,1);
   for(const material of [].concat(mesh.material))assert.equal(material.disposals,1);
  }
 }
 const resources=await h.load('007');
 assert.equal(h.attempts.get('007'),2);
 assert.equal(resources.config.id,'007');
 h.assertDisposed('007',0,2);
});

test('cleans up all textures when the model fails',async()=>{
 const h=await createHarness(),failure=new Error('model download failed');
 const failed=h.loadCardResources('008');
 const rejected=assert.rejects(failed,error=>error===failure);
 await flush();
 h.finish('008',{failure:{name:'model',error:failure}});
 await rejected;
 assert.ok(h.cardRequests('008').filter(entry=>entry.type==='texture').every(entry=>entry.resource.disposals===1));
 await h.load('008');
 h.assertDisposed('008',0,2);
});

test('late results after rapid card changes remain bounded and never release the active card',async()=>{
 const h=await createHarness();
 h.retainCards('001');await h.load('001');
 h.retainCards('001','002');const second=h.loadCardResources('002');
 h.retainCards('001','003');const third=h.loadCardResources('003');
 h.retainCards('001','004');await h.load('004');
 h.retainCards('004','005');await h.load('005');
 h.assertDisposed('001',1);
 h.finish('003');await third;
 h.assertDisposed('003',1);
 h.finish('002');await second;
 h.assertDisposed('002',0);
 h.retainCards('005','006');await h.load('006');
 h.assertDisposed('002',1);
 for(const id of ['004','005','006'])h.assertDisposed(id,0);
 const before=h.fetches.length;
 await h.loadCardResources('005');
 assert.equal(h.fetches.length,before,'the active card remains usable from cache');
 for(const id of ['001','002','003'])h.assertDisposed(id,1);
});
