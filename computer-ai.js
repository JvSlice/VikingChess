import { ATTACKER, DEFENDER, KING, SIZE, CORNERS, legalMoves, applyMove, pieceSide } from "./rules.js";

function allMoves(state) {
  const moves=[];
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(pieceSide(state.board[r][c])===state.turn)
    for(const to of legalMoves(state.board,r,c)) moves.push({from:[r,c],to});
  return moves;
}
function kingSquare(board) {
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(board[r][c]===KING)return [r,c];
  return null;
}
function kingRoutes(board) {
  const start=kingSquare(board); if(!start)return {distance:99,routes:0,mobility:0};
  const q=[[...start,0]], seen=new Set([start.join(",")]);let routes=0,best=99;
  for(let i=0;i<q.length;i++){
    const [r,c,d]=q[i];
    if(CORNERS.some(([x,y])=>x===r&&y===c)){routes++;best=Math.min(best,d);continue;}
    for(const [nr,nc] of legalMoves(board,r,c)){const k=`${nr},${nc}`;if(!seen.has(k)){seen.add(k);q.push([nr,nc,d+1]);}}
  }
  return {distance:best,routes,mobility:legalMoves(board,...start).length};
}
function score(state,perspective,difficulty="medium") {
  if(state.winner===perspective)return 1000000;
  if(state.winner&&state.winner!=="draw")return -1000000;
  if(state.winner==="draw")return 0;
  const enemy=perspective===ATTACKER?DEFENDER:ATTACKER;
  const attackers=state.board.flat().filter(p=>p===ATTACKER).length;
  const defenders=state.board.flat().filter(p=>p===DEFENDER).length;
  const routes=kingRoutes(state.board),king=kingSquare(state.board);
  let adjacent=0,near=0;
  if(king)for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(state.board[r][c]===ATTACKER){const d=Math.abs(r-king[0])+Math.abs(c-king[1]);if(d===1)adjacent++;if(d<=3)near++;}
  const hard=difficulty==="hard";
  const pressure=adjacent*(hard?42:30)+near*(hard?4:3);
  const escape=routes.routes*(hard?62:45)+routes.mobility*(hard?2:1.6)-routes.distance*(hard?16:12);
  const material=(state.captured[perspective]||0)*(hard?32:24)-(state.captured[enemy]||0)*(hard?32:24);
  return (perspective===ATTACKER ? (12-defenders)*(hard?42:35) + pressure - escape : (24-attackers)*(hard?32:26) + escape - pressure) + material;
}

// Bounded one-ply evaluation with an exact immediate-win reply check. Evaluate
// all legal moves, rank them, then test opponent replies in rank order and stop
// at the first move that avoids every immediate win. This keeps mobile work low
// while preserving the urgent tactical check.
export function chooseComputerMove(state,difficulty="medium") {
  if(state.winner)return null;
  const moves=allMoves(state);if(!moves.length)return null;
  const candidates=[];
  for(const move of moves){
    const next=applyMove(state,move.from,move.to);
    if(next.winner===state.turn)return {from:move.from,to:move.to};
    candidates.push({move,next,value:score(next,state.turn,difficulty)});
  }
  candidates.sort((a,b)=>b.value-a.value);
  let order=candidates;
  if(difficulty==="easy"&&candidates.length>2){
    const start=Math.floor(candidates.length*.35),end=Math.max(start+1,Math.floor(candidates.length*.85));
    const easyPick=start+Math.floor(Math.random()*(end-start));
    order=[candidates[easyPick],...candidates.filter((_,i)=>i!==easyPick)];
  }
  let fallback=candidates[0];
  for(const candidate of order){
    if(candidate.next.winner)return {from:candidate.move.from,to:candidate.move.to};
    let immediateWin=false;
    for(const reply of allMoves(candidate.next)){
      const result=applyMove(candidate.next,reply.from,reply.to);
      if(result.winner===candidate.next.turn){immediateWin=true;break;}
    }
    if(!immediateWin)return {from:candidate.move.from,to:candidate.move.to};
  }
  return fallback ? {from:fallback.move.from,to:fallback.move.to} : null;
}
