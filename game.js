import { ATTACKER, DEFENDER, KING, SIZE, CORNERS, initialState, legalMoves, applyMove } from "./rules.js";
import { isComputerTurn } from "./game-mode.js";
import { ComputerClient } from "./computer-client.js";

let state=initialState(),selected=null,targets=[],mode="two",humanSide=ATTACKER,gameId=0,pendingMoveTimer=null;
const client=new ComputerClient();
const setupPage=document.querySelector("#setup-page"),gamePage=document.querySelector("#game-page"),restartDialog=document.querySelector("#restart-dialog"),boardEl=document.querySelector("#board"),label=document.querySelector("#status-label"),detail=document.querySelector("#status-detail"),marker=document.querySelector("#turn-marker"),counts=document.querySelector("#capture-count"),modeSelect=document.querySelector("#play-mode"),sideSelect=document.querySelector("#human-side"),difficultySelect=document.querySelector("#difficulty"),sideChoice=document.querySelector("#side-choice"),difficultyChoice=document.querySelector("#difficulty-choice");
const squareEls=[];
for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
  const el=document.createElement("button");el.type="button";el.className="square";el.setAttribute("role","gridcell");el.setAttribute("aria-label",`Row ${r+1}, column ${c+1}`);el.dataset.r=r;el.dataset.c=c;
  if(r===5&&c===5)el.classList.add("throne");if(CORNERS.some(([x,y])=>x===r&&y===c))el.classList.add("corner");
  el.addEventListener("click",()=>clickSquare(r,c));boardEl.append(el);squareEls.push(el);
}
function cancelComputer(){gameId++;client.cancel();clearTimeout(pendingMoveTimer);pendingMoveTimer=null;}
function newGame(){cancelComputer();state=initialState();selected=null;targets=[];render();}
modeSelect.addEventListener("change",()=>{const againstComputer=modeSelect.value==="computer";sideChoice.hidden=!againstComputer;difficultyChoice.hidden=!againstComputer;});
document.querySelector("#launch-game").addEventListener("click",()=>{
  mode=modeSelect.value;humanSide=sideSelect.value;difficultySelect.value ||= "medium";
  document.querySelector(".game-shell").classList.add("game-active");setupPage.hidden=true;gamePage.hidden=false;newGame();
});
document.querySelector("#new-game").addEventListener("click",()=>{
  if(typeof restartDialog.showModal==="function")restartDialog.showModal();
  else if(window.confirm("End this match and return to game setup?"))showSetup();
});
restartDialog.addEventListener("close",()=>{if(restartDialog.returnValue==="setup")showSetup();});
function showSetup(){cancelComputer();document.querySelector(".game-shell").classList.remove("game-active");setupPage.hidden=false;gamePage.hidden=true;}
function clickSquare(r,c){
  if(state.winner||isComputerTurn(mode,humanSide,state.turn))return;
  const p=state.board[r][c];
  if(selected&&targets.some(([x,y])=>x===r&&y===c)){state=applyMove(state,selected,[r,c]);selected=null;targets=[];render();return;}
  if(p&&(p===state.turn||(p===KING&&state.turn===DEFENDER))){selected=[r,c];targets=legalMoves(state.board,r,c);render();return;}
  selected=null;targets=[];render();
}
function requestComputerMove(){
  if(!isComputerTurn(mode,humanSide,state.turn)||state.winner||client.worker)return;
  const requestedGame=gameId;
  client.request(state,difficultySelect.value,(move)=>{
    if(requestedGame!==gameId||!move)return;
    pendingMoveTimer=setTimeout(()=>{pendingMoveTimer=null;if(requestedGame!==gameId)return;state=applyMove(state,move.from,move.to);selected=null;targets=[];render();},1100);
  },()=>{if(requestedGame===gameId){detail.textContent="Computer could not find a move. Start a new game to continue.";}});
}
function render(){
  squareEls.forEach(el=>{const r=+el.dataset.r,c=+el.dataset.c,p=state.board[r][c];el.replaceChildren();el.classList.toggle("selected",!!selected&&selected[0]===r&&selected[1]===c);el.classList.toggle("legal",targets.some(([x,y])=>x===r&&y===c));el.classList.toggle("has-piece",!!p);el.classList.toggle("last-move",!!state.lastMove&&((state.lastMove.from[0]===r&&state.lastMove.from[1]===c)||(state.lastMove.to[0]===r&&state.lastMove.to[1]===c)));
    if(p){const piece=document.createElement("span");piece.className=`piece ${p===ATTACKER?"attacker":p===KING?"king":"defender"}`;piece.setAttribute("aria-hidden","true");el.append(piece);el.setAttribute("aria-label",`${p===ATTACKER?"Attacker":p===KING?"King":"Defender"}, row ${r+1}, column ${c+1}`);}else el.setAttribute("aria-label",`${r===5&&c===5?"Throne":CORNERS.some(([x,y])=>x===r&&y===c)?"Corner refuge":"Empty square"}, row ${r+1}, column ${c+1}`);
  });
  const thinking=isComputerTurn(mode,humanSide,state.turn)&&!state.winner;
  marker.classList.toggle("defenders",state.turn===DEFENDER);
  label.textContent=thinking?"Computer thinking":state.winner?(state.winner==="draw"?"Game drawn":state.winner===ATTACKER?"Attackers win":"Defenders win"):`${state.turn===ATTACKER?"Attackers":"Defenders"} to move`;
  detail.textContent=state.winner?state.reason:thinking?`${state.turn===ATTACKER?"Dark attackers":"Light defenders"} are choosing a move.`:selected?`${targets.length} legal destination${targets.length===1?"":"s"} highlighted`:state.turn===ATTACKER?"Dark pieces move first":"Light side, move your king to a corner";
  counts.textContent=`Captured · dark ${state.captured[ATTACKER]} : light ${state.captured[DEFENDER]}`;
  if(thinking)requestComputerMove();
}
render();
