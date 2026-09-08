import {catalog} from './catalog.js';

const $=selector=>document.querySelector(selector);
const grid=$('#gallery-grid'),experience=$('#deck-experience'),status=$('#deck-status');
const drawOne=$('#draw-one'),drawAll=$('#draw-all'),drawManual=$('#draw-manual'),returnBox=$('#return-box'),toolbar=$('#grid-toolbar');
const handPicker=$('#hand-picker');
let deck,busy=false,lastCard=null,handIndex=-1,chosenHand=-1;
let gridImagesReady;
let handTargets=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
$('.card-count strong').textContent=catalog.length;
$('.total-count').textContent=catalog.length;
grid.innerHTML=catalog.map(card=>`<a class="specimen ${card.accent}" href="./card.html?card=${card.id}" aria-label="查看 No.${card.id} ${card.title}详情"><div class="specimen-art"><div class="card-window"><img src="./previews/gallery/${card.id}.png" width="1080" height="1500" loading="lazy" alt="${card.title}卡面插画预览"></div></div><div class="specimen-meta"><div><span class="specimen-number"><b>${card.id}</b></span><h2>${card.title}</h2><p>${card.habitatCn} · ${card.technique}</p><span class="specimen-habitat">${card.habitat}</span></div><span class="open-card" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="./assets/phosphor/icons.svg#arrow-up-right"></use></svg></span></div></a>`).join('');

function lock(value){busy=value;document.body.dataset.busy=String(value);drawOne.disabled=value||!deck;drawManual.disabled=value||!deck;drawAll.disabled=value;returnBox.disabled=value;$('#collect-all').disabled=value;experience.setAttribute('aria-busy',String(value));}
function hideHand(){handPicker.hidden=true;handIndex=-1;chosenHand=-1;drawManual.setAttribute('aria-pressed','false');$('#deck-stage').setAttribute('role','img');}
function boxView(){
 hideHand();
 document.body.dataset.view='box';experience.hidden=false;grid.hidden=true;toolbar.hidden=true;$('#draw-result').hidden=true;returnBox.hidden=true;
 drawOne.querySelector('span').textContent='随机抽一张';status.textContent='每一张，都是一个待开启的世界。';
 $('#deck-stage').setAttribute('aria-label','霓虹纪元三维收藏卡盒');$('#collection-intro').innerHTML='一盒机械物种，二十种相遇。<br>抽一张交给偶然，或展开整个世界。';deck?.reset();deck?.show();
}
function gridView(){
 hideHand();
 document.body.dataset.view='grid';experience.hidden=true;grid.hidden=false;toolbar.hidden=false;$('#collection-intro').innerHTML='选择一张闪卡，走进它的世界。<br>转动、翻面，探索光与机械的另一种可能。';deck?.hide();
}
async function resetView(){
 if(busy)return;lock(true);hideHand();$('#draw-result').hidden=true;status.textContent='收拢此刻，静候下一次相遇…';
 try{
  if(document.body.dataset.view==='grid'&&deck&&!reduced.matches)await collectGrid();
  else await deck?.recall();
  boxView();drawOne.focus({preventScroll:true});
 }finally{lock(false);}
}
async function collectGrid(){
 const origins=[...grid.querySelectorAll('.card-window')].map(item=>item.getBoundingClientRect());
 experience.hidden=false;grid.hidden=true;toolbar.hidden=true;document.body.dataset.view='box';returnBox.hidden=true;
 window.scrollTo({top:0,behavior:'instant'});
 const targets=deck.prepareGather();
 const animations=origins.map((origin,i)=>{
  const target=targets[i],ghost=document.createElement('div');ghost.className='deal-ghost';ghost.setAttribute('aria-hidden','true');
  const top=Math.min(origin.top,innerHeight+30+i*12);
  ghost.style.cssText=`left:${origin.left}px;top:${top}px;width:${origin.width}px;height:${origin.height}px;border-radius:2px;`;
  ghost.innerHTML=`<img src="./previews/gallery/${catalog[i].id}.png" alt="" style="width:144%;left:-22%;top:-40.2439%">`;document.body.append(ghost);
  const motion=ghost.animate([{opacity:1,transform:'rotate(0deg)'},{left:`${target.x-target.width/2}px`,top:`${target.y-target.height/2}px`,width:`${target.width}px`,height:`${target.height}px`,transform:`rotate(${target.angle}deg)`,opacity:1}],{duration:850,delay:i*9,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  ghost.querySelector('img').animate([{width:'144%',left:'-22%',top:'-40.2439%'},{width:'128.5715%',left:'-14.2857%',top:'-9.5238%'}],{duration:850,delay:i*9,easing:'ease-in-out',fill:'forwards'});
  return {ghost,motion};
 });
 try{await Promise.all(animations.map(({motion})=>motion.finished));}
 finally{animations.forEach(({ghost})=>ghost.remove());}
 await deck.gather();
}
returnBox.addEventListener('click',resetView);
$('#collect-all').addEventListener('click',async()=>{await resetView();$('.gallery-main').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});});
function showCard(card,keepHand=false){
 if(!keepHand)hideHand();
 lastCard=card.id;document.body.dataset.view=keepHand?'manual':'revealed';
 $('#draw-number').textContent=`No.${card.id}`;$('#draw-title').textContent=card.title;$('#draw-detail').href=`./card.html?card=${card.id}`;
 $('#draw-result').hidden=false;returnBox.hidden=false;drawOne.querySelector('span').textContent='再抽一张';status.textContent=`${card.habitatCn} · ${card.technique}`;
 $('#deck-stage').setAttribute('aria-label',`抽到 No.${card.id} ${card.title}，卡牌正面已展示`);
 if(keepHand){
  chosenHand=catalog.findIndex(item=>item.id===card.id);
  handIndex=-1;handPicker.hidden=false;
  drawManual.setAttribute('aria-pressed','true');$('#deck-stage').setAttribute('role','group');
  $('#deck-stage').setAttribute('aria-label',`正在查看 No.${card.id} ${card.title}，点击其他手牌切换，点击空白或按 Esc 返回选牌`);
  updateHandButtons();
 }
}
function updateHandButtons(){
 const focusIndex=handIndex<0?(chosenHand===0?1:0):handIndex;
 const host=$('#deck-stage').getBoundingClientRect();
 handPicker.querySelectorAll('button').forEach((button,i)=>{
  button.disabled=false;button.tabIndex=i===focusIndex?0:-1;button.setAttribute('aria-pressed',String(i===chosenHand||i===handIndex));
  if(handTargets[i]){
   const corners=handTargets[i].corners.map(c=>({x:c.x+host.left,y:c.y+host.top}));
   // Keep the original hit area and include the entire lifted card, so moving
   // across its face cannot enter a different card underneath it.
   const area=i===chosenHand?deck.getHandHitCorners(i,true):i===handIndex?convexHull([...corners,...deck.getHandHitCorners(i,false)]):corners;
   const left=Math.min(...area.map(c=>c.x)),top=Math.min(...area.map(c=>c.y));
   const width=Math.max(...area.map(c=>c.x))-left,height=Math.max(...area.map(c=>c.y))-top;
   const polygon=area.map(c=>`${(c.x-left)/width*100}% ${(c.y-top)/height*100}%`).join(',');
   button.style.cssText=`left:${left-host.left}px;top:${top-host.top}px;width:${width}px;height:${height}px;clip-path:polygon(${polygon});`;
  }
  button.style.zIndex=i===chosenHand?'21':'';
 });
}
function convexHull(points){
 const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),lower=[],upper=[];
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
 for(const p of sorted.reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
 return [...lower.slice(0,-1),...upper.slice(0,-1)];
}
function previewHand(index){
 if(busy||document.body.dataset.view!=='manual')return;
 handIndex=index===chosenHand?-1:index;deck.hoverCard(handIndex);
 updateHandButtons();
}
function layoutHand(targets){
 const host=$('#deck-stage').getBoundingClientRect();
 handTargets=targets.map((_,i)=>({corners:deck.getHandHitCorners(i,false,false).map(c=>({x:c.x-host.left,y:c.y-host.top}))}));
 updateHandButtons();
}
function chooseCard(index,focusDetails=false){
 if(busy||document.body.dataset.view!=='manual'||index<0||index===chosenHand)return;
 deck.chooseHand(index);showCard(catalog[index],true);
 if(focusDetails)$('#draw-detail').focus({preventScroll:true});
}
function exitHandView(){
 if(busy||chosenHand<0||document.body.dataset.view!=='manual')return;
 chosenHand=-1;handIndex=-1;deck.releaseHand();
 $('#draw-result').hidden=true;status.textContent='';updateHandButtons();
 $('#deck-stage').setAttribute('aria-label','扇形手牌，悬停或使用左右方向键选牌，点击或按回车翻面');
}
catalog.forEach((card,index)=>{
 const button=document.createElement('button');button.type='button';button.className='hand-choice';button.tabIndex=index===0?0:-1;button.setAttribute('aria-label',`翻看第 ${index+1} 张卡牌`);button.setAttribute('aria-pressed','false');
 button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')previewHand(index);});
 button.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'&&handIndex===index)previewHand(-1);});
 button.addEventListener('focus',()=>previewHand(index));
 button.addEventListener('click',event=>chooseCard(index,event.detail===0));
 handPicker.append(button);
});
handPicker.addEventListener('keydown',event=>{
 let index=handIndex<0?0:handIndex;
 if(event.key==='ArrowRight')index=(index+1)%catalog.length;
 else if(event.key==='ArrowLeft')index=(index-1+catalog.length)%catalog.length;
 else if(event.key==='Home')index=0;
 else if(event.key==='End')index=catalog.length-1;
 else return;
 if(index===chosenHand)index=(index+(event.key==='ArrowLeft'||event.key==='End'?-1:1)+catalog.length)%catalog.length;
 event.preventDefault();handPicker.children[index].focus({preventScroll:true});
});
$('#deck-stage').addEventListener('pointerleave',event=>{if(event.pointerType!=='touch'){previewHand(-1);}});
$('#deck-stage').addEventListener('click',event=>{if(!event.target.closest('.hand-choice'))exitHandView();});
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||chosenHand<0||busy)return;
 event.preventDefault();handPicker.children[chosenHand].focus({preventScroll:true});exitHandView();
});
drawManual.addEventListener('click',async()=>{
 if(busy||!deck||document.body.dataset.view==='manual')return;
 lock(true);hideHand();$('#draw-result').hidden=true;returnBox.hidden=true;status.textContent='展开手牌，挑选你的下一次相遇…';
 try{
  await deck.spread({manual:true});document.body.dataset.view='manual';handPicker.hidden=false;returnBox.hidden=false;
  updateHandButtons();
  drawManual.setAttribute('aria-pressed','true');$('#deck-stage').setAttribute('role','group');$('#deck-stage').setAttribute('aria-label','扇形手牌，悬停或使用左右方向键选牌，点击或按回车翻面');
  status.textContent='';
 }catch(error){console.error(error);boxView();status.textContent='手牌暂时未加载成功，请再试一次。';}
 finally{lock(false);}
});
drawOne.addEventListener('click',async()=>{
 if(busy||!deck)return;
 const keepHand=document.body.dataset.view==='manual';
 lock(true);hideHand();$('#draw-result').hidden=true;returnBox.hidden=true;status.textContent='正在抽取，静候一次相遇…';
 // Avoid an immediate repeat while keeping the rest of the collection equally likely.
 const available=catalog.filter(card=>card.id!==lastCard),card=available[Math.floor(Math.random()*available.length)];
 try{
  await deck.draw(card.id);showCard(card,keepHand);
 }catch(error){console.error(error);deck.reset();document.body.dataset.view='box';status.textContent='卡面暂时未加载成功，请再抽一次。';}
 finally{lock(false);}
});
function prepareGridImages(){
 if(!gridImagesReady)gridImagesReady=(async()=>{
  for(const image of grid.querySelectorAll('img')){
   image.loading='eager';await image.decode();
  }
 })().catch(error=>{gridImagesReady=undefined;throw error;});
 return gridImagesReady;
}
drawAll.addEventListener('click',async()=>{
 if(busy)return;lock(true);hideHand();$('#draw-result').hidden=true;returnBox.hidden=true;status.textContent='整盒展开，所有世界即将相遇…';
 try{
  const [positions]=await Promise.all([deck&&!reduced.matches?deck.spread():null,prepareGridImages()]);
  gridView();
  if(positions){
   // Read every destination before adding layers, so the handoff needs one layout.
   const items=[...grid.querySelectorAll('.specimen')],targets=items.map(item=>item.querySelector('.card-window').getBoundingClientRect());
   const faces=deck.getCardFaces(),fragment=document.createDocumentFragment();
   const flights=items.map((item,i)=>{
    const target=targets[i],start=positions[i],height=target.width*1.5;
    const ghost=document.createElement('div');ghost.className='deal-ghost';ghost.setAttribute('aria-hidden','true');
    ghost.style.cssText=`left:${target.left}px;top:${target.top}px;width:${target.width}px;height:${height}px;border-radius:2px;will-change:transform,opacity,clip-path;`;
    // The Three.js texture already owns a decoded, cropped canvas. Reuse it directly.
    const canvas=faces[i];ghost.append(canvas);fragment.append(ghost);
    const from=`translate3d(${start.x-target.left-target.width/2}px,${start.y-target.top-height/2}px,0) rotate(${start.angle}deg) scale(${start.width/target.width})`;
    const clip=`inset(0 0 ${height-target.height}px 0)`,crop=`translate(${-target.width*.06}px,${-target.width*.28}px) scale(1.12)`;
    return {ghost,canvas,from,clip,crop,item,delay:i*10};
   });
   document.body.append(fragment);
   const animations=flights.map(({ghost,canvas,from,clip,crop,item,delay})=>{
    const timing={duration:980,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};
    const motion=ghost.animate([{transform:from,clipPath:'inset(0)',opacity:1},{transform:'translate3d(0,0,0) rotate(0deg) scale(1)',clipPath:clip,opacity:1,offset:.86},{transform:'translate3d(0,0,0) rotate(0deg) scale(1)',clipPath:clip,opacity:0}],timing);
    const imageMotion=canvas.animate([{transform:'translate(0,0) scale(1)'},{transform:crop,offset:.86},{transform:crop}],timing);
    const itemMotion=item.animate([{opacity:0},{opacity:0,offset:.86},{opacity:1}],timing);
    return motion.finished.finally(()=>{ghost.remove();motion.cancel();imageMotion.cancel();itemMotion.cancel();});
   });
   await Promise.all(animations);
  }
  $('#collect-all').focus({preventScroll:true});
 }catch(error){console.error(error);gridView();}
 finally{lock(false);}
});

try{
 const {createDeckScene}=await import('./deck-scene.js');deck=await createDeckScene($('#deck-stage'),catalog,{onHandLayout:layoutHand});$('#deck-loading').remove();lock(false);
}catch(error){
 console.error(error);$('#deck-loading').textContent='三维卡盒暂不可用，仍可展开全部卡牌。';status.textContent='点击「全部抽出」浏览完整图鉴。';drawAll.disabled=false;
}
