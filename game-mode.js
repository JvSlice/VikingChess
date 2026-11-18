import { ATTACKER, DEFENDER } from "./rules.js";

export const computerSide = humanSide => humanSide === ATTACKER ? DEFENDER : ATTACKER;
export const isComputerTurn = (mode, humanSide, turn) => mode === "computer" && turn !== humanSide;

export function createComputerGame(humanSide) {
  return { mode: "computer", humanSide, computerSide: computerSide(humanSide), firstTurn: ATTACKER };
}
