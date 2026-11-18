export class ComputerClient {
  constructor(workerFactory = () => new Worker("./computer-worker.js", { type: "module" })) {
    this.workerFactory=workerFactory;this.worker=null;this.requestId=0;
  }
  cancel(){this.requestId++;if(this.worker){this.worker.terminate();this.worker=null;}}
  request(state,difficulty,onResult,onError=()=>{}){
    this.cancel();const id=this.requestId,worker=this.workerFactory();this.worker=worker;
    worker.onmessage=event=>{if(this.worker!==worker||event.data.id!==this.requestId)return;this.worker=null;worker.terminate();if(event.data.error)onError(event.data.error);else onResult(event.data.move);};
    worker.onerror=error=>{if(this.worker!==worker)return;this.worker=null;worker.terminate();onError(error.message||"Computer failed");};
    worker.postMessage({id,state,difficulty});
  }
}
