// Deterministic, turn-based Catrap rules. Coordinates always run left to right.
export function createState(level) {
  const terrain = level.rows.map(row => [...row].map(c => c==='p'?'H':('#DH'.includes(c) ? c : '.')));
  const actors = [];
  const cats = [];
  level.rows.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'P'||c==='p') cats.push({x,y});
    if ('BEF'.includes(c)) actors.push({x,y,type:c});
  }));
  return {terrain,actors,cats,active:0,moves:0,won:false};
}

export const clone = s => ({...s,terrain:s.terrain.map(r=>r.slice()),actors:s.actors.map(a=>({...a})),cats:s.cats.map(c=>({...c}))});
export function tile(s,x,y) { return s.terrain[y]?.[x] ?? '#'; }
const actorAt = (s,x,y) => s.actors.find(a => a.x===x && a.y===y);
const catAt = (s,x,y) => s.cats.find(c => c.x===x && c.y===y);
function empty(s,x,y) { return '.H'.includes(tile(s,x,y)) && !actorAt(s,x,y) && !catAt(s,x,y); }

export function settle(s) {
  // Ladders support objects above them; cats can occupy and climb ladder cells.
  for (let pass=0;pass<100;pass++) {
    let moved=false;
    const things=[...s.actors.filter(a=>a.type!=='F'),...s.cats].sort((a,b)=>b.y-a.y);
    for (const a of things) {
      if (s.cats.includes(a) && tile(s,a.x,a.y)==='H') continue;
      if (tile(s,a.x,a.y+1)==='H') continue;
      if (empty(s,a.x,a.y+1)) {a.y++;moved=true;}
    }
    if (!moved) break;
  }
  s.won=!s.actors.some(a=>a.type==='E'||a.type==='F');
  return s;
}

export function step(state,action) {
  if (state.won) return null;
  const s=clone(state), p=s.cats[s.active];
  if (action==='switch') {
    if(s.cats.length<2) return null;
    s.active=(s.active+1)%s.cats.length; return s;
  }
  const d={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[action];
  if(!d) return null;
  const [dx,dy]=d, x=p.x+dx,y=p.y+dy;
  const t=tile(s,x,y), a=actorAt(s,x,y);
  if (t==='#'||catAt(s,x,y)) return null;
  if (dy) {
    // No jumping, vertical digging, or vertical attacks.
    if (a||t==='D') return null;
    if(dy<0 && tile(s,p.x,p.y)!=='H' && t!=='H') return null;
    if(dy>0 && tile(s,p.x,p.y)!=='H' && t!=='H') return null;
    p.y=y;
  } else if (t==='D') {
    s.terrain[y][x]='.';p.x=x;
  } else if (a?.type==='B') {
    // A rock can rest on top of a ladder, but cannot enter a ladder cell.
    if(tile(s,x+dx,y)!=='.'||!empty(s,x+dx,y)) return null;
    a.x+=dx; // Kicking a block does not also move the cat.
  } else if (a) {
    s.actors.splice(s.actors.indexOf(a),1);p.x=x;
  } else {p.x=x;}
  s.moves++;
  return settle(s);
}

export function stateKey(s) {
  return s.terrain.map(r=>r.join('')).join('')+'|'+s.actors.map(a=>a.type+String.fromCharCode(65+a.x+a.y*11)).sort().join('')+'|'+s.cats.map(c=>String.fromCharCode(65+c.x+c.y*11)).join('')+s.active;
}
