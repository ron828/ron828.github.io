import {LEVELS} from './levels.js?v=20261016-ladder-v2';
import {createState,step,clone} from './engine.mjs?v=20261016-ladder-v2';

const $=id=>document.getElementById(id);
const canvas=$('board'),ctx=canvas.getContext('2d');
const SIZE=52,STORE='ron828-cat-and-friends-v1';
let saved={done:[],last:1},storageOK=true;
try {
  const value=JSON.parse(localStorage.getItem(STORE)||'null');
  if(value && Array.isArray(value.done)) saved={done:value.done.filter(n=>Number.isInteger(n)),last:Number(value.last)||1};
} catch {storageOK=false;}
let index=Math.max(0,LEVELS.findIndex(l=>l.id===saved.last));
let state,history=[],future=[];
let frame=0,repeatTimer,heldKey=null;

function save(){try{localStorage.setItem(STORE,JSON.stringify(saved));}catch{storageOK=false;}$('storage-note').hidden=storageOK;}
function load(i){
  stopRepeat();
  index=Math.max(0,Math.min(LEVELS.length-1,i));state=createState(LEVELS[index]);history=[];future=[];
  saved.last=LEVELS[index].id;save();
  $('announcement').textContent=state.cats.length===2?'בחדר הזה יש שני חתולים. השתמשו בכפתור ההחלפה כדי לשתף פעולה.':'הגיעו לכל היצורים ונגעו בהם מהצד.';
  update();
}

function move(action){
  const next=step(state,action);if(!next)return;
  history.push(clone(state));future=[];state=next;
  if(state.won){
    if(!saved.done.includes(LEVELS[index].id))saved.done.push(LEVELS[index].id);
    save();$('announcement').textContent='השלב הושלם!';
  }
  update();
}
function undo(){if(!history.length)return;future.push(clone(state));state=history.pop();$('announcement').textContent='המהלך בוטל.';update();}
function redo(){if(!future.length)return;history.push(clone(state));state=future.pop();$('announcement').textContent='המהלך בוצע שוב.';update();}
function update(){
  $('level-title').textContent=`שלב ${LEVELS[index].id}`;
  const remaining=state.actors.filter(a=>a.type!=='B').length;
  $('remaining').textContent=`יצורים: ${remaining}`;$('move-count').textContent=`מהלכים: ${state.moves}`;
  $('undo').disabled=!history.length;$('redo').disabled=!future.length;
  $('switch').hidden=state.cats.length<2;
  $('switch').textContent=`חתול ${state.active+1} · החלפה ⇄`;
  $('win').hidden=!state.won;
  $('win-message').textContent=index===LEVELS.length-1?'סיימתם את השלב האחרון בגרסה הזו. אפשר לחזור לכל שלב דרך בחירת השלבים.':`פתרתם את החדר ב־${state.moves} מהלכים. מוכנים לחדר הבא?`;
  $('next').hidden=index===LEVELS.length-1;
  $('progress').textContent=`נפתרו ${LEVELS.filter(l=>saved.done.includes(l.id)).length} מתוך ${LEVELS.length} שלבים · ההתקדמות נשמרת במכשיר הזה`;
  canvas.setAttribute('aria-label',`שלב ${LEVELS[index].id}, ${remaining} יצורים נותרו, ${state.moves} מהלכים. השתמשו בחצים לתנועה.`);
  draw();
}

function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function wall(x,y){
  rect(x,y,SIZE,SIZE,'#285575');rect(x+2,y+2,48,3,'#79bbce');rect(x+2,y+5,48,19,'#377390');
  rect(x+2,y+28,48,20,'#377390');rect(x,y+24,SIZE,4,'#18334e');rect(x+25,y,3,24,'#18334e');
  rect(x+10,y+28,3,24,'#18334e');rect(x+1,y+50,50,2,'#18334e');
}
function dirt(x,y){
  rect(x,y,SIZE,SIZE,'#c18760');rect(x+2,y+2,48,4,'#f4cd92');
  for(let j=12;j<52;j+=15)for(let i=5;i<50;i+=15){rect(x+i+(j%2)*3,y+j,5,4,'#8b5c4c');rect(x+i+6,y+j+5,3,3,'#e9b67f');}
}
function ladder(x,y){
  rect(x+10,y,6,52,'#794d40');rect(x+36,y,6,52,'#794d40');rect(x+12,y,2,52,'#ffd19a');rect(x+38,y,2,52,'#ffd19a');
  for(let j=5;j<52;j+=16){rect(x+15,y+j,23,6,'#794d40');rect(x+15,y+j,23,2,'#ffdea7');}
}
function rock(x,y){
  rect(x+5,y+5,42,42,'#112640');rect(x+8,y+7,34,37,'#698da0');rect(x+10,y+8,24,6,'#b1d2d5');rect(x+8,y+14,7,17,'#99bac4');
  rect(x+28,y+20,15,22,'#35546d');rect(x+23,y+27,8,8,'#35546d');rect(x+14,y+35,10,5,'#466980');
}
function creature(x,y,floating){
  const bob=floating && !matchMedia('(prefers-reduced-motion: reduce)').matches?Math.round(Math.sin(frame/25)*2):0;y+=bob;
  if(floating){
    rect(x+1,y+13,10,6,'#79699e');rect(x+4,y+19,10,6,'#79699e');rect(x+40,y+13,10,6,'#79699e');rect(x+37,y+19,10,6,'#79699e');
    rect(x+12,y+10,28,31,'#433b70');rect(x+16,y+7,20,36,'#a795cc');rect(x+20,y+7,10,5,'#d9ccef');
    rect(x+20,y+22,4,6,'#112640');rect(x+30,y+22,4,6,'#112640');rect(x+15,y+41,6,5,'#433b70');rect(x+31,y+41,6,5,'#433b70');
  }else{
    rect(x+9,y+8,12,14,'#70546b');rect(x+29,y+8,12,14,'#70546b');rect(x+12,y+10,6,8,'#f2afba');rect(x+32,y+10,6,8,'#f2afba');
    rect(x+9,y+22,32,21,'#70546b');rect(x+13,y+19,25,21,'#b895aa');rect(x+19,y+27,4,5,'#112640');rect(x+30,y+27,4,5,'#112640');
    rect(x+25,y+34,4,3,'#ffd19a');rect(x+8,y+44,14,3,'#433b59');rect(x+29,y+44,14,3,'#433b59');
  }
}
function cat(x,y,n,active){
  // Original pixel artwork, drawn directly in code.
  const fur=n===0?'#f3a349':'#f5dfb1',shade=n===0?'#bd673c':'#bd9c7a';
  rect(x+5,y+27,6,14,shade);rect(x+2,y+23,6,8,shade);rect(x+11,y+28,30,18,'#112640');rect(x+14,y+27,23,17,fur);
  rect(x+10,y+8,9,21,'#112640');rect(x+33,y+8,9,21,'#112640');rect(x+12,y+12,5,11,fur);rect(x+35,y+12,5,11,fur);
  rect(x+10,y+20,32,18,'#112640');rect(x+13,y+18,26,18,fur);rect(x+16,y+24,5,6,'#112640');rect(x+31,y+24,5,6,'#112640');
  rect(x+17,y+24,2,2,'#fff4da');rect(x+32,y+24,2,2,'#fff4da');rect(x+24,y+30,5,3,'#985455');rect(x+19,y+35,14,5,'#fff4da');
  rect(x+6,y+29,8,2,'#112640');rect(x+38,y+29,8,2,'#112640');rect(x+12,y+44,11,4,'#112640');rect(x+31,y+44,11,4,'#112640');
  if(active){rect(x+22,y+1,10,3,'#d15b36');rect(x+24,y+4,6,3,'#d15b36');}
}
function draw(){
  ctx.imageSmoothingEnabled=false;
  rect(0,0,canvas.width,canvas.height,'#eaf5ea');
  state.terrain.forEach((row,y)=>row.forEach((t,x)=>{
    if(t==='#')wall(x*SIZE,y*SIZE);if(t==='D')dirt(x*SIZE,y*SIZE);if(t==='H')ladder(x*SIZE,y*SIZE);
  }));
  for(const a of state.actors)if(a.type==='B')rock(a.x*SIZE,a.y*SIZE);else creature(a.x*SIZE,a.y*SIZE,a.type==='F');
  state.cats.forEach((c,n)=>cat(c.x*SIZE,c.y*SIZE,n,n===state.active));
}
function picker(){
  stopRepeat();
  $('level-grid').replaceChildren(...LEVELS.map((l,i)=>{
    const b=document.createElement('button'),done=saved.done.includes(l.id);b.textContent=`${l.id}${done?' ✓':''}`;
    b.className=(done?'done ':'')+(i===index?'current':'');b.setAttribute('aria-label',`שלב ${l.id}${done?' — הושלם':''}`);
    if(i===index)b.setAttribute('aria-current','true');b.onclick=()=>{$('level-picker').close();load(i);canvas.focus({preventScroll:true});};return b;
  }));
  $('level-picker').showModal();
}
$('levels-open').onclick=picker;$('win-levels').onclick=picker;$('levels-close').onclick=()=>$('level-picker').close();
$('undo').onclick=undo;$('redo').onclick=redo;$('restart').onclick=()=>load(index);$('switch').onclick=()=>move('switch');$('next').onclick=()=>load(index+1);
const keyActions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'};
document.addEventListener('keydown',e=>{
  if($('level-picker').open||e.altKey||e.metaKey||e.ctrlKey)return;
  if(e.target.closest('button,a')&&(e.code==='Space'||e.code==='Enter'))return;
  if(keyActions[e.code]){e.preventDefault();if(e.repeat)return;stopRepeat();heldKey=e.code;move(keyActions[e.code]);repeatTimer=setTimeout(()=>repeat(keyActions[e.code]),250);}
  else if(e.code==='KeyZ'){e.preventDefault();undo();}else if(e.code==='KeyY'){e.preventDefault();redo();}
  else if(e.code==='KeyR'){e.preventDefault();load(index);}else if(e.code==='Space'){e.preventDefault();move('switch');}
});
document.addEventListener('keyup',e=>{if(e.code===heldKey)stopRepeat();});
function stopRepeat(){clearTimeout(repeatTimer);heldKey=null;}
function repeat(action){move(action);repeatTimer=setTimeout(()=>repeat(action),150);}
window.addEventListener('blur',stopRepeat);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRepeat();});
document.querySelectorAll('[data-action]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();stopRepeat();b.setPointerCapture(e.pointerId);move(b.dataset.action);repeatTimer=setTimeout(()=>repeat(b.dataset.action),250);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,stopRepeat);
  b.addEventListener('click',e=>{if(e.detail===0)move(b.dataset.action);});
});
load(index);
function animate(){frame++;if(frame%6===0&&!document.hidden)draw();requestAnimationFrame(animate);}requestAnimationFrame(animate);
