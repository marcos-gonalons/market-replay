import { parse } from "../services/csvParser/Parser";
import ScriptsExecutionerService from "../services/scriptsExecutioner/ScriptsExecutioner";
import { AppWorker, MessageIn, ParserWorkerMessageIn, ScriptExecutionerWorkerMessageIn } from "./Types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: AppWorker = self as any;

ctx.addEventListener("message", ({ data }: MessageEvent) => {
  const { type, payload } = data as MessageIn;

  try {
    switch (type) {
      case "parser":
        const parseResult = parse(payload as ParserWorkerMessageIn);
        ctx.postMessage({
          type,
          payload: parseResult,
        });
        break;
      case "scripts-executioner":
        const service = new ScriptsExecutionerService();
        const { script, data: candles, initialBalance } = payload as ScriptExecutionerWorkerMessageIn;
        service.executeWithFullData(script, candles, initialBalance, ctx);
        //service.executeCombinationsWithFullData(script, candles, initialBalance, ctx);
        break;
    }
  } catch (err: unknown) {
    console.log(err);
    ctx.postMessage({ error: err as Error });
  }
});

export {};
