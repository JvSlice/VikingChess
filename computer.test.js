import assert from "node:assert/strict";
import { ATTACKER, DEFENDER, initialState, applyMove, legalMoves } from "./rules.js";
import { computerSide, createComputerGame, isComputerTurn } from "./game-mode.js";
import { chooseComputerMove } from "./computer-ai.js";
import { ComputerClient } from "./computer-client.js";

const tests=[];const test=(name,fn)=>tests.push([name,fn]);
test("human may choose attackers or defenders",()=>{assert.equal(createComputerGame(ATTACKER).humanSide,ATTACKER);assert.equal(computerSide(ATTACKER),DEFENDER);assert.equal(createComputerGame(DEFENDER).humanSide,DEFENDER);assert.equal(computerSide(DEFENDER),ATTACKER);});
test("computer opens as attackers when the human chooses defenders",()=>{const s=initialState();const cfg=createComputerGame(DEFENDER);assert.equal(s.turn,ATTACKER);assert(isComputerTurn(cfg.mode,cfg.humanSide,s.turn));});
test("computer move is legal and outcome is computed by shared rules",()=>{const s=initialState();const m=chooseComputerMove(s);assert(m);assert( s.board[m.from[0]][m.from[1]]===ATTACKER);assert(s.board[m.from[0]][m.from[1]]);assert(s.board[m.to[0]][m.to[1]]===null);const n=applyMove(s,m.from,m.to);assert.equal(n.turn,DEFENDER);assert.equal(n.lastMove.to.join(","),m.to.join(","));});
test("computer can reply as defenders after a human attacker move",()=>{const start=initialState(),after=applyMove(start,[0,3],[2,3]);assert(isComputerTurn("computer",ATTACKER,after.turn));const move=chooseComputerMove(after,"medium");assert(move);assert.equal(after.board[move.from[0]][move.from[1]]===DEFENDER||after.board[move.from[0]][move.from[1]]==="K",true);assert(legal(after,move.from,move.to));});
const legal=(state,from,to)=>legalMoves(state.board,...from).some(([r,c])=>r===to[0]&&c===to[1]);
test("computer returns no move for a finished game",()=>{const s=initialState();s.winner=ATTACKER;assert.equal(chooseComputerMove(s),null);});
test("difficulty levels return legal moves",()=>{for(const difficulty of ["easy","medium","hard"]){const s=initialState();const m=chooseComputerMove(s,difficulty);assert(m,`${difficulty} should choose a move`);assert(s.board[m.from[0]][m.from[1]]===ATTACKER);assert(legal(s,m.from,m.to),`${difficulty} must use a legal move`);}});
test("restart cancellation ignores a pending computer response",()=>{let fake;let applied=false;const c=new ComputerClient(()=>fake={terminated:false,terminate(){this.terminated=true},postMessage(){}});c.request(initialState(),"medium",()=>{applied=true;});const old=fake;c.cancel();old.onmessage({data:{id:1,move:{from:[0,3],to:[2,3]}}});assert.equal(old.terminated,true);assert.equal(applied,false);});
let failures=0;for(const [name,fn] of tests){try{fn();console.log(`PASS ${name}`);}catch(e){failures++;console.error(`FAIL ${name}\n${e.stack}`);}}console.log(`${tests.length-failures}/${tests.length} computer checks passed`);if(failures)process.exitCode=1;
