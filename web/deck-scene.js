import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const mix=THREE.MathUtils.lerp;

// A small, actual 3D box: cards live between the walls and leave through its lid.
export async function createDeckScene(host, catalog, {onHandLayout=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setClearColor(0x080c0c,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.25;
 host.append(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(33,1,.1,100);
 camera.position.set(0,1.6,12.5);camera.zoom=1.65;camera.lookAt(0,.1,0);
 const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
 const environment=pmrem.fromScene(room,.04);
 scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xe3fff1,0x163629,3));
 const key=new THREE.DirectionalLight(0xffefda,4);key.position.set(-3,5,6);scene.add(key);
 const rim=new THREE.DirectionalLight(0x92d5b8,3);rim.position.set(4,2,-1);scene.add(rim);
 const rig=new THREE.Group();rig.rotation.set(.025,-.35,-.065);scene.add(rig);
 const metal=new THREE.MeshStandardMaterial({color:0x8eaa94,metalness:.8,roughness:.32});
 const shell=new THREE.MeshStandardMaterial({color:0x13271e,metalness:.4,roughness:.54});
 const inside=new THREE.MeshStandardMaterial({color:0x101a15,roughness:.88});
 const makeBox=(w,h,d,material,parent,x=0,y=0,z=0,r=.035)=>{
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),material);
  mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 };
 const loader=new THREE.TextureLoader();
 const logo=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='./assets/brand/neon-genesis.svg';});
 function printedTexture(back=false){
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=1200;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,800,1200);bg.addColorStop(0,'#243d32');bg.addColorStop(.55,'#12221c');bg.addColorStop(1,'#1d3227');ctx.fillStyle=bg;ctx.fillRect(0,0,800,1200);
  ctx.strokeStyle='#839881';ctx.lineWidth=2;ctx.strokeRect(35,35,730,1130);
  ctx.strokeStyle='#536c57';ctx.lineWidth=1;ctx.strokeRect(47,47,706,1106);
  ctx.textAlign='center';ctx.fillStyle='#c0cdb1';ctx.font='20px monospace';ctx.fillText('N E O N   G E N E S I S',400,119);
  ctx.font='16px monospace';ctx.fillStyle='#8aa891';ctx.fillText('MECHANICAL LIFE ARCHIVE',400,156);
  // The existing brand mark is the foil stamp on both box and card back.
  ctx.save();ctx.globalAlpha=.88;ctx.drawImage(logo,285,300,230,276);ctx.restore();
  ctx.strokeStyle='#6c9270';ctx.lineWidth=1;
  for(const size of [310,345]){ctx.save();ctx.translate(400,445);ctx.rotate(Math.PI/4);ctx.strokeRect(-size/2,-size/2,size,size);ctx.restore();}
  ctx.fillStyle='#d6debd';ctx.font='42px "PingFang SC",sans-serif';ctx.fillText('霓 虹 纪 元',400,766);
  ctx.fillStyle='#96b19b';ctx.font='21px "PingFang SC",sans-serif';ctx.fillText('机 械 物 种 典 藏',400,821);
  ctx.fillStyle='#6e9379';ctx.fillRect(345,886,110,2);
  ctx.font='17px monospace';ctx.fillStyle='#b7c9ab';ctx.fillText(back?'THE OTHER SIDE OF LIFE':'VOL. 01     /     20 SPECIMENS',400,987);
  ctx.font='14px monospace';ctx.fillStyle='#7d9b83';ctx.fillText('A WORLD WAITING TO UNFOLD',400,1090);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();return texture;
 }
 const boxPrint=printedTexture(), backPrint=printedTexture(true);
 const printMaterial=new THREE.MeshStandardMaterial({map:boxPrint,metalness:.36,roughness:.43});
 const backMaterial=new THREE.MeshStandardMaterial({map:backPrint,metalness:.4,roughness:.36});
 makeBox(2.42,2.83,.085,shell,rig,0,-.355,.51);
 const label=new THREE.Mesh(new THREE.PlaneGeometry(2.31,2.7),printMaterial);label.position.set(0,-.355,.556);rig.add(label);
 makeBox(2.42,3.5,.08,shell,rig,0,-.02,-.49);
 makeBox(.09,3.5,.99,shell,rig,-1.2,-.02,0);
 makeBox(.09,3.5,.99,shell,rig,1.2,-.02,0);
 makeBox(2.4,.09,1.06,shell,rig,0,-1.75,0);
 makeBox(2.24,.035,.89,inside,rig,0,-1.67,0);
 for(const x of [-1.205,1.205])makeBox(.016,2.7,.016,metal,rig,x,-.355,.56,.004);
 makeBox(2.4,.018,.018,metal,rig,0,1.07,.56,.004);
 makeBox(2.4,.018,.018,metal,rig,0,-1.74,.56,.004);
 const lid=new THREE.Group();lid.position.set(0,1.75,-.49);rig.add(lid);
 makeBox(2.48,.085,1.12,shell,lid,0,.02,.51);
 makeBox(2.48,.67,.09,shell,lid,0,-.31,1.025);
 for(const x of [-1.2,1.2])makeBox(.08,.67,1.08,shell,lid,x,-.31,.51);
 makeBox(2.46,.022,.014,metal,lid,0,-.647,1.077,.004);
 const topLabel=new THREE.Mesh(new THREE.PlaneGeometry(.31,.37),new THREE.MeshBasicMaterial({map:await loader.loadAsync('./assets/brand/neon-genesis.svg'),transparent:true}));
 topLabel.position.set(0,-.29,1.075);lid.add(topLabel);
 // Thin layered edges make the contents read as a real deck when the lid opens.
 const cards=[], faceGeometry=new THREE.PlaneGeometry(2.12,3.18);
 for(let i=0;i<catalog.length;i++){
  const card=new THREE.Group();
  makeBox(2.15,3.21,.023,metal,card,0,0,0,.022);
  const back=new THREE.Mesh(faceGeometry,backMaterial);back.position.z=.014;card.add(back);
  const front=new THREE.Mesh(faceGeometry,new THREE.MeshBasicMaterial({color:0xffffff}));front.rotation.y=Math.PI;front.position.z=-.014;front.visible=false;card.add(front);
  card.position.set(0,-.06,.34-i*.033);rig.add(card);cards.push({group:card,front,preview:0,selection:0});
 }
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=128;
 const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(128,64,0,128,64,120);gradient.addColorStop(0,'#000b');gradient.addColorStop(1,'#0000');sc.fillStyle=gradient;sc.fillRect(0,0,256,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-1.84,0);scene.add(shadow);
 let active=true,busy=false,mode='box',last=0,raf=0,shownIndex=0,viewedIndex=-1,hovered=-1,handPoses=[];
 const pointer=new THREE.Vector2(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.position.z=12.5;camera.updateProjectionMatrix();renderer.setSize(width,height,false);if(mode==='manual'){setHandFan();onHandLayout(projectedCards());start();}render();}
 const observer=new ResizeObserver(resize);observer.observe(host);
 const intersection=new IntersectionObserver(([entry])=>{active=entry.isIntersecting;if(active)start();});intersection.observe(host);
 host.addEventListener('pointermove',event=>{const r=host.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width-.5,(event.clientY-r.top)/r.height-.5);start();});
 host.addEventListener('pointerleave',()=>{pointer.set(0,0);start();});
 function render(){renderer.render(scene,camera);}
 function tick(time){raf=0;if(!active||document.hidden||busy)return;
  const dt=Math.min((time-last)/1000,.05);last=time;
  let moving=false;
  if(!reduced.matches&&(mode==='box'||mode==='open'||mode==='revealed')){
   const revealed=mode==='revealed',object=revealed?cards[shownIndex].group:rig;
   const targetY=revealed?Math.PI+pointer.x*.16:-.35+pointer.x*.2;
   const targetX=revealed?pointer.y*.12:.025+pointer.y*.08;
   object.rotation.y=mix(object.rotation.y,targetY,1-Math.exp(-dt*5));object.rotation.x=mix(object.rotation.x,targetX,1-Math.exp(-dt*5));
   moving=Math.abs(object.rotation.y-targetY)+Math.abs(object.rotation.x-targetX)>.0001;
  }
  if(mode==='manual'){
   cards.forEach((card,i)=>{
    const {group}=card,pose=handPoses[i],selected=i===hovered||i===viewedIndex?1:0,target=i===viewedIndex?1:0;
    card.selection=reduced.matches?selected:THREE.MathUtils.clamp(card.selection+(selected?1:-1)*dt/.18,0,1);
    card.preview=reduced.matches?target:THREE.MathUtils.clamp(card.preview+(target?1:-1)*dt/.65,0,1);
    const selection=ease(card.selection),lift=ease(Math.min(card.preview/.65,1)),flip=ease(card.preview);
    group.position.copy(pose.p);if(camera.aspect<1)group.position.x*=mix(1,.4,lift);group.position.y+=.24*selection+(camera.aspect<1?.41:.46)*lift;group.position.z+=1.5*lift;
    group.rotation.y=Math.PI*flip;group.rotation.z=pose.r.z*(1-lift);group.scale.setScalar(pose.s*mix(1,camera.aspect<1?1.4:1.06,lift));
    moving ||=card.preview!==target||card.selection!==selected;
   });
  }
  render();if(moving)raf=requestAnimationFrame(tick);
 }
 function start(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
 const animate=(duration,update)=>new Promise(resolve=>{
  if(reduced.matches){update(1);render();resolve();return;}
  const start=performance.now();function frame(now){const t=Math.min((now-start)/duration,1);update(ease(t));render();if(t<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);
 });
 const textures=new Map();
 async function face(index,id){
  let promise=textures.get(id);
  if(!promise){promise=loader.loadAsync(`./previews/gallery/${id}.png`).then(texture=>{const canvas=document.createElement('canvas');canvas.width=600;canvas.height=900;canvas.getContext('2d').drawImage(texture.image,texture.image.width/9,texture.image.height*.08,texture.image.width*7/9,texture.image.height*.84,0,0,600,900);texture.dispose();const faceTexture=new THREE.CanvasTexture(canvas);faceTexture.colorSpace=THREE.SRGBColorSpace;faceTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();return faceTexture;}).catch(error=>{textures.delete(id);throw error;});textures.set(id,promise);}
  cards[index].front.material.map=await promise;cards[index].front.material.needsUpdate=true;cards[index].front.visible=true;
 }
 function reset(open=false){
  shownIndex=0;viewedIndex=-1;hovered=-1;handPoses=[];
  mode=open?'open':'box';busy=false;camera.zoom=open?1.3:1.65;camera.updateProjectionMatrix();rig.visible=true;rig.position.set(0,open?-.3:0,0);rig.rotation.set(.025,-.35,-.065);rig.scale.setScalar(1);lid.rotation.x=open?-1.95:0;shadow.visible=true;
  cards.forEach((card,i)=>{const {group}=card;card.preview=0;card.selection=0;rig.add(group);group.visible=true;group.position.set(0,-.06,.34-i*.033);group.rotation.set(0,0,0);group.scale.setScalar(1);});render();start();
 }
 async function open(){await animate(600,t=>{lid.rotation.x=-1.95*t;rig.position.y=-.3*t;camera.zoom=mix(1.65,1.3,t);camera.updateProjectionMatrix();});}
 async function draw(id){
  if(mode==='manual')return chooseHand(catalog.findIndex(card=>card.id===id));
  const keepOpen=mode==='revealed'||mode==='open';await recall({closeLid:false});await face(0,id);reset(keepOpen);busy=true;if(!keepOpen)await open();
  const card=cards[0].group;
  await animate(780,t=>{card.position.y=mix(-.06,3.1,t);rig.position.y=mix(-.3,-1.32,t);rig.rotation.z=mix(-.065,.025,t);camera.zoom=mix(1.3,.95,t);camera.updateProjectionMatrix();});
  scene.attach(card);const pos=card.position.clone(),rot=card.rotation.clone();
  await animate(850,t=>{card.position.set(mix(pos.x,0,t),mix(pos.y,.12,t),mix(pos.z,1.6,t));card.rotation.set(mix(rot.x,0,t),mix(rot.y,-.13,t),mix(rot.z,-.025,t));rig.position.x=(camera.aspect<1?-1.65:-2.55)*t;rig.position.y=mix(-1.32,-.8,t);rig.position.z=(camera.aspect<1?-6:-3)*t;rig.scale.setScalar(mix(1,.9,t));camera.zoom=mix(.95,1.75,t);camera.updateProjectionMatrix();});
  await animate(240,()=>{});
  await animate(1000,t=>{card.rotation.y=mix(-.13,Math.PI,t);card.rotation.z=mix(-.025,0,t);});
  mode='revealed';busy=false;render();start();
 }
 async function spread({manual=false}={}){
  if(mode==='manual'){
   if(manual)return projectedCards();
   busy=true;mode='spreading';viewedIndex=-1;hovered=-1;
   const from=cards.map(({group})=>({p:group.position.clone(),r:group.rotation.clone(),s:group.scale.x}));
   await animate(500,t=>{cards.forEach(({group},i)=>{group.position.lerpVectors(from[i].p,handPoses[i].p,t);group.rotation.y=mix(from[i].r.y,Math.PI,t);group.rotation.z=mix(from[i].r.z,handPoses[i].r.z,t);group.scale.setScalar(mix(from[i].s,handPoses[i].s,t));});});
   return projectedCards();
  }
  const keepOpen=mode==='revealed'||mode==='open';await recall({closeLid:false});await Promise.all(catalog.map((card,i)=>face(i,card.id)));reset(keepOpen);busy=true;if(!keepOpen)await open();
  await animate(850,t=>{cards.forEach(({group})=>{group.position.y=mix(-.06,3.1,t);});rig.position.y=mix(-.3,-1.32,t);camera.zoom=mix(1.3,.95,t);camera.updateProjectionMatrix();});
  cards.forEach(({group})=>scene.attach(group));
  const from=cards.map(({group})=>({p:group.position.clone(),r:group.rotation.clone()}));
  const narrow=camera.aspect<1,boxTarget=handBoxPosition();
  await animate(1100,t=>{
   rig.position.set(manual?boxTarget.x*t:0,mix(-1.32,manual?boxTarget.y:-1.3,t),(manual?boxTarget.z:-2.5)*t);rig.scale.setScalar(mix(1,.78,t));
   if(manual){camera.zoom=mix(.95,1.3,t);camera.updateProjectionMatrix();}
   cards.forEach(({group},i)=>{
    const progress=ease(THREE.MathUtils.clamp(t*1.2-i*.01,0,1)),a=(i-(cards.length-1)/2)*.046;
    const pose=manual?handPose(i):{p:new THREE.Vector3(Math.sin(a)*(narrow?2.3:4.5),.1+Math.cos(a)*.3,1+i*.014),s:narrow?.6:.78};
    group.position.lerpVectors(from[i].p,pose.p,progress);
    group.rotation.set(mix(from[i].r.x,0,progress),mix(from[i].r.y,manual?0:Math.PI,progress),mix(from[i].r.z,-a,progress));group.scale.setScalar(mix(1,pose.s,progress));
   });
  });
  if(manual){mode='manual';busy=false;setHandFan();onHandLayout(projectedCards());start();}
  render();return projectedCards();
 }
 function handPose(i){
  const a=(i-(cards.length-1)/2)*.046,narrow=camera.aspect<1;
  return {p:new THREE.Vector3(Math.sin(a)*(narrow?2.9:9.7),-.3+Math.cos(a)*.32,1+i*.014),r:new THREE.Euler(0,0,-a),s:narrow?.56:.92};
 }
 function handBoxPosition(){
  const z=camera.aspect<1?-6:-4;
  const halfWidth=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(camera.position.z-z)/1.3*camera.aspect;
  return new THREE.Vector3(-Math.min(8.6,halfWidth-1.3),-.55,z);
 }
 function setHandFan(){
  rig.position.copy(handBoxPosition());
  handPoses=cards.map((_,i)=>handPose(i));
  cards.forEach(({group},i)=>{group.position.copy(handPoses[i].p);group.rotation.copy(handPoses[i].r);group.scale.setScalar(handPoses[i].s);});
 }
 function pickedHandPose(index){
  const pose=handPoses[index],p=pose.p.clone(),narrow=camera.aspect<1;
  if(narrow)p.x*=.4;p.y+=narrow?.65:.7;p.z+=1.5;
  return {p,s:pose.s*(narrow?1.4:1.06)};
 }
 function getHandHitCorners(index,reveal,raised=true){
  const pose=reveal?pickedHandPose(index):handPoses[index],p=pose.p.clone();
  if(!reveal&&raised)p.y+=.24;
  const rotation=reveal?new THREE.Euler(0,Math.PI,0):pose.r;
  const matrix=new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(rotation),new THREE.Vector3().setScalar(pose.s)),r=host.getBoundingClientRect();
  return [[-1.075,1.605],[1.075,1.605],[1.075,-1.605],[-1.075,-1.605]].map(([x,y])=>{const corner=new THREE.Vector3(x,y,0).applyMatrix4(matrix).project(camera);return {x:r.left+(corner.x+1)*r.width/2,y:r.top+(1-corner.y)*r.height/2};});
 }
 function hoverCard(index){
  if(mode!=='manual'||busy)return;
  hovered=index;start();
 }
 function chooseHand(index){
  if(mode!=='manual'||busy||index<0||index>=cards.length)return;
  viewedIndex=index;
  hoverCard(index);
 }
 function releaseHand(){
  if(mode!=='manual'||busy)return;
  viewedIndex=-1;hovered=-1;start();
 }
 async function recall({closeLid=true}={}){
  if(mode==='manual'){busy=true;mode='gathering';await gather({closeLid});return;}
  if(mode!=='revealed')return;
  busy=true;const card=cards[shownIndex].group,start=card.position.clone(),rotation=card.rotation.clone();
  const boxPosition=rig.position.clone(),boxScale=rig.scale.x;
  await animate(650,t=>{
   rig.position.set(mix(boxPosition.x,0,t),mix(boxPosition.y,-1.32,t),mix(boxPosition.z,0,t));rig.scale.setScalar(mix(boxScale,1,t));rig.rotation.set(.025,-.35,-.065);
   const destination=rig.localToWorld(new THREE.Vector3(0,3.1,.34));
   card.position.lerpVectors(start,destination,t);card.rotation.set(mix(rotation.x,.025,t),mix(rotation.y,Math.PI*2-.35,t),mix(rotation.z,-.065,t));
   camera.zoom=mix(1.75,.95,t);camera.updateProjectionMatrix();
  });
  rig.attach(card);card.rotation.set(0,0,0);card.position.set(0,3.1,.34);
  await animate(550,t=>{card.position.y=mix(3.1,-.06,t);rig.position.y=mix(-1.32,-.3,t);camera.zoom=mix(.95,1.3,t);camera.updateProjectionMatrix();});
  if(closeLid)await animate(350,t=>{lid.rotation.x=mix(-1.95,0,t);rig.position.y=mix(-.3,0,t);camera.zoom=mix(1.3,1.65,t);camera.updateProjectionMatrix();});reset(!closeLid);
 }
 function prepareGather(){
  active=true;busy=true;mode='gathering';
  renderer.domElement.style.visibility='hidden';
  rig.visible=true;rig.position.set(0,-1.3,-2.5);rig.rotation.set(.025,-.35,-.065);rig.scale.setScalar(.78);lid.rotation.x=-1.95;
  camera.zoom=.95;resize();
  const narrow=camera.aspect<1;
  cards.forEach(({group},i)=>{
   scene.attach(group);group.visible=true;
   const a=(i-(cards.length-1)/2)*.046;
   group.position.set(Math.sin(a)*(narrow?2.3:4.5),.1+Math.cos(a)*.3,1+i*.014);
   group.rotation.set(0,Math.PI,-a);group.scale.setScalar(narrow?.6:.78);
  });
  render();return projectedCards();
 }
 async function gather({closeLid=true}={}){
  renderer.domElement.style.visibility='';
  const from=cards.map(({group})=>({p:group.position.clone(),r:group.rotation.clone(),s:group.scale.x})),boxStart=rig.position.clone(),boxScale=rig.scale.x,zoomStart=camera.zoom;
  await animate(700,t=>{
   rig.position.lerpVectors(boxStart,new THREE.Vector3(0,-1.32,0),t);rig.scale.setScalar(mix(boxScale,1,t));camera.zoom=mix(zoomStart,.95,t);camera.updateProjectionMatrix();
   cards.forEach(({group},i)=>{
    const destination=rig.localToWorld(new THREE.Vector3(0,3.1,.34-i*.033));
    group.position.lerpVectors(from[i].p,destination,t);
    group.rotation.set(mix(from[i].r.x,.025,t),mix(from[i].r.y,from[i].r.y>Math.PI/2?Math.PI*2-.35:-.35,t),mix(from[i].r.z,-.065,t));
    group.scale.setScalar(mix(from[i].s,1,t));
   });
  });
  cards.forEach(({group},i)=>{rig.attach(group);group.position.set(0,3.1,.34-i*.033);group.rotation.set(0,0,0);group.scale.setScalar(1);});
  await animate(650,t=>{
   cards.forEach(({group})=>{group.position.y=mix(3.1,-.06,t);});rig.position.y=mix(-1.32,-.3,t);camera.zoom=mix(.95,1.3,t);camera.updateProjectionMatrix();
  });
  if(closeLid)await animate(400,t=>{lid.rotation.x=mix(-1.95,0,t);rig.position.y=mix(-.3,0,t);camera.zoom=mix(1.3,1.65,t);camera.updateProjectionMatrix();});reset(!closeLid);
 }
 function projectedCards(){
  const r=host.getBoundingClientRect();scene.updateMatrixWorld(true);
  return cards.map(({group})=>{
   const center=group.getWorldPosition(new THREE.Vector3()).project(camera),scale=group.getWorldScale(new THREE.Vector3()).x;
   const edge=group.localToWorld(new THREE.Vector3(1.06,0,0)).project(camera);
   const width=Math.abs(edge.x-center.x)*r.width;
   const corners=[[-1.075,1.605],[1.075,1.605],[1.075,-1.605],[-1.075,-1.605]].map(([x,y])=>{const p=group.localToWorld(new THREE.Vector3(x,y,0)).project(camera);return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};});
   return {x:r.left+(center.x+1)*r.width/2,y:r.top+(1-center.y)*r.height/2,width:Math.max(width,100*scale),height:Math.max(width,100*scale)*1.5,angle:-group.rotation.z*180/Math.PI,corners};
  });
 }
 resize();start();
 return {draw,spread,reset,recall,prepareGather,gather,hoverCard,chooseHand,releaseHand,getHandHitCorners,getCardFaces(){return cards.map(card=>card.front.material.map.image);},hide(){active=false;mode='grid';},show(){active=true;resize();start();},dispose(){cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();environment.dispose();renderer.dispose();}};
}
