import { ScriptFuncParameters, ScriptParams } from "../../../services/scriptsExecutioner/Types";
import { OrderType, Position } from "../../tradesContext/Types";

interface OrderMetadata {
  strategy: string;
}

export default (function f({
  candles,
  orders,
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog,
}: ScriptFuncParameters) {
  const ENABLE_DEBUG = false;

  void persistedVars;
  void isWithinTime;
  void balance;
  void trades;

  function supportBounce() {
    const priceAdjustment = 1 / 10000;

    function getParams(params: ScriptParams | null): ScriptParams {
      if (params) {
        return params;
      }

      const riskPercentage = 5;
      const stopLossDistance = 90 * priceAdjustment;
      const takeProfitDistance = 130 * priceAdjustment;
      const tpDistanceShortForTighterSL = 50 * priceAdjustment;
      const slDistanceWhenTpIsVeryClose = -60 * priceAdjustment;
      const trendCandles = 100;
      const trendDiff = 10 * priceAdjustment;
      const candlesAmountWithLowerPriceToBeConsideredHorizontalLevel = 30;
      const priceOffset = -20 * priceAdjustment;
      const maxSecondsOpenTrade = 20 * 24 * 60 * 60;

      const validHours: ScriptParams["validHours"] = [];
      const validMonths: ScriptParams["validMonths"] = [];
      const validDays: ScriptParams["validDays"] = [];

      return {
        validHours,
        validDays,
        validMonths,
        riskPercentage,
        stopLossDistance,
        takeProfitDistance,
        tpDistanceShortForTighterSL,
        slDistanceWhenTpIsVeryClose,
        trendCandles,
        trendDiff,
        candlesAmountWithLowerPriceToBeConsideredHorizontalLevel,
        priceOffset,
        maxSecondsOpenTrade,
      };
    }

    const scriptParams = getParams(params || null);

    if (candles.length <= 1 || currentDataIndex === 0) return;

    const date = new Date(candles[currentDataIndex].timestamp);
    const marketOrder = orders.find(
      (o) => o.type === "market" && (o.metadata! as OrderMetadata).strategy === "supportBounce"
    );

    if (marketOrder && scriptParams.maxSecondsOpenTrade) {
      const diffInSeconds = Math.floor((date.valueOf() - marketOrder.createdAt!.valueOf()) / 1000);

      if (diffInSeconds >= scriptParams.maxSecondsOpenTrade) {
        debugLog(ENABLE_DEBUG, "Closing the trade since it has been open for too much time", date, marketOrder);
        closeOrder(marketOrder.id!);
      }
    }

    if (marketOrder) {
      const newSLPrice = marketOrder.price + scriptParams.slDistanceWhenTpIsVeryClose;
      if (
        candles[currentDataIndex].timestamp > marketOrder.createdAt! &&
        marketOrder.takeProfit! - candles[currentDataIndex].high < scriptParams.tpDistanceShortForTighterSL &&
        candles[currentDataIndex].close > newSLPrice
      ) {
        debugLog(
          ENABLE_DEBUG,
          "Adjusting SL ...",
          date,
          marketOrder,
          candles[currentDataIndex],
          scriptParams.tpDistanceShortForTighterSL
        );
        marketOrder.stopLoss = newSLPrice;
      }
    }

    const horizontalLevelCandleIndex =
      currentDataIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
    if (
      horizontalLevelCandleIndex < 0 ||
      currentDataIndex < scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel * 2
    ) {
      return;
    }

    let isFalsePositive = false;
    for (let j = horizontalLevelCandleIndex + 1; j < currentDataIndex; j++) {
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "future_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    isFalsePositive = false;
    for (
      let j = horizontalLevelCandleIndex - scriptParams.candlesAmountWithLowerPriceToBeConsideredHorizontalLevel;
      j < horizontalLevelCandleIndex;
      j++
    ) {
      if (!candles[j]) continue;
      if (candles[j].low <= candles[horizontalLevelCandleIndex].low) {
        isFalsePositive = true;
        debugLog(ENABLE_DEBUG, "past_overcame", date);
        break;
      }
    }

    if (isFalsePositive) return;

    const price = candles[horizontalLevelCandleIndex].low + scriptParams.priceOffset;
    if (price < candles[currentDataIndex].close - spread / 2) {
      let lowestValue = candles[currentDataIndex].low;

      for (let i = currentDataIndex; i > currentDataIndex - scriptParams.trendCandles; i--) {
        if (!candles[i]) break;

        if (candles[i].low < lowestValue) {
          lowestValue = candles[i].low;
        }
      }

      const diff = candles[currentDataIndex].low - lowestValue;
      if (diff < scriptParams.trendDiff) {
        debugLog(ENABLE_DEBUG, "Diff is too big, won't create the order...", date, diff, scriptParams.trendDiff);
        return;
      }

      orders.filter((o) => o.type !== "market").map((nmo) => closeOrder(nmo.id!));

      const stopLoss = price - scriptParams.stopLossDistance;
      const takeProfit = price + scriptParams.takeProfitDistance;

      const size =
        Math.floor((balance * (scriptParams.riskPercentage / 100)) / (scriptParams.stopLossDistance * 10000 * 0.93)) *
          10000 || 10000;

      const rollover = (0.7 * size) / 10000;
      const o = {
        type: "buy-limit" as OrderType,
        position: "long" as Position,
        size,
        price,
        stopLoss,
        takeProfit,
        rollover,
        metadata: { strategy: "supportBounce" },
      };
      debugLog(ENABLE_DEBUG, "Order to be created", date, o);

      if (orders.find((o) => o.type === "market")) {
        debugLog(ENABLE_DEBUG, "There is an open position, not creating the order ...", date, marketOrder);
        return;
      }

      debugLog(ENABLE_DEBUG, "Time is right, creating the order", date);
      createOrder(o);
    } else {
      debugLog(
        ENABLE_DEBUG,
        "Can't create the order since the price is smaller than the current candle.close + the spread adjustment",
        date
      );
      debugLog(ENABLE_DEBUG, "Candle, adjustment, price", candles[currentDataIndex], spread / 2, price);
    }
  }

  supportBounce();

  // end script
}
  .toString()
  .replace(
    `
function f({
  candles,
  orders,
  trades,
  balance,
  currentDataIndex,
  spread,
  createOrder,
  closeOrder,
  persistedVars,
  isWithinTime,
  params,
  debugLog
}) {
`.trim(),
    ``
  )
  .replace(
    `// end script
}`.trim(),
    ``
  ));
