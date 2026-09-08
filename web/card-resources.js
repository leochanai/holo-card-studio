import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {configPath} from './catalog.js';

const cache=new Map(), textureLoader=new THREE.TextureLoader(), modelLoader=new GLTFLoader();
const limit=3;
let retained=new Set();

function dispose(resources){
 resources.textures.forEach(texture=>texture.dispose());
 resources.model.traverse(object=>{
  if(!object.isMesh)return;
  object.geometry.dispose();
  const materials=Array.isArray(object.material)?object.material:[object.material];
  materials.forEach(material=>material.dispose());
 });
}

function trim(){
 for(const [id,entry] of cache){
  if(cache.size<=limit)break;
  // Never release a displayed/requested card, or a load that has not settled.
  if(retained.has(id)||!entry.resources)continue;
  cache.delete(id);dispose(entry.resources);
 }
}

export function retainCards(...ids){retained=new Set(ids);trim();}

export function loadCardResources(id){
 let entry=cache.get(id);
 if(entry){cache.delete(id);cache.set(id,entry);return entry.promise;}
 entry={};cache.set(id,entry);
 entry.promise=(async()=>{
  const response=await fetch(configPath(id));
  if(!response.ok)throw Error('找不到卡牌配置');
  const config=await response.json();
  // Start the model and all artwork together, instead of serial loading.
  const results=await Promise.allSettled([
   ...['subject','background','lineart'].map(name=>textureLoader.loadAsync(config.assets[name])),
   modelLoader.loadAsync(config.assets.model)
  ]);
  const failure=results.find(result=>result.status==='rejected');
  if(failure){
   results.slice(0,3).forEach(result=>{if(result.status==='fulfilled')result.value.dispose();});
   if(results[3].status==='fulfilled')dispose({textures:[],model:results[3].value.scene});
   throw failure.reason;
  }
  const textures=results.slice(0,3).map(result=>result.value);
  textures.forEach(texture=>{texture.colorSpace=THREE.NoColorSpace;});
  entry.resources={config,textures,model:results[3].value.scene};
  trim();return entry.resources;
 })().catch(error=>{cache.delete(id);throw error;});
 return entry.promise;
}
