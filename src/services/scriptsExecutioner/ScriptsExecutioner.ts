import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Candle } from "../../context/globalContext/Types";
import { Strategy as ResistanceBreakoutStrategy } from "../../context/scriptsContext/strategies/ResistanceBreakout";
import { Strategy as SupportBreakoutStrategy } from "../../context/scriptsContext/strategies/SupportBreakout";
import { Strategy as ResistanceBounceStrategy } from "../../context/scriptsContext/strategies/ResistanceBounce";
import { Strategy as SupportBounceStrategy } from "../../context/scriptsContext/strategies/SupportBounce";
import { Strategy as EmaCrossoverLongsStrategy } from "../../context/scriptsContext/strategies/EmaCrossover/Long";
import { Strategy as EmaCrossoverShortsStrategy } from "../../context/scriptsContext/strategies/EmaCrossover/Short";
import { Strategy as RangesShortsStrategy } from "../../context/scriptsContext/strategies/Ranges/Short";
import { Strategy as RangesLongsStrategy } from "../../context/scriptsContext/strategies/Ranges/Long";
import { Strategy as Test } from "../../context/scriptsContext/strategies/Test";
import { Script } from "../../context/scriptsContext/Types";
import {
  addOrder,
  addTrade,
  removeAllOrders,
  removeOrder,
  setBalance,
  setOrders,
  setTrades,
} from "../../context/tradesContext/Actions";
import { Order, State as TradesContextState, Trade, TradesContext } from "../../context/tradesContext/Types";
import { addCommissions, adjustTradeResultWithRollover, debugLog, getMinutesAsHalfAnHour } from "../../utils/Utils";
import { AppWorker } from "../../worker/Types";
import processOrders from "../ordersHandler/OrdersHandler";
import { EUR_EXCHANGE_RATE, GOOD_SUCCESS_RATE, SPREAD, PRICE_DECIMALS } from "../painter/Constants";
import PainterService from "../painter/Painter";
import { generateReports } from "../reporter/Reporter";
import { Strategy, StrategyFuncParameters, StrategyParams } from "./Types";
import getCombinations from "./ParamCombinations";

class ScriptsExecutionerService {
  private PainterService?: PainterService;
  private tradesContext?: TradesContext;

  private scripts: Script[] = [];
  private persistedVars: { [key: string]: unknown } = {};

  public setPainterService(painterService: PainterService): ScriptsExecutionerService {
    this.PainterService = painterService;
    return this;
  }

  public setTradesContext(tradesContext: TradesContext): ScriptsExecutionerService {
    this.tradesContext = tradesContext;
    return this;
  }

  public updateTradesContextState(state: TradesContextState): ScriptsExecutionerService {
    this.tradesContext!.state = state;
    return this;
  }

  public setScripts(scripts: Script[]): ScriptsExecutionerService {
    this.scripts = scripts;
    return this;
  }

  public executeAllScriptsOnReplayTick(): ScriptsExecutionerService {
    const data = this.PainterService!.getData();
    for (const script of this.scripts) {
      if (!script.isActive) continue;
      this.executeScriptCode(
        script,
        data,
        this.tradesContext!.state.balance,
        true,
        this.tradesContext!.state.orders,
        this.tradesContext!.state.trades,
        data.length - 1
      );
    }
    return this;
  }

  public executeCombinationsWithFullData(
    script: Script,
    data: Candle[],
    initialBalance: number,
    worker?: AppWorker
  ): ScriptsExecutionerService {
    let balance = initialBalance;
    let best: StrategyParams | null = null;
    let bestWithGoodSuccessRate: StrategyParams | null = null;

    const { combinations, length: combinationsLength } = getCombinations();

    let j = 0;
    for (const minStopLossDistance of combinations.minStopLossDistance) {
    for (const maxStopLossDistance of combinations.maxStopLossDistance) {
    for (const takeProfitDistance of combinations.takeProfitDistance) {
    for (const stopLossDistance of combinations.stopLossDistance) {
    for (const minProfit of combinations.minProfit) {
    for (const futureCandles of combinations.candlesAmountToBeConsideredHorizontalLevel.future) {
    for (const pastCandles of combinations.candlesAmountToBeConsideredHorizontalLevel.past) {
    for (const maxAttemptsToGetSL of combinations.maxAttemptsToGetSL) {
    for (const candlesAmountWithoutEMAsCrossing of combinations.candlesAmountWithoutEMAsCrossing) {
    for (const tpDistanceShortForTighterSL of combinations.trailingSL.tpDistanceShortForTighterSL) {
    for (const slDistanceWhenTpIsVeryClose of combinations.trailingSL.slDistanceWhenTpIsVeryClose) {
    for (const slDistanceShortForTighterTP of combinations.trailingTP.slDistanceShortForTighterTP) {
    for (const tpDistanceWhenSlIsVeryClose of combinations.trailingTP.tpDistanceWhenSlIsVeryClose) {
    for (const maxSecondsOpenTrade of combinations.maxSecondsOpenTrade) {
    for (const candlesToCheck of combinations.ranges.candlesToCheck) {
    for (const maxPriceDifferenceForSameHorizontalLevel of combinations.ranges.maxPriceDifferenceForSameHorizontalLevel) {
    for (const minPriceDifferenceBetweenRangePoints of combinations.ranges.minPriceDifferenceBetweenRangePoints) {
    for (const minCandlesBetweenRangePoints of combinations.ranges.minCandlesBetweenRangePoints) {
    for (const maxCandlesBetweenRangePoints of combinations.ranges.maxCandlesBetweenRangePoints) {
    for (const rangesPriceOffset of combinations.ranges.priceOffset) {
    for (const rangePoints of combinations.ranges.rangePoints) {
    for (const startWith of combinations.ranges.startWith) {
    for (const takeProfitStrategy of combinations.ranges.takeProfitStrategy) {
    for (const stopLossStrategy of combinations.ranges.stopLossStrategy) {
    for (const orderType of combinations.ranges.orderType) {
    for (const trendyOnly of combinations.ranges.trendyOnly) {
      const orders: Order[] = [];
      const trades: Trade[] = [];

      const params = {
        riskPercentage: 1,
        maxAttemptsToGetSL,
        stopLossDistance,
        candlesAmountToBeConsideredHorizontalLevel: {
          future: futureCandles,
          past: pastCandles
        },
        minStopLossDistance,
        maxStopLossDistance,
        takeProfitDistance,
        minProfit,
        trailingSL: {
          tpDistanceShortForTighterSL,
          slDistanceWhenTpIsVeryClose,
        },
        trailingTP: {
          slDistanceShortForTighterTP,
          tpDistanceWhenSlIsVeryClose
        },
        candlesAmountWithoutEMAsCrossing,
        maxSecondsOpenTrade,
        ranges: {
          candlesToCheck,
          maxPriceDifferenceForSameHorizontalLevel,
          minPriceDifferenceBetweenRangePoints,
          minCandlesBetweenRangePoints,
          maxCandlesBetweenRangePoints,
          priceOffset: rangesPriceOffset,
          rangePoints,
          startWith,
          takeProfitStrategy,
          stopLossStrategy,
          orderType,
          trendyOnly,
        }
      }

      if (best === null && bestWithGoodSuccessRate === null) {
        best = params;
        bestWithGoodSuccessRate = {...params};
        best.profits = -9999999;
        bestWithGoodSuccessRate.profits = -9999999;
      }

      let lastTradesLength = 0;
      for (let i = 0; i < data.length; i++) {
        processOrders({
          orders,
          trades,
          currentCandle: data[i],
          previousCandle: i - 1 >= 0 ? data[i - 1] : null,
          spread: SPREAD,
        });

        if (trades.length > lastTradesLength) {
          lastTradesLength = trades.length;
          balance += trades[trades.length - 1].result;
        }
        this.executeScriptCode(script, data, balance, false, orders, trades, i, params);
      }

      // Report every N finished combinations.
      // Looks like calling postMessage too often causes the browser to crash.
      if (worker && !(j % 1)) {
        worker.postMessage({
          type: "scripts-executioner",
          payload: {
            balance,
            progress: parseFloat(((j * 100) / combinationsLength).toFixed(5)),
            trades,
          },
        });
      }

      const reports = generateReports(trades, initialBalance);
      let profits = 0;
      let totalTrades = 0;
      let positives = 0;
      for (const k in reports[0]) {
        profits += reports[0][k].profits;
        totalTrades += reports[0][k].total;
        positives += reports[0][k].positives;
      }

      let successRate = (positives/totalTrades)*100;

      /***
      console.log("Params: ", params);
      console.log("Profits: " + profits);
      console.log("Total trades: " + totalTrades);
      console.log(reports);
      console.log("-".repeat(200));
      console.log("-".repeat(200));
      /***/

      if (profits > best!.profits!) {
        best = {...params};
        best!.profits = profits;
        best!.totalTrades = totalTrades;

        console.log("new best", best);

        if (worker) {
          worker.postMessage({
            type: "scripts-executioner",
            payload: {
              balance,
              progress: parseFloat(((j * 100) / combinationsLength).toFixed(5)),
              trades,
              best: best!,
            },
          });
        }
      }

      if (successRate >= GOOD_SUCCESS_RATE && profits > bestWithGoodSuccessRate!.profits!) {
        bestWithGoodSuccessRate = {...params};
        bestWithGoodSuccessRate!.profits = profits;
        bestWithGoodSuccessRate!.totalTrades = totalTrades;

        console.log("new best with good successRate", bestWithGoodSuccessRate);

        if (worker) {
          worker.postMessage({
            type: "scripts-executioner",
            payload: {
              balance,
              progress: parseFloat(((j * 100) / combinationsLength).toFixed(5)),
              trades,
              best: best!,
            },
          });
        }
      }
      
      j++;
  }}}}}}}}}}}}}}}}}}}}}}}}}}

  alert('DONE')
    console.log("Best", best);
    console.log("Best", JSON.stringify(best));

    console.log("Best with good success rate", bestWithGoodSuccessRate);
    console.log("Best with good success rate", JSON.stringify(bestWithGoodSuccessRate));

    return this;
  }

  public executeWithFullData(
    script: Script,
    data: Candle[],
    initialBalance: number,
    worker?: AppWorker
  ): ScriptsExecutionerService {
    const orders: Order[] = [];
    const trades: Trade[] = [];
    let balance = initialBalance;
    let lastTradesLength = trades.length;

    for (let i = 0; i < data.length; i++) {
      processOrders({
        orders,
        trades,
        currentCandle: data[i],
        previousCandle: i - 1 >= 0 ? data[i - 1] : null,
        spread: SPREAD,
      });

      if (trades.length > lastTradesLength) {
        lastTradesLength = trades.length;
        balance += trades[trades.length - 1].result;
      }

      this.executeScriptCode(script, data, balance, false, orders, trades, i);

      if (worker && i % Math.round(data.length / 100) === 0) {
        worker.postMessage({
          type: "scripts-executioner",
          payload: {
            balance,
            progress: (i * 100) / data.length,
            trades,
          },
        });
      }
    }

    if (worker) {
      worker.postMessage({
        type: "scripts-executioner",
        payload: {
          balance,
          progress: 100,
          trades,
          reports: generateReports(trades, initialBalance),
          candles: data
        },
      });
    }

    if (this.tradesContext) {
      this.tradesContext.dispatch(setTrades(trades));
      this.tradesContext.dispatch(setBalance(balance));
      this.tradesContext.dispatch(setOrders(orders));
    }

    return this;
  }

  private getCreateOrderFunc(replayMode: boolean, orders?: Order[]): StrategyFuncParameters["createOrder"] {
    let createOrderFunc: StrategyFuncParameters["createOrder"];
    const orderId: string = uuidv4();

    function adjustPricesTakingSpreadIntoConsideration(order: Order): void {
      const adjustment = SPREAD/2;
      if (order.position === "short") {
        order.price -= adjustment;
      } else {
        order.price += adjustment;
      }
    }

    (function (tradesContext: TradesContext, replayMode: boolean): void {
      createOrderFunc = (order: Order): string => {
        order.id = orderId;
        if (order.type === "market") {
          adjustPricesTakingSpreadIntoConsideration(order);
        }

        const p = Math.pow(10, PRICE_DECIMALS);
        order.price = Math.round(order.price * p) / p;
        if (order.takeProfit) {
          order.takeProfit = Math.round(order.takeProfit * p) / p;
        }
        if (order.stopLoss) {
          order.stopLoss = Math.round(order.stopLoss * p) / p;
        }

        if (replayMode) {
          tradesContext.dispatch(addOrder(order));
        } else {
          orders!.push(order);
        }
        return orderId;
      };
    })(this.tradesContext!, replayMode);

    return createOrderFunc;
  }

  private getRemoveAllOrdersFunc(replayMode: boolean, orders?: Order[]): StrategyFuncParameters["removeAllOrders"] {
    let removeAllOrdersFunc: StrategyFuncParameters["removeAllOrders"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        removeAllOrdersFunc = (): void => tradesContext.dispatch(removeAllOrders());
      })(this.tradesContext!);
    } else {
      removeAllOrdersFunc = (): void => {
        orders!.splice(0, orders!.length);
      };
    }

    return removeAllOrdersFunc;
  }

  private getCloseOrderFunc(
    replayMode: boolean,
    orders?: Order[],
    trades?: Trade[],
    currentCandle?: Candle
  ): StrategyFuncParameters["closeOrder"] {
    let closeOrderFunc: StrategyFuncParameters["closeOrder"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        closeOrderFunc = (id: string, openOrClose: 'open'|'close' = 'close'): void => {
          const order = tradesContext.state.orders.find((o) => o.id === id);
          if (!order) return;

          if (order.type === "market") {
            let endPrice = currentCandle![openOrClose];
            const spreadAdjustment = (order.position === "short" ? SPREAD : -SPREAD) / 2;
            endPrice += spreadAdjustment;

            let result = (endPrice - order.price) * order.size;
            if (order.position === "short") result = -result;
            const trade = {
              startDate: order.createdAt!,
              endDate: currentCandle!.timestamp,
              startPrice: order.price,
              endPrice,
              size: order.size,
              position: order.position,
              result,
            };
            adjustTradeResultWithRollover(trade, order.rollover || 0);
            addCommissions(trade);
            trade.result *= EUR_EXCHANGE_RATE;
            tradesContext.dispatch(addTrade(trade));
          }

          tradesContext.dispatch(removeOrder(id));
        };
      })(this.tradesContext!);
    } else {
      closeOrderFunc = (id: string, openOrClose: 'open'|'close' = 'close'): void => {
        const order = orders!.find((o) => o.id === id);
        if (!order) return;

        let endPrice = currentCandle![openOrClose];
        const spreadAdjustment = (order.position === "short" ? SPREAD : -SPREAD) / 2;
        endPrice += spreadAdjustment;

        let result = (endPrice - order.price) * order.size;
        if (order.position === "short") result = -result;

        if (order.type === "market") {
          const trade = {
            startDate: order.createdAt!,
            endDate: currentCandle!.timestamp,
            startPrice: order.price,
            endPrice,
            size: order.size,
            position: order.position,
            result,
          }
          trades!.push(trade);
          adjustTradeResultWithRollover(trade, order.rollover || 0);
          addCommissions(trade);
          trade.result = trade.result * EUR_EXCHANGE_RATE
        }

        orders!.splice(
          orders!.findIndex((o) => id === o.id),
          1
        );
      };
    }

    return closeOrderFunc;
  }

  private getIsWithinTimeFunc(): StrategyFuncParameters["isWithinTime"] {
    return (
      executeHours: {
        hour: string;
        weekdays?: number[];
      }[],
      executeDays: {
        weekday: number;
        hours: string[];
      }[],
      executeMonths: number[],
      date: Date
    ): boolean => {
      if (executeMonths && executeMonths.length > 0) {
        if (!executeMonths.includes(date.getMonth())) return false;
      }

      if (executeHours && executeHours.length > 0) {
        const executableHours = executeHours.map((t) => t.hour);
        if (!executableHours) return true;

        const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
        if (!executableHours.includes(hour)) return false;

        const executableWeekdays = executeHours.find((t) => t.hour === hour)!.weekdays;
        if (!executableWeekdays || executableWeekdays.length === 0) return true;

        if (!executableWeekdays.includes(date.getDay())) return false;
        return true;
      }

      if (executeDays && executeDays.length > 0) {
        const executableDays = executeDays.map((d) => d.weekday);
        if (!executableDays) return true;

        const weekday = date.getDay();
        if (!executableDays.includes(weekday)) return false;

        const executableHours = executeDays.find((d) => d.weekday === weekday)!.hours;
        if (!executableHours || executableHours.length === 0) return true;

        const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
        if (!executableHours.includes(hour)) return false;

        return true;
      }

      return true;
    };
  }

  private executeScriptCode(
    script: Script,
    candles: Candle[],
    balance: number,
    replayMode: boolean,
    orders: Order[],
    trades: Trade[],
    currentDataIndex: number,
    params?: StrategyParams
  ): ScriptsExecutionerService {
    (function ({
      canvas,
      ctx,
      candles,
      drawings,
      orders,
      trades,
      persistedVars,
      balance,
      currentDataIndex,
      spread,
      createOrder,
      removeAllOrders,
      closeOrder,
      isWithinTime,
      params,
      debugLog,
      strategies,
    }: StrategyFuncParameters) {
      // This void thingies is to avoid complains from eslint/typescript
      void canvas;
      void ctx;
      void candles;
      void drawings;
      void orders;
      void persistedVars;
      void balance;
      void currentDataIndex;
      void spread;
      void createOrder;
      void removeAllOrders;
      void closeOrder;
      void isWithinTime;
      void params;
      void trades;
      void debugLog;
      void strategies;

      // TODO: Function to modify an order

      try {
        // eslint-disable-next-line
        eval(`(function (){${script.contents}}());`);
      } catch (err) {
        toast.error("There is an error in your scripts; Check console for more details.");
        console.error(err);
      }
    })({
      canvas: this.PainterService?.getCanvas(),
      ctx: this.PainterService?.getContext(),
      candles,
      drawings: this.PainterService?.getExternalDrawings(),
      orders,
      trades,
      persistedVars: this.persistedVars,
      balance,
      currentDataIndex,
      spread: SPREAD,
      params,
      createOrder: this.getCreateOrderFunc(replayMode, orders),
      removeAllOrders: this.getRemoveAllOrdersFunc(replayMode, orders),
      closeOrder: this.getCloseOrderFunc(replayMode, orders, trades, candles[currentDataIndex]),
      isWithinTime: this.getIsWithinTimeFunc(),
      debugLog,
      strategies: this.getStrategies()
    });
    return this;
  }

  private getStrategies(): Strategy[] {
    return [{
      name: "Resistance Breakout",
      func: ResistanceBreakoutStrategy
    },{
      name: "Support Breakout",
      func: SupportBreakoutStrategy
    },{
      name: "Resistance Bounce",
      func: ResistanceBounceStrategy
    },{
      name: "Support Bounce",
      func: SupportBounceStrategy
    },{
      name: "EMA Crossover Longs",
      func: EmaCrossoverLongsStrategy
    },{
      name: "EMA Crossover Shorts",
      func: EmaCrossoverShortsStrategy
    },{
      name: "Ranges Shorts",
      func: RangesShortsStrategy
    },{
      name: "Ranges Longs",
      func: RangesLongsStrategy
    },{
      name: "Test",
      func: Test,
    }];
  }

}

export default ScriptsExecutionerService;
