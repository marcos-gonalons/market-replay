import { Candle } from "../../../globalContext/Types";
import { Order } from "../../../tradesContext/Types";

interface Params {
  readonly openPosition?: Order;
  readonly tpDistanceShortForTighterSL: number;
  readonly slDistanceWhenTpIsVeryClose: number;
  readonly currentCandle: Candle;
  readonly log: (...msg: any[]) => void;
}

export function handle({
  openPosition,
  tpDistanceShortForTighterSL,
  slDistanceWhenTpIsVeryClose,
  currentCandle,
  log
}: Params): void {
  if (!openPosition) return;

  if (openPosition.position === "long") {
    if (
      tpDistanceShortForTighterSL !== 0 && 
      currentCandle.timestamp > openPosition.createdAt! &&
      openPosition.takeProfit! - currentCandle.high < tpDistanceShortForTighterSL!
    ) {
      log(
        "Adjusting SL ...",
        openPosition,
        currentCandle,
        tpDistanceShortForTighterSL
      );
      const newSL = openPosition.price + slDistanceWhenTpIsVeryClose;
      if (newSL < currentCandle.close) {
        log("Adjusted SL", newSL);
        openPosition.stopLoss = newSL;
      } else {
        log("Can't adjust the SL, is higher than current price", newSL, currentCandle);
      }
    }
  }

  if (openPosition.position === "short") {
    if (
      tpDistanceShortForTighterSL !== 0 && 
      currentCandle.timestamp > openPosition.createdAt! &&
      currentCandle.low - openPosition.takeProfit! < tpDistanceShortForTighterSL!
    ) {
      log(
        "Adjusting SL ...",
        openPosition,
        currentCandle,
        tpDistanceShortForTighterSL
      );
      const newSL = openPosition.price - slDistanceWhenTpIsVeryClose;
      if (newSL > currentCandle.close) {
        log("Adjusted SL", newSL);
        openPosition.stopLoss = newSL;
      } else {
        log("Can't adjust the SL, is lower than current price", newSL, currentCandle);
      }
    }
  }
}