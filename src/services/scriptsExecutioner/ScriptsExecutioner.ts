import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

import { Candle } from "../../context/globalContext/Types";
import { Script } from "../../context/scriptsContext/Types";
import {
  addOrder,
  removeAllOrders,
  removeOrder,
  setBalance,
  setOrders,
  setTrades,
} from "../../context/tradesContext/Actions";
import { Order, TradesContext, State as TradesContextState, Trade } from "../../context/tradesContext/Types";
import { AppWorker } from "../../worker/Types";
import processOrders from "../ordersHandler/OrdersHandler";
import { DEFAULT_SPREAD } from "../painter/Constants";
import PainterService from "../painter/Painter";
import { Report, ScriptFuncParameters } from "./Types";

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
        data.length - 1
      );
    }
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

    for (let i = 0; i < data.length; i++) {
      balance = processOrders({
        orders,
        trades,
        currentCandle: data[i],
        balance,
      });

      this.executeScriptCode(script, data, balance, false, orders, i);

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
          reports: this.generateReports(trades),
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

  private getCreateOrderFunc(replayMode: boolean, orders?: Order[]): ScriptFuncParameters["createOrder"] {
    let createOrderFunc: ScriptFuncParameters["createOrder"];
    const orderId: string = uuidv4();

    function adjustPricesTakingSpreadIntoConsideration(order: Order): void {
      if (order.type !== "market") return;

      const adjustment = DEFAULT_SPREAD;
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

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        createOrderFunc = (order: Order): string => {
          order.id = orderId;
          adjustPricesTakingSpreadIntoConsideration(order);
          tradesContext.dispatch(addOrder(order));
          return orderId;
        };
      })(this.tradesContext!);
    } else {
      createOrderFunc = (order: Order): string => {
        order.id = orderId;
        adjustPricesTakingSpreadIntoConsideration(order);
        orders!.push(order);
        return orderId;
      };
    }

    return createOrderFunc;
  }

  private getRemoveAllOrdersFunc(replayMode: boolean, orders?: Order[]): ScriptFuncParameters["removeAllOrders"] {
    let removeAllOrdersFunc: ScriptFuncParameters["removeAllOrders"];

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

  private getRemoveOrderFunc(replayMode: boolean, orders?: Order[]): ScriptFuncParameters["removeOrder"] {
    let removeOrderFunc: ScriptFuncParameters["removeOrder"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        removeOrderFunc = (id: string): void => tradesContext.dispatch(removeOrder(id));
      })(this.tradesContext!);
    } else {
      removeOrderFunc = (id: string): void => {
        orders!.splice(
          orders!.findIndex((o) => id === o.id),
          1
        );
      };
    }

    return removeOrderFunc;
  }

  private executeScriptCode(
    script: Script,
    candles: Candle[],
    balance: number,
    replayMode: boolean,
    orders: Order[],
    currentDataIndex: number
  ): ScriptsExecutionerService {
    (function ({
      canvas,
      ctx,
      candles,
      drawings,
      orders,
      persistedVars,
      balance,
      currentDataIndex,
      createOrder,
      removeAllOrders,
      removeOrder,
    }: ScriptFuncParameters) {
      // This void thingies is to avoid complains from eslint/typescript
      void canvas;
      void ctx;
      void candles;
      void drawings;
      void orders;
      void persistedVars;
      void balance;
      void currentDataIndex;
      void createOrder;
      void removeAllOrders;
      void removeOrder;

      // TODO: Function to close an order
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
      persistedVars: this.persistedVars,
      balance,
      currentDataIndex,
      createOrder: this.getCreateOrderFunc(replayMode, orders),
      removeAllOrders: this.getRemoveAllOrdersFunc(replayMode, orders),
      removeOrder: this.getRemoveOrderFunc(replayMode, orders),
    });
    return this;
  }

  private generateReports(trades: Trade[]): Report[] {
    const hourlyReport: Report = {};
    const weekdayReport: Report = {};
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const trade of trades) {
      const date = new Date(trade.startDate);
      const hour = date.getHours().toString();
      const weekday = weekdays[date.getDay()];

      if (!hourlyReport[hour]) {
        hourlyReport[hour] = {
          total: 0,
          positives: 0,
          negatives: 0,
          successPercentage: 0,
        };
      }
      if (!weekdayReport[weekday]) {
        weekdayReport[weekday] = {
          total: 0,
          positives: 0,
          negatives: 0,
          successPercentage: 0,
        };
      }

      hourlyReport[hour].total++;
      if (trade.result >= 0) {
        hourlyReport[hour].positives++;
      } else {
        hourlyReport[hour].negatives++;
      }

      weekdayReport[weekday].total++;
      if (trade.result >= 0) {
        weekdayReport[weekday].positives++;
      } else {
        weekdayReport[weekday].negatives++;
      }
    }

    for (const hour in hourlyReport) {
      hourlyReport[hour].successPercentage = (hourlyReport[hour].positives / hourlyReport[hour].total) * 100;
    }

    for (const weekday in weekdayReport) {
      weekdayReport[weekday].successPercentage =
        (weekdayReport[weekday].positives / weekdayReport[weekday].total) * 100;
    }

    return [hourlyReport, weekdayReport];
  }
}

export default ScriptsExecutionerService;
