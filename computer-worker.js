import { chooseComputerMove } from "./computer-ai.js";

self.addEventListener("message", event => {
  const { id, state, difficulty } = event.data;
  try { self.postMessage({ id, move: chooseComputerMove(state, difficulty) }); }
  catch (error) { self.postMessage({ id, error: String(error) }); }
});
