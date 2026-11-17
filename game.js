import { ATTACKER, DEFENDER, KING, SIZE, CORNERS, THRONE, initialState, legalMoves, applyMove } from "./rules.js";

let state=initialState(), selected=null, targets=[];
const boardEl=document.querySelector("#board"), label=document.querySelector("#status-label"), detail=document.querySelector("#status-detail"), marker=document.querySelector("#turn-marker"), counts=document.querySelector("#capture-count");
const squareEls=[];
for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
  const el=document.createElement("button"); el.type="button";el.className="square";el.setAttribute("role","gridcell");el.setAttribute("aria-label",`Row ${r+1}, column ${c+1}`);el.dataset.r=r;el.dataset.c=c;
  if(r===5&&c===5)el.classList.add("throne"); if(CORNERS.some(([x,y])=>x===r&&y===c))el.classList.add("corner");
  el.addEventListener("click",()=>clickSquare(r,c));boardEl.append(el);squareEls.push(el);
}
document.querySelector("#new-game").addEventListener("click",()=>{state=initialState();selected=null;targets=[];render();});
function clickSquare(r,c){
  if(state.winner)return;
  const p=state.board[r][c];
  if(selected&&targets.some(([x,y])=>x===r&&y===c)){state=applyMove(state,selected,[r,c]);selected=null;targets=[];render();return;}
  if(p&&(p===state.turn||(p===KING&&state.turn===DEFENDER))){selected=[r,c];targets=legalMoves(state.board,r,c);render();return;}
  selected=null;targets=[];render();
}
function render(){
  squareEls.forEach(el=>{const r=+el.dataset.r,c=+el.dataset.c,p=state.board[r][c];el.replaceChildren();el.classList.toggle("selected",!!selected&&selected[0]===r&&selected[1]===c);el.classList.toggle("legal",targets.some(([x,y])=>x===r&&y===c));el.classList.toggle("has-piece",!!p);el.classList.toggle("last-move",!!state.lastMove&&((state.lastMove.from[0]===r&&state.lastMove.from[1]===c)||(state.lastMove.to[0]===r&&state.lastMove.to[1]===c)));
    if(p){const piece=document.createElement("span");piece.className=`piece ${p===ATTACKER?"attacker":p===KING?"king":"defender"}`;piece.setAttribute("aria-hidden","true");el.append(piece);el.setAttribute("aria-label",`${p===ATTACKER?"Attacker":p===KING?"King":"Defender"}, row ${r+1}, column ${c+1}`);}else el.setAttribute("aria-label",`${r===5&&c===5?"Throne":CORNERS.some(([x,y])=>x===r&&y===c)?"Corner refuge":"Empty square"}, row ${r+1}, column ${c+1}`);
  });
  marker.classList.toggle("defenders",state.turn===DEFENDER);
  label.textContent=state.winner?(state.winner==="draw"?"Game drawn":state.winner===ATTACKER?"Attackers win":"Defenders win"):`${state.turn===ATTACKER?"Attackers":"Defenders"} to move`;
  detail.textContent=state.winner?state.reason:(selected?`${targets.length} legal destination${targets.length===1?"":"s"} highlighted`:state.turn===ATTACKER?"Dark pieces move first":"Light side, move your king to a corner");
  counts.textContent=`Captured · dark ${state.captured[ATTACKER]} : light ${state.captured[DEFENDER]}`;
}
render();
