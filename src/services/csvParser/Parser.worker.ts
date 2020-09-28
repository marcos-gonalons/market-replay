import { ChartData } from "../../context/dataContext/Types";
import { parse } from "./Parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: ParserWorker = self as any;

export type ParserWorkerMessageIn = string;
export type ParserWorkerMessageOut = ChartData[] | Error;

export interface ParserWorker extends Worker {
  postMessage(message: ParserWorkerMessageIn): void;
  postMessage(message: ParserWorkerMessageOut): void;
}

ctx.addEventListener("message", ({ data }: MessageEvent) => {
  try {
    ctx.postMessage(parse(data as ParserWorkerMessageIn));
  } catch (err: unknown) {
    ctx.postMessage(err as Error);
  }
});

export {};
