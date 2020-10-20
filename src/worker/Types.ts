import { Candle } from "../context/globalContext/Types";
import { Script } from "../context/scriptsContext/Types";

export type WorkerType = "parser" | "scripts-executioner";

export interface MessageIn {
  type: WorkerType;
  payload: ScriptExecutionerWorkerMessageIn | ParserWorkerMessageIn;
}

export interface MessageOut {
  type: WorkerType;
  payload: ScriptExecutionerWorkerMessageOut | ParserWorkerMessageOut;
}

export interface ScriptExecutionerWorkerMessageIn {
  script: Script;
  data: Candle[];
  initialBalance: number;
}

export interface ScriptExecutionerWorkerMessageOut {
  balance: number;
  progress: number;
}

export interface AppWorker extends Worker {
  postMessage(message: MessageIn): void;
  postMessage(message: MessageOut): void;
  postMessage(message: { error: Error }): void;
}

export type ParserWorkerMessageIn = string;
export type ParserWorkerMessageOut = Candle[];
