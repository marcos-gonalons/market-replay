import { Candle } from "../context/globalContext/Types";
import { Script } from "../context/scriptsContext/Types";
import { Trade } from "../context/tradesContext/Types";
import { Report } from "../services/reporter/Types";
import { StrategyParams } from "../services/scriptsExecutioner/Types";

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
  trades: Trade[];
  reports?: Report[];
  best?: StrategyParams;
  candles?: Candle[];
}

export interface AppWorker extends Worker {
  postMessage(message: MessageIn): void;
  postMessage(message: MessageOut): void;
  postMessage(message: { error: Error }): void;
}

export type ParserWorkerMessageIn = string;
export type ParserWorkerMessageOut = Candle[];
