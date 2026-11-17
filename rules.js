// Fetlar Hnefatafl rules, kept independent of DOM and presentation.
export const SIZE = 11;
export const ATTACKER = "A";
export const DEFENDER = "D";
export const KING = "K";
export const THRONE = [5, 5];
export const CORNERS = [[0,0],[0,10],[10,0],[10,10]];
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
const key = (r,c) => `${r},${c}`;
const inside = (r,c) => r>=0 && r<SIZE && c>=0 && c<SIZE;
export const pieceSide = p => p === ATTACKER ? ATTACKER : (p ? DEFENDER : null);
export const makeBoard = () => {
  const b = Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  for (let c=3;c<=7;c++) { b[0][c]=ATTACKER; b[10][c]=ATTACKER; }
  b[1][5]=ATTACKER; b[9][5]=ATTACKER;
  for (let r=3;r<=7;r++) { b[r][0]=ATTACKER; b[r][10]=ATTACKER; }
  b[5][1]=ATTACKER; b[5][9]=ATTACKER;
  for (const [r,c] of [[3,5],[4,5],[6,5],[7,5],[5,3],[5,4],[5,6],[5,7],[4,4],[4,6],[6,4],[6,6]]) b[r][c]=DEFENDER;
  b[5][5]=KING;
  return b;
};
export const initialState = () => ({board:makeBoard(),turn:ATTACKER,winner:null,reason:"",lastMove:null,history:new Map(),captured:{[ATTACKER]:0,[DEFENDER]:0}});
export const isRestricted = (r,c) => (r===5&&c===5) || CORNERS.some(([x,y])=>x===r&&y===c);
function occupied(b,r,c) { return inside(r,c) && !!b[r][c]; }
export function legalMoves(b,r,c) {
  const piece=b[r]?.[c]; if (!piece) return [];
  const side=pieceSide(piece), out=[];
  for(const [dr,dc] of DIRS) for(let n=1;;n++) {
    const nr=r+dr*n,nc=c+dc*n;
    if(!inside(nr,nc)||b[nr][nc]) break;
    if(isRestricted(nr,nc)&&piece!==KING) continue; // throne is traversable, corners are not
    out.push([nr,nc]);
  }
  return out;
}
function hostileForCapture(b,r,c,victimSide) {
  if(CORNERS.some(([x,y])=>x===r&&y===c)) return true;
  if(r===5&&c===5) return victimSide===ATTACKER || !b[5][5];
  return false;
}
function sandwichCaptures(b,r,c,movingSide) {
  const captures=[];
  for(const [dr,dc] of DIRS) {
    const ar=r+dr, ac=c+dc, br=r+2*dr, bc=c+2*dc;
    if(!inside(ar,ac)||!b[ar][ac]||pieceSide(b[ar][ac])===movingSide||b[ar][ac]===KING) continue;
    if((occupied(b,br,bc)&&pieceSide(b[br][bc])===movingSide)||hostileForCapture(b,br,bc,pieceSide(b[ar][ac]))) captures.push([ar,ac]);
  }
  return captures;
}
function kingCaptured(b) {
  let k=null; for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(b[r][c]===KING) k=[r,c];
  if(!k) return true;
  const [r,c]=k, neighbors=DIRS.map(([dr,dc])=>[r+dr,c+dc]).filter(([x,y])=>inside(x,y));
  const edge=r===0||c===0||r===10||c===10;
  const defenders=b.flat().filter(p=>p===DEFENDER).length;
  if(edge && defenders>0) return false;
  const required=neighbors.filter(([x,y])=>!(x===5&&y===5));
  return required.length>0 && required.every(([x,y])=>b[x][y]===ATTACKER);
}
function surrounded(b) {
  // Flood empty/defender squares from the board edge; a complete attacker ring
  // leaves the king and every remaining defender disconnected from the edge.
  const seen=new Set(), q=[];
  for(let i=0;i<SIZE;i++) for(const [r,c] of [[0,i],[10,i],[i,0],[i,10]]) if(b[r][c]!==ATTACKER&&!seen.has(key(r,c))) {seen.add(key(r,c));q.push([r,c]);}
  for(let n=0;n<q.length;n++) { const [r,c]=q[n]; for(const [dr,dc] of DIRS){const x=r+dr,y=c+dc,k=key(x,y);if(inside(x,y)&&b[x][y]!==ATTACKER&&!seen.has(k)){seen.add(k);q.push([x,y]);}} }
  let king=null, defenders=0, allInside=true;
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {if(b[r][c]===KING)king=[r,c];if(b[r][c]===DEFENDER){defenders++;if(seen.has(key(r,c)))allInside=false;}}
  return !!king && !seen.has(key(...king)) && allInside && defenders>=0;
}
function positionKey(b,turn) { return `${turn}|${b.map(row=>row.map(x=>x||"-").join("")).join("")}`; }
function hasAnyMove(b,side) { for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(pieceSide(b[r][c])===side&&legalMoves(b,r,c).length)return true;return false; }
export function applyMove(state,from,to) {
  if(state.winner) throw new Error("The game is over");
  const [r,c]=from,[nr,nc]=to,p=state.board[r]?.[c];
  if(pieceSide(p)!==state.turn||!legalMoves(state.board,r,c).some(([x,y])=>x===nr&&y===nc)) throw new Error("Illegal move");
  const b=state.board.map(row=>row.slice()), movingSide=state.turn;
  b[nr][nc]=p;b[r][c]=null;
  const caps=sandwichCaptures(b,nr,nc,movingSide);
  const captured={...state.captured};
  for(const [x,y] of caps){b[x][y]=null;captured[movingSide]++;}
  let winner=null,reason="";
  if(p===KING&&CORNERS.some(([x,y])=>x===nr&&y===nc)){winner=DEFENDER;reason="The king escaped to a corner.";}
  else if(kingCaptured(b)){winner=ATTACKER;reason="The king was surrounded.";}
  else if(surrounded(b)){winner=ATTACKER;reason="The attackers surrounded every defender.";}
  const nextTurn=movingSide===ATTACKER?DEFENDER:ATTACKER;
  const pos=positionKey(b,nextTurn), history=new Map(state.history), count=(history.get(pos)||0)+1;history.set(pos,count);
  if(!winner&&count>=3){winner="draw";reason="The same position occurred three times.";}
  if(!winner&&!hasAnyMove(b,nextTurn)){winner=movingSide;reason=`${nextTurn===ATTACKER?"Attackers":"Defenders"} have no legal move.`;}
  return {board:b,turn:nextTurn,winner,reason,lastMove:{from,to,captured:caps},captured,history};
}
