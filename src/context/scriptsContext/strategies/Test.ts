import { StrategyFuncParameters } from "../../../services/scriptsExecutioner/Types";
import { IsValidHorizontalLevel } from "./common/GetHorizontalLevel";


export function Strategy({
  candles,
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  persistedVars,
  params,
  debugLog,
}: StrategyFuncParameters) {
  const ENABLE_DEBUG = true;

  void persistedVars;
  void trades;
  void spread;
  void createOrder;

  debugLog(ENABLE_DEBUG, "Params ", params);

  if (balance < 0) {
    balance = 1;
  }
  if (candles.length <= 1 || currentDataIndex === 0) return;

  let candlesToCheck = 300;

  for (let x = currentDataIndex; x > currentDataIndex - candlesToCheck; x--) {
    if (x < 0) {
      break;
    }

    const isResistance = IsValidHorizontalLevel({
      resistanceOrSupport: "resistance",
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      candles,
      startAtIndex: currentDataIndex
    });

    if (isResistance) {
      candles[x].meta = { type: "resistance"};
      console.log("Resistance", new Date(candles[x].timestamp), x);
      break;
    }

    const isSupport = IsValidHorizontalLevel({
      resistanceOrSupport: "support",
      indexToCheck: x,
      candlesAmountToBeConsideredHorizontalLevel: params!.candlesAmountToBeConsideredHorizontalLevel!,
      candles,
      startAtIndex: currentDataIndex
    });

    if (isSupport) {
        candles[x].meta = { type: "support"};
        console.log("Support", new Date(candles[x].timestamp), x);
        break;
    }
  }
}
