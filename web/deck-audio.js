// Short, locally synthesized paper sounds; no downloads or autoplay on page load.
export function createDeckAudio(){
 let context,noise;
 const sources=new Set();
 function unlock(){
  try{
   const AudioContext=window.AudioContext||window.webkitAudioContext;
   if(!AudioContext)return;
   if(!context){
    context=new AudioContext();noise=context.createBuffer(1,context.sampleRate,context.sampleRate);
    const samples=noise.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
   }
   if(context.state==='suspended')context.resume().catch(()=>{});
  }catch{ /* Audio is optional; card interactions remain available. */ }
 }
 function stop(){for(const source of sources)source.stop();sources.clear();}
 function brush(delay,duration,volume,frequency){
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  const time=context.currentTime+delay;
  source.buffer=noise;filter.type='bandpass';filter.Q.value=.65;
  filter.frequency.setValueAtTime(frequency,time);filter.frequency.exponentialRampToValueAtTime(frequency*.55,time+duration);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  source.connect(filter);filter.connect(gain);gain.connect(context.destination);
  sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
  source.start(time,Math.random()*.5,duration);
 }
 function play(cue){
  if(!context||context.state!=='running'||document.hidden)return;
  // Replacing the previous cue also keeps reduced-motion transitions compact.
  stop();
  if(cue==='shuffle')for(let i=0;i<12;i++)brush(i*.055,.085,.11,1900+(i%3)*350);
  else if(cue==='collect'){
   for(let i=0;i<6;i++)brush(i*.055,.12,.09,1600-i*120);
  }else if(cue==='settle')brush(0,.11,.22,280);
  else if(cue==='flip'){brush(0,.12,.14,2300);brush(.1,.07,.1,700);}
  else brush(0,.32,.15,1800);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 return {unlock,play};
}
