import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Candle } from "../../context/globalContext/Types";
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
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
import { AppWorker } from "../../worker/Types";
import processOrders from "../ordersHandler/OrdersHandler";
import { DEFAULT_SPREAD, SPREAD_ADJUSTMENT } from "../painter/Constants";
import PainterService from "../painter/Painter";
import { generateReports } from "../reporter/Reporter";
import { ScriptFuncParameters, ScriptParams } from "./Types";

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
    const elements = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    /*const elements = [
      "8:00",
      "8:30",
      "9:00",
      "9:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
    ];*/
    //const elements = [1, 2, 3, 4, 5];
    for (const [j, element] of elements.entries()) {
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
          spread: DEFAULT_SPREAD,
        });

        if (trades.length > lastTradesLength) {
          lastTradesLength = trades.length;
          balance += trades[trades.length - 1].result;
        }
        this.executeScriptCode(script, data, balance, false, orders, trades, i, {
          // validHours: [{ hour: element, weekdays: [] }],
          // validDays: [{ weekday: element, hours: [] }],
          validMonths: [element],
        });

        if (worker && i % Math.round(data.length / 100) === 0) {
          worker.postMessage({
            type: "scripts-executioner",
            payload: {
              balance,
              progress: (i / data.length) * ((j + 1) / elements.length) * 100,
              trades,
            },
          });
        }
      }
      console.log(generateReports(trades));
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
    let lastTradesLength = trades.length;

    for (let i = 0; i < data.length; i++) {
      processOrders({
        orders,
        trades,
        currentCandle: data[i],
        previousCandle: i - 1 >= 0 ? data[i - 1] : null,
        spread: DEFAULT_SPREAD,
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
          reports: generateReports(trades),
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

  private getCloseOrderFunc(
    replayMode: boolean,
    orders?: Order[],
    trades?: Trade[],
    currentCandle?: Candle
  ): ScriptFuncParameters["closeOrder"] {
    let closeOrderFunc: ScriptFuncParameters["closeOrder"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        closeOrderFunc = (id: string): void => {
          const order = tradesContext.state.orders.find((o) => o.id === id);
          if (!order) return;

          if (order.type === "market") {
            let result = (currentCandle!.close - order.price) * order.size;
            if (order.position === "short") result = -result;
            tradesContext.dispatch(
              addTrade({
                startDate: order.createdAt!,
                endDate: currentCandle!.timestamp,
                startPrice: order.price,
                endPrice: currentCandle!.close,
                size: order.size,
                position: order.position,
                result,
              })
            );
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
          trades!.push({
            startDate: order.createdAt!,
            endDate: currentCandle!.timestamp,
            startPrice: order.price,
            endPrice: currentCandle!.close,
            size: order.size,
            position: order.position,
            result,
          });
        }

        orders!.splice(
          orders!.findIndex((o) => id === o.id),
          1
        );
      };
    }

    return closeOrderFunc;
  }

  private getIsWitinTimeFunc(): ScriptFuncParameters["isWithinTime"] {
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
    params?: ScriptParams
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
      spreadAdjustment,
      createOrder,
      removeAllOrders,
      closeOrder,
      isWithinTime,
      params,
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
      void spreadAdjustment;
      void createOrder;
      void removeAllOrders;
      void closeOrder;
      void isWithinTime;
      void params;

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
      spreadAdjustment: DEFAULT_SPREAD / SPREAD_ADJUSTMENT,
      params,
      createOrder: this.getCreateOrderFunc(replayMode, orders),
      removeAllOrders: this.getRemoveAllOrdersFunc(replayMode, orders),
      closeOrder: this.getCloseOrderFunc(replayMode, orders, trades, candles[currentDataIndex]),
      isWithinTime: this.getIsWitinTimeFunc(),
    });
    return this;
  }
}

export default ScriptsExecutionerService;
