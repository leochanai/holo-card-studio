import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {catalog,getCard} from './catalog.js';
import {loadCardResources,retainCards} from './card-resources.js';

const stage=document.querySelector('#stage'), loading=document.querySelector('#loading');
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,composer,root,uniforms,config,auto=false,flipped=false,dragging=false;
let targetX=0.025,targetY=-0.13,targetZoom=1,rotationX=targetX,rotationY=targetY;
let last={x:0,y:0},lastTime=0,elapsed=0;
let activeId,requestedId,loadSequence=0,materials,subjectVideo,videoTexture;
let soundEnabled=true,soundBlocked=false;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-5,5,5.65,-5.65,.1,100); camera.position.set(0,0,20); camera.lookAt(0,0,0);
const vertex=`varying vec2 vUv;
void main(){vUv=vec2(uv.x,1.0-uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const shared=`precision highp float;
varying vec2 vUv;
uniform float uTime,uFoil,uScale,uDepth,uBgDepth,uSafeScale;
uniform vec2 uSafeOffset;
uniform vec3 uView;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 spectrum(float t){t=fract(t);vec3 pink=vec3(1.,.32,.62),yellow=vec3(1.,.85,.32),blue=vec3(.22,.62,1.);if(t<.35)return mix(pink,yellow,t/.35);if(t<.7)return mix(yellow,blue,(t-.35)/.35);return mix(blue,vec3(1.),(t-.7)/.3);}
vec3 overlay(vec3 b,vec3 f){return mix(2.*b*f,1.-2.*(1.-b)*(1.-f),step(vec3(.5),b));}
float inside(vec2 p){return step(0.,p.x)*step(0.,p.y)*step(p.x,1.)*step(p.y,1.);}
vec2 parallax(vec2 p,float s,float d){return (p-.5)*s+.5+uView.xy/max(abs(uView.z),.35)*d*.14;}
float wave(vec2 p){vec2 a=p+uView.xy*2.4;return .5+.5*sin((a.x*.848-a.y*.530)*6.283*.55+7.*noise(a*1.5));}
float star(vec2 p){vec2 q=p*105.,id=floor(q),f=fract(q);float first=9.,second=9.;for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(hash(id+g),hash(id+g+43.3));float d=length(g+o-f);if(d<first){second=first;first=d;}else second=min(second,d);}}float edge=1.-smoothstep(.01,.035,second-first);float sparse=step(.90,hash(id+8.8));float twinkle=pow(.5+.5*sin(uTime*1.8+hash(id)*30.+uView.x*27.+uView.y*21.),6.);return edge*sparse*twinkle;}
`;
const fragment=shared+`
uniform sampler2D tSubject,tBackground,tText,tLine,tVideo;
uniform float uVideo;
uniform float uSubjectEmphasis;
void main(){
 vec2 uv=vUv;
 vec2 su=parallax(uv,uScale,uDepth)*uSafeScale+uSafeOffset;
 vec2 bu=parallax(uv,1.,uBgDepth);
 vec4 sub=texture2D(tSubject,clamp(su,0.,1.));
 if(uVideo>.5){
  sub=texture2D(tVideo,clamp(su,0.,1.));
  // Trial white-background key; keep coloured lights and remove white edge spill.
  sub.a=1.-smoothstep(.90,.98,min(sub.r,min(sub.g,sub.b)));
  sub.rgb=clamp((sub.rgb-vec3(1.-sub.a))/max(sub.a,.001),0.,1.);
 }
 sub.a*=inside(su);
 vec3 bg=texture2D(tBackground,clamp(bu,0.,1.)).rgb;
 float w=wave(uv); vec3 foil=spectrum(w*.8+noise(uv*5.)*.12);
 vec3 subject=mix(sub.rgb,overlay(sub.rgb,foil),uFoil*.28);
 bg=mix(bg,overlay(bg,foil),uFoil*.36);
 // Separate busy artwork without adding texture samples or changing other cards.
 subject=mix(subject,pow(max(subject,vec3(0.)),vec3(.72))*vec3(1.06,1.02,.96),uSubjectEmphasis);
 float bgLuma=dot(bg,vec3(.2126,.7152,.0722));
 bg=mix(bg,mix(vec3(bgLuma),bg,.5)*.58,uSubjectEmphasis);
 float backgroundLight=mix(1.,.5,uSubjectEmphasis);
 vec3 col=mix(bg,subject,sub.a);
 float sweep=pow(max(0.,sin((uv.x*.83+uv.y*.35+uView.x*1.8+uView.y*.9)*6.283)),12.);
 col+=foil*sweep*uFoil*.28*mix(backgroundLight,1.,sub.a);
 float line=1.-smoothstep(.06,.25,texture2D(tLine,clamp(su,0.,1.)).r);
 col+=vec3(1.,.94,.78)*line*inside(su)*sub.a*sweep*uFoil*.22*(1.-uVideo);
 col+=vec3(.66,.86,1.)*star(bu)*uFoil*.65*(1.-sub.a*.7)*backgroundLight;
 // Reserve calm print areas without changing the artwork or its parallax.
 float printArea=max(1.-smoothstep(.10,.23,uv.y),smoothstep(.78,.89,uv.y));
 col*=1.-printArea*.66;
 vec4 text=texture2D(tText,uv);col=mix(col,text.rgb,text.a);
 // Keep print saturation; the selective high luminance feeds the bloom pass.
 gl_FragColor=vec4(pow(max(col,vec3(0.)),vec3(2.2)),1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const edgeFragment=shared+`void main(){vec3 col=mix(vec3(.55,.34,.1),spectrum(wave(vUv)),.65+uFoil*.2);gl_FragColor=vec4(col*.55+.08,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
const backFragment=shared+`uniform sampler2D tBack,tLine,tSubject;
void main(){
 vec2 uv=vec2(1.-vUv.x,vUv.y);vec4 art=texture2D(tBack,uv);
 vec3 col=vec3(.025,.042,.038);
 vec2 diagramUv=(uv-vec2(.5,.50))/vec2(.84,.72)+.5;
 float etching=(1.-smoothstep(.55,.98,texture2D(tLine,clamp(diagramUv,0.,1.)).r))*inside(diagramUv);
 float a=texture2D(tSubject,clamp(diagramUv,0.,1.)).a;
 float contour=abs(a-texture2D(tSubject,clamp(diagramUv+vec2(.003,0.),0.,1.)).a)+abs(a-texture2D(tSubject,clamp(diagramUv+vec2(0.,.003),0.,1.)).a);
 float engraving=max(pow(etching,1.4)*.5,min(contour*1.8,1.))*inside(diagramUv);
 col+=mix(vec3(.52,.67,.59),spectrum(wave(uv))*.55,uFoil*.25)*engraving;
 vec2 corner=abs((uv-.5)*vec2(1.,1.5))-vec2(.474,.724);
 float rim=length(max(corner,0.))+min(max(corner.x,corner.y),0.)-.022;
 float border=smoothstep(-.006,-.004,rim);
 col=mix(col,mix(vec3(.52,.57,.53),spectrum(wave(uv))*.65,uFoil*.4),border);
 col=mix(col,art.rgb,art.a);gl_FragColor=vec4(pow(col,vec3(2.2)),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function frontTexture(texture){
 const c=texture?.image||document.createElement('canvas');if(!texture){c.width=2048;c.height=3072;}
 const ctx=c.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,1024,1536);
 ctx.strokeStyle='#77958a';ctx.lineWidth=2;ctx.strokeRect(42,42,940,1452);
 ctx.beginPath();ctx.moveTo(72,254);ctx.lineTo(952,254);ctx.moveTo(72,1234);ctx.lineTo(952,1234);ctx.stroke();
 ctx.fillStyle='#b8cec2';ctx.font='32px monospace';ctx.fillText('NEON GENESIS',72,102);
 ctx.textAlign='right';ctx.fillText(config.edition,952,102);ctx.textAlign='left';
 ctx.fillStyle='#ecede1';ctx.font='500 76px "PingFang SC", sans-serif';ctx.fillText(config.title,72,194,880);
 ctx.fillStyle='#b8cec2';ctx.font='30px monospace';ctx.fillText(config.subtitle,72,236,880);
 ctx.fillStyle='#ecede1';ctx.font='56px "PingFang SC", sans-serif';ctx.fillText(config.technique,72,1310,880);
 ctx.font='34px "PingFang SC", sans-serif';ctx.fillStyle='#b8cec2';ctx.fillText(config.tagline,72,1370,880);
 ctx.font='30px "PingFang SC", sans-serif';ctx.fillText(config.collection,72,1445,880);
 const tex=texture||new THREE.CanvasTexture(c);tex.needsUpdate=true;tex.colorSpace=THREE.NoColorSpace;tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return tex;
}
function backTexture(texture){
 const c=texture?.image||document.createElement('canvas');if(!texture){c.width=2048;c.height=3072;}
 const ctx=c.getContext('2d');ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,1024,1536);
 ctx.strokeStyle='#68897d';ctx.lineWidth=2;ctx.strokeRect(42,42,940,1452);
 ctx.beginPath();ctx.moveTo(72,235);ctx.lineTo(952,235);ctx.moveTo(72,1210);ctx.lineTo(952,1210);ctx.stroke();
 ctx.fillStyle='#b8ccc0';ctx.font='30px monospace';ctx.fillText('NEON GENESIS',72,110);
 ctx.font='64px monospace';ctx.fillStyle='#d6e0d5';ctx.fillText(config.backMark||'REX',72,195);
 ctx.textAlign='right';ctx.font='30px monospace';ctx.fillText(config.edition||'001',952,195);
 ctx.textAlign='left';ctx.font='52px "PingFang SC", sans-serif';ctx.fillText(config.title,72,1290,880);
 ctx.font='28px "PingFang SC", sans-serif';ctx.fillStyle='#a8bdb1';ctx.fillText(config.collection||'幻光典藏',72,1360,880);
 ctx.font='24px monospace';ctx.fillText('NEON GENESIS / MECHANICAL LIFE',72,1430);
 const tex=texture||new THREE.CanvasTexture(c);tex.needsUpdate=true;tex.colorSpace=THREE.NoColorSpace;return tex;
}
function updateCardDetails(card){
 const cardId=card.id;
 document.title=config.title+' · '+config.edition;
 $('habitat-cn').textContent=card.habitatCn;$('header-edition').textContent=config.edition;
 document.querySelector('.display-label').textContent='MECHANICAL LIFE / '+(config.habitat||card.habitat);
 $('card-picker').value=cardId;
 const index=catalog.findIndex(item=>item.id===cardId);
 $('previous-card').href='?card='+catalog[(index+catalog.length-1)%catalog.length].id;
 $('next-card').href='?card='+catalog[(index+1)%catalog.length].id;
 for(const [id,key]of Object.entries({'card-title':'title','collection':'collection','subtitle':'subtitle','description':'description','tagline':'tagline','technique':'technique','edition':'edition'}))if(config[key])$(id).textContent=config[key];
}
async function init(){
 const picker=$('card-picker');picker.innerHTML=catalog.map(item=>`<option value="${item.id}">No.${item.id} ${item.title}</option>`).join('');
 picker.onchange=()=>navigateToCard(picker.value);
 for(const id of ['previous-card','next-card'])$(id).addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();const index=catalog.findIndex(card=>card.id===(requestedId||activeId));
  navigateToCard(catalog[(index+(id==='next-card'?1:-1)+catalog.length)%catalog.length].id);
 });
 window.addEventListener('popstate',()=>switchCard(getCard(new URLSearchParams(location.search).get('card'))));
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setClearColor(0x000000,1);renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;stage.append(renderer.domElement);
 const target=new THREE.WebGLRenderTarget(stage.clientWidth,stage.clientHeight,{type:THREE.HalfFloatType,samples:Math.min(4,renderer.capabilities.maxSamples)});composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(720,1000),.18,.35,1.0));composer.addPass(new OutputPass());
 uniforms={tVideo:{value:null},uVideo:{value:0},tSubject:{value:null},tBackground:{value:null},tText:{value:null},tLine:{value:null},tBack:{value:null},uTime:{value:0},uView:{value:new THREE.Vector3(0,0,1)},uFoil:{value:.65},uScale:{value:1.25},uDepth:{value:.4},uBgDepth:{value:-.25},uSafeScale:{value:1.12},uSafeOffset:{value:new THREE.Vector2(-.06,-.085)},uSubjectEmphasis:{value:0}};
 const frontMat=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,side:THREE.FrontSide});const edgeMat=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:edgeFragment});const backMat=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:backFragment});const goldMat=new THREE.MeshBasicMaterial({color:0x778579});
 materials={web_front:frontMat,web_back:backMat,web_gold:goldMat,web_edge:edgeMat};
 setupControls();new ResizeObserver(resize).observe(stage);resize();
 renderer.setAnimationLoop(animate);
 await switchCard(getCard(new URLSearchParams(location.search).get('card')));
}
function navigateToCard(id){
 if(id===requestedId&&loading.getAttribute('role')!=='alert')return;
 history.pushState(null,'','?card='+id);switchCard(getCard(id));
}
async function switchCard(card){
 const sequence=++loadSequence;requestedId=card.id;
 retainCards(activeId,requestedId);$('card-picker').value=card.id;
 stage.setAttribute('aria-busy','true');loading.hidden=false;loading.classList.toggle('switching',Boolean(root));loading.setAttribute('role','status');loading.textContent='正在加载卡牌…';
 try{
  const resources=await loadCardResources(card.id);
  if(sequence!==loadSequence)return;
  const nextRoot=new THREE.Group();nextRoot.add(resources.model.clone(true));let nextFace;
  nextRoot.traverse(ob=>{if(!ob.isMesh)return;const role=ob.material?.name;if(role==='web_front')nextFace=ob;if(role==='web_text')ob.visible=false;else ob.material=materials[role]||materials.web_edge;});
  if(!nextFace)throw Error('Blender 模型中缺少 web_front 材质，请重新导出模型。');
  config=resources.config;
  clearSubjectVideo();
  resources.textures.forEach(texture=>{texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);});
  [uniforms.tSubject.value,uniforms.tBackground.value,uniforms.tLine.value]=resources.textures;
  uniforms.tText.value=frontTexture(uniforms.tText.value);uniforms.tBack.value=backTexture(uniforms.tBack.value);
  const prm=config.parameters||{};
  uniforms.uSubjectEmphasis.value=prm.subjectEmphasis??0;
  uniforms.uFoil.value=prm.foil??.65;uniforms.uScale.value=prm.subjectScale??1.25;uniforms.uDepth.value=prm.subjectDepth??.4;uniforms.uBgDepth.value=prm.backgroundDepth??-.25;
  uniforms.uSafeScale.value=config.safeArea?.scale??1.12;uniforms.uSafeOffset.value.set(...(config.safeArea?.offset??[-.06,-.085]));
  if(root)scene.remove(root);root=nextRoot;scene.add(root);activeId=card.id;
  updateCardDetails(card);syncControls();reset();rotationX=targetX;rotationY=targetY;dragging=false;elapsed=0;setAuto(true);
  root.rotation.set(rotationX,rotationY,0);root.updateMatrixWorld(true);uniforms.uView.value.copy(camera.position).applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert()).normalize();uniforms.uTime.value=0;
  composer.render();loading.hidden=true;stage.setAttribute('aria-busy','false');retainCards(activeId);
  window.__holo={ready:true,config,renderer,root,uniforms,reset,modelSource:config.assets.model};
  loadSubjectVideo(config.assets.subjectVideo);
  preloadNeighbors(card.id,sequence);
 }catch(error){
  if(sequence!==loadSequence)return;
  console.error(error);loading.textContent='卡牌暂时无法加载。\n'+error.message;loading.setAttribute('role','alert');stage.setAttribute('aria-busy','false');retainCards(activeId);
  window.__holo={ready:false,error:error.message};
 }
}
function clearSubjectVideo(){
 uniforms.uVideo.value=0;uniforms.tVideo.value=null;
 if(subjectVideo){subjectVideo.pause();subjectVideo.removeAttribute('src');subjectVideo.load();subjectVideo.remove();subjectVideo=null;}
 videoTexture?.dispose();videoTexture=null;$('video-sound').hidden=true;
}
function syncSoundButton(){
 const enabled=soundEnabled&&!soundBlocked;
 $('video-sound').setAttribute('aria-pressed',String(enabled));
 $('video-sound').querySelector('.button-label').textContent=enabled?'关闭原声':'开启原声';
}
function syncSubjectVideo(){
 const video=subjectVideo;if(!video)return;
 video.muted=!soundEnabled||soundBlocked;syncSoundButton();
 if(auto&&!flipped&&!document.hidden){
  video.play().catch(error=>{
   if(subjectVideo!==video||error.name!=='NotAllowedError'||video.muted)return;
   soundBlocked=true;video.muted=true;syncSoundButton();
   if(auto&&!flipped&&!document.hidden)video.play().catch(()=>{});
  });
 }else video.pause();
}
function loadSubjectVideo(src){
 if(!src)return;
 const video=document.createElement('video');subjectVideo=video;
 video.id='subject-video';video.hidden=true;stage.append(video);
 soundBlocked=false;video.muted=!soundEnabled;video.loop=true;video.playsInline=true;video.preload='auto';
 video.addEventListener('loadeddata',()=>{
  if(subjectVideo!==video)return;
  videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.NoColorSpace;videoTexture.needsUpdate=true;
  uniforms.tVideo.value=videoTexture;uniforms.uVideo.value=1;$('video-sound').hidden=false;syncSubjectVideo();
 },{once:true});
 video.addEventListener('error',()=>{if(subjectVideo===video){clearSubjectVideo();console.warn('角色视频加载失败，保留静态角色。');}},{once:true});
 video.src=src;video.load();
}
document.addEventListener('visibilitychange',syncSubjectVideo);
document.addEventListener('click',event=>{
 if(event.target.closest('#video-sound')||!subjectVideo||!soundEnabled||!soundBlocked)return;
 soundBlocked=false;syncSubjectVideo();
});
window.addEventListener('pagehide',()=>subjectVideo?.pause());
window.addEventListener('pageshow',syncSubjectVideo);
function preloadNeighbors(id,sequence){
 if(navigator.connection?.saveData||['slow-2g','2g'].includes(navigator.connection?.effectiveType))return;
 const index=catalog.findIndex(card=>card.id===id);
 const neighbors=[1,-1].map(offset=>catalog[(index+offset+catalog.length)%catalog.length].id);
 // Keep the previous card while warming the next, instead of evicting and reloading it.
 retainCards(id,...neighbors);
 const schedule=window.requestIdleCallback||((callback)=>setTimeout(callback,0));
 schedule(async()=>{
  for(const neighbor of neighbors){
   if(sequence!==loadSequence)return;
   try{await loadCardResources(neighbor);}catch{/* Navigation can retry a failed preload. */}
  }
 });
}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||!renderer)return;const aspect=w/h;const halfH=5.65/targetZoom;camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);}
function setAuto(value){auto=value;syncSubjectVideo();$('auto').setAttribute('aria-pressed',String(auto));$('auto').querySelector('use').setAttribute('href','./assets/phosphor/icons.svg#'+(auto?'pause':'play'));$('auto').querySelector('.button-label').textContent=auto?'暂停赏卡':'自动赏卡';}
function reset(){targetX=.025;targetY=-.13;targetZoom=1;flipped=false;setAuto(false);$('flip').querySelector('.button-label').textContent='翻看背面';$('view-label').textContent='FRONT · 正面';resize();}
function flip(){flipped=!flipped;setAuto(false);targetY=flipped?Math.PI:0;targetX=0;$('flip').querySelector('.button-label').textContent=flipped?'回到正面':'翻看背面';$('view-label').textContent=flipped?'BACK · 背面':'FRONT · 正面';}
const controlSettings=[['foil','uFoil','foil-value'],['scale','uScale','scale-value'],['depth','uDepth','depth-value'],['bg-depth','uBgDepth','bg-depth-value']];
function syncControls(){for(const [id,name] of controlSettings){$(id).value=uniforms[name].value;$(id).dispatchEvent(new Event('input'));}}
function setupControls(){
 for(const [id,name,label] of controlSettings){const input=$(id);const update=()=>{uniforms[name].value=Number(input.value);$(label).value=id==='foil'?Math.round(input.value*100)+'%':id==='depth'?Math.round(input.value/.8*100)+'%':id==='bg-depth'?Math.round(-input.value/.65*100)+'%':Number(input.value).toFixed(2)+'×';};input.addEventListener('input',update);}
 stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;setAuto(false);last={x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});});
 stage.addEventListener('pointermove',e=>{if(!dragging)return;const base=flipped?Math.PI:0;targetY=THREE.MathUtils.clamp(targetY+(e.clientX-last.x)*.006,base-.65,base+.65);targetX=THREE.MathUtils.clamp(targetX+(e.clientY-last.y)*.005,-.43,.43);last={x:e.clientX,y:e.clientY};});
 const up=()=>{dragging=false;};stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('lostpointercapture',up);
 stage.addEventListener('wheel',e=>{e.preventDefault();targetZoom=THREE.MathUtils.clamp(targetZoom-e.deltaY*.001,.82,1.18);resize();},{passive:false});
 stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','f','F','r','R'].includes(e.key)){e.preventDefault();setAuto(false);}if(e.key==='ArrowLeft')targetY-=.07;if(e.key==='ArrowRight')targetY+=.07;if(e.key==='ArrowUp')targetX-=.06;if(e.key==='ArrowDown')targetX+=.06;if(e.key.toLowerCase()==='f')flip();if(e.key.toLowerCase()==='r')reset();const base=flipped?Math.PI:0;targetY=THREE.MathUtils.clamp(targetY,base-.65,base+.65);targetX=THREE.MathUtils.clamp(targetX,-.43,.43);});
 $('video-sound').onclick=()=>{
  soundEnabled=!soundEnabled||soundBlocked;soundBlocked=false;
  if(soundEnabled){if(flipped)flip();setAuto(true);}else syncSubjectVideo();
 };
 $('auto').onclick=()=>{if(flipped)flip();setAuto(!auto);};$('flip').onclick=flip;$('reset').onclick=reset;
 $('save').onclick=()=>{try{composer.render();renderer.domElement.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.download=(config.title||'card')+'-holographic.png';a.href=URL.createObjectURL(blob);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');}catch(e){$('save').textContent='保存失败，请重试';}};
 $('details').onclick=$('soundless').onclick=()=>$('about').showModal();$('about').querySelector('.close').onclick=()=>$('about').close();
}
function animate(now){if(!root)return;const dt=Math.min((now-lastTime)/1000,.1)||0;lastTime=now;if(!document.hidden)elapsed+=dt;if(auto){targetY=Math.sin(elapsed*.65)*.38;targetX=Math.sin(elapsed*.85)*.12;}
 const ease=reduced?1:1-Math.exp(-dt*8);rotationX+=(targetX-rotationX)*ease;rotationY+=(targetY-rotationY)*ease;root.rotation.set(rotationX,rotationY,0);root.updateMatrixWorld(true);
 uniforms.uView.value.copy(camera.position).applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert()).normalize();uniforms.uTime.value=reduced&&!auto?0:elapsed;composer.render();}
init().catch(error=>{console.error(error);loading.textContent='卡牌暂时无法加载。\n'+error.message+'\n请通过本地服务打开网页，并确认素材已生成。';loading.setAttribute('role','alert');window.__holo={ready:false,error:error.message};});
