import { Candle } from "../../../globalContext/Types";
import { Order } from "../../../tradesContext/Types";

interface Params {
  readonly openPosition?: Order;
  readonly trailingSL?: {
    readonly tpDistanceShortForTighterSL: number;
    readonly slDistanceWhenTpIsVeryClose: number;
  };
  readonly trailingTP?: {
    readonly slDistanceShortForTighterTP: number;
    readonly tpDistanceWhenSlIsVeryClose: number;
  };
  readonly currentCandle: Candle;
  readonly log: (...msg: any[]) => void;
}

export function handle({
  openPosition,
  trailingSL,
  trailingTP,
  currentCandle,
  log
}: Params): void {
  if (!openPosition) return;

  if (trailingSL) {
    if (openPosition.position === "long") {
      if (
        trailingSL.tpDistanceShortForTighterSL !== 0 && 
        currentCandle.timestamp > openPosition.createdAt! &&
        openPosition.takeProfit! - currentCandle.high < trailingSL.tpDistanceShortForTighterSL!
      ) {
        log(
          "Adjusting SL ...",
          openPosition,
          currentCandle,
          trailingSL.tpDistanceShortForTighterSL
        );
        const newSL = openPosition.price + trailingSL.slDistanceWhenTpIsVeryClose;
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
        trailingSL.tpDistanceShortForTighterSL !== 0 && 
        currentCandle.timestamp > openPosition.createdAt! &&
        currentCandle.low - openPosition.takeProfit! < trailingSL.tpDistanceShortForTighterSL!
      ) {
        log(
          "Adjusting SL ...",
          openPosition,
          currentCandle,
          trailingSL.tpDistanceShortForTighterSL
        );
        const newSL = openPosition.price - trailingSL.slDistanceWhenTpIsVeryClose;
        if (newSL > currentCandle.close) {
          log("Adjusted SL", newSL);
          openPosition.stopLoss = newSL;
        } else {
          log("Can't adjust the SL, is lower than current price", newSL, currentCandle);
        }
      }
    }
  }

  if (trailingTP) {
    if (openPosition.position === "long") {
      if (
        trailingTP.slDistanceShortForTighterTP !== 0 && 
        currentCandle.timestamp > openPosition.createdAt! &&
        currentCandle.low - openPosition.stopLoss! < trailingTP.slDistanceShortForTighterTP!
      ) {
        log(
          "Adjusting TP ...",
          openPosition,
          currentCandle,
          trailingTP.slDistanceShortForTighterTP
        );
        const newTP = openPosition.price - trailingTP.tpDistanceWhenSlIsVeryClose;
        if (newTP > currentCandle.close) {
          log("Adjusted TP", newTP);
          openPosition.takeProfit = newTP;
        } else {
          log("Can't adjust the TP, is lower than current price", newTP, currentCandle);
        }
      }
    }

    if (openPosition.position === "short") {
      if (
        trailingTP.slDistanceShortForTighterTP !== 0 && 
        currentCandle.timestamp > openPosition.createdAt! &&
        openPosition.stopLoss! - currentCandle.high < trailingTP.slDistanceShortForTighterTP!
      ) {
        log(
          "Adjusting TP ...",
          openPosition,
          currentCandle,
          trailingTP.slDistanceShortForTighterTP
        );
        const newTP = openPosition.price + trailingTP.tpDistanceWhenSlIsVeryClose;
        if (newTP < currentCandle.close) {
          log("Adjusted TP", newTP);
          openPosition.takeProfit = newTP;
        } else {
          log("Can't adjust the TP, is higher than current price", newTP, currentCandle);
        }
      }
    }
  }

}