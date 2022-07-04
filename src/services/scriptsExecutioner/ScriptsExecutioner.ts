import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Candle } from "../../context/globalContext/Types";
import { Strategy as ResistanceBreakoutStrategy } from "../../context/scriptsContext/strategies/ResistanceBreakout";
import { Strategy as SupportBreakoutStrategy } from "../../context/scriptsContext/strategies/SupportBreakout";
import { Strategy as ResistanceBounceStrategy } from "../../context/scriptsContext/strategies/ResistanceBounce";
import { Strategy as SupportBounceStrategy } from "../../context/scriptsContext/strategies/SupportBounce";
import { Strategy as EmaCrossoverStrategy } from "../../context/scriptsContext/strategies/EmaCrossover";
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
import { EUR_EXCHANGE_RATE, SPREAD } from "../painter/Constants";
import PainterService from "../painter/Painter";
import { generateReports } from "../reporter/Reporter";
import getParamsArray from "./ParamsArray";
import { Strategy, StrategyFuncParameters, StrategyParams } from "./Types";

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

  public executeWithFullData2(
    script: Script,
    data: Candle[],
    initialBalance: number,
    worker?: AppWorker
  ): ScriptsExecutionerService {
    const paramsArray = getParamsArray();

    let best: StrategyParams = paramsArray[0];
    best.profits = -9999999;

    let j = 0;
    for (const params of paramsArray) {
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
        this.executeScriptCode(script, data, balance, false, orders, trades, i, params);

        if (worker && i % Math.round(data.length / 100) === 0) {
          worker.postMessage({
            type: "scripts-executioner",
            payload: {
              balance,
              progress: (j * 100) / (data.length * paramsArray.length),
              trades,
            },
          });
        }

        j++;
      }

      const reports = generateReports(trades, initialBalance);
      let profits = 0;
      let totalTrades = 0;
      for (const k in reports[0]) {
        profits += reports[0][k].profits;
        totalTrades += reports[0][k].total;
      }

      /***
      console.log("Params: ", params);
      console.log("Profits: " + profits);
      console.log("Total trades: " + totalTrades);
      console.log(reports);
      console.log("-".repeat(200));
      console.log("-".repeat(200));
      /***/

      if (profits > best.profits!) {
        best = params;
        best.profits = profits;
        best.totalTrades = totalTrades;

        console.log("new best", best);

        if (worker) {
          worker.postMessage({
            type: "scripts-executioner",
            payload: {
              balance,
              progress: (j * 100) / (data.length * paramsArray.length),
              trades,
              best,
            },
          });
        }
      }
    }

    console.log("Best", best);
    console.log("Best", JSON.stringify(best));
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
        order.stopLoss = order.stopLoss ? (order.stopLoss -= adjustment) : order.stopLoss;
        order.takeProfit = order.takeProfit ? (order.takeProfit -= adjustment) : order.takeProfit;
      } else {
        order.price += adjustment;
        order.stopLoss = order.stopLoss ? (order.stopLoss += adjustment) : order.stopLoss;
        order.takeProfit = order.takeProfit ? (order.takeProfit += adjustment) : order.takeProfit;
      }
    }

    (function (tradesContext: TradesContext, replayMode: boolean): void {
      createOrderFunc = (order: Order): string => {
        order.id = orderId;
        if (order.type === "market") {
          adjustPricesTakingSpreadIntoConsideration(order);
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
        closeOrderFunc = (id: string): void => {
          const order = tradesContext.state.orders.find((o) => o.id === id);
          if (!order) return;

          if (order.type === "market") {
            let result = (currentCandle!.close - order.price) * order.size;
            if (order.position === "short") result = -result;
            const trade = {
              startDate: order.createdAt!,
              endDate: currentCandle!.timestamp,
              startPrice: order.price,
              endPrice: currentCandle!.close,
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
      closeOrderFunc = (id: string): void => {
        const order = orders!.find((o) => o.id === id);
        if (!order) return;

        let result = (currentCandle!.close - order.price) * order.size;
        if (order.position === "short") result = -result;

        if (order.type === "market") {
          const trade = {
            startDate: order.createdAt!,
            endDate: currentCandle!.timestamp,
            startPrice: order.price,
            endPrice: currentCandle!.close,
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
      name: "EMA Crossover",
      func: EmaCrossoverStrategy
    }];
  }

}

export default ScriptsExecutionerService;
