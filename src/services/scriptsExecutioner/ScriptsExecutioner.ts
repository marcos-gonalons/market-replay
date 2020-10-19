import { toast } from "react-toastify";
import { Candle } from "../../context/globalContext/Types";
import { Script } from "../../context/scriptsContext/Types";
import { addOrder, removeAllOrders, setBalance, setOrders, setTrades } from "../../context/tradesContext/Actions";
import { Order, TradesContext, State as TradesContextState, Trade } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";
import { ScriptFuncParameters } from "./Types";

class ScriptsExecutionerService {
  private PainterService: PainterService;

  private tradesContext: TradesContext;
  private scripts: Script[] = [];
  private persistedVars: { [key: string]: unknown } = {};

  private orders: Order[] = [];
  private trades: Trade[] = [];
  private balance: number = 0;

  public constructor(painterService: PainterService, tradesContext: TradesContext) {
    this.PainterService = painterService;
    this.tradesContext = tradesContext;
  }

  public updateTradesContextState(state: TradesContextState): ScriptsExecutionerService {
    this.tradesContext.state = state;
    this.balance = this.tradesContext.state.balance;
    return this;
  }

  public setScripts(scripts: Script[]): ScriptsExecutionerService {
    this.scripts = scripts;
    return this;
  }

  public executeAllScriptsOnReplayTick(): ScriptsExecutionerService {
    for (const script of this.scripts) {
      if (!script.isActive) continue;
      this.executeScriptCode(script, this.PainterService.getData(), this.tradesContext.state.balance, true);
    }
    return this;
  }

  public executeWithFullData(script: Script): ScriptsExecutionerService {
    const data = this.PainterService.getData();

    for (let i = 0; i < data.length; i++) {
      const limitOrders = this.orders.filter((o) => o.type === "limit");
      const marketOrders = this.orders.filter((o) => o.type === "market");
      const currentCandle = data[i];

      for (const order of limitOrders) {
        if (order.price >= currentCandle.low && order.price <= currentCandle.high) {
          order.createdAt = currentCandle.timestamp;
          order.fillDate = currentCandle.timestamp;
          order.type = "market";
        }
      }

      const indicesOfMarketOrdersToRemove: number[] = [];
      for (const [index, order] of marketOrders.entries()) {
        if (!order.stopLoss && !order.takeProfit) continue;
        let trade: Trade;

        if (order.stopLoss && order.stopLoss >= currentCandle.low && order.stopLoss <= currentCandle.high) {
          trade = {
            startDate: order.createdAt!,
            endDate: data[data.length - 1].timestamp,
            startPrice: order.price,
            endPrice: order.stopLoss,
            size: order.size,
            position: order.position,
          };
          this.trades.push(trade);
          indicesOfMarketOrdersToRemove.push(index);

          let tradeResult = (trade.endPrice - trade.startPrice) * trade.size;
          if (trade.position === "short") tradeResult = -tradeResult;
          this.balance = this.balance + tradeResult;
          continue;
        }

        if (order.takeProfit && order.takeProfit >= currentCandle.low && order.takeProfit <= currentCandle.high) {
          trade = {
            startDate: order.createdAt!,
            endDate: data[data.length - 1].timestamp,
            startPrice: order.price,
            endPrice: order.takeProfit,
            size: order.size,
            position: order.position,
          };
          this.trades.push(trade);
          indicesOfMarketOrdersToRemove.push(index);

          let tradeResult = (trade.endPrice - trade.startPrice) * trade.size;
          if (trade.position === "short") tradeResult = -tradeResult;
          this.balance = this.balance + tradeResult;
          continue;
        }
      }

      for (const i of indicesOfMarketOrdersToRemove) {
        this.orders.splice(i, 1);
      }

      this.executeScriptCode(script, data.slice(0, i), this.balance, false);
    }

    this.tradesContext.dispatch(setTrades(this.trades));
    this.tradesContext.dispatch(setBalance(this.balance));
    this.tradesContext.dispatch(setOrders(this.orders));

    return this;
  }

  private getCreateOrderFunc(replayMode: boolean): ScriptFuncParameters["createOrder"] {
    let createOrderFunc: ScriptFuncParameters["createOrder"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        createOrderFunc = (order: Order): void => tradesContext.dispatch(addOrder(order));
      })(this.tradesContext);
    } else {
      (function (service: ScriptsExecutionerService): void {
        createOrderFunc = (order: Order): void => {
          service.orders.push(order);
        };
      })(this);
    }

    return createOrderFunc;
  }

  private getRemoveAllOrdersFunc(replayMode: boolean): ScriptFuncParameters["removeAllOrders"] {
    let removeAllOrdersFunc: ScriptFuncParameters["removeAllOrders"];

    if (replayMode) {
      (function (tradesContext: TradesContext): void {
        removeAllOrdersFunc = (): void => tradesContext.dispatch(removeAllOrders());
      })(this.tradesContext);
    } else {
      (function (service: ScriptsExecutionerService): void {
        removeAllOrdersFunc = (): void => {
          service.orders = [];
        };
      })(this);
    }

    return removeAllOrdersFunc;
  }

  private executeScriptCode(
    script: Script,
    candles: Candle[],
    balance: number,
    replayMode: boolean
  ): ScriptsExecutionerService {
    (function ({
      canvas,
      ctx,
      candles,
      drawings,
      orders,
      persistedVars,
      balance,
      createOrder,
      removeAllOrders,
    }: ScriptFuncParameters) {
      // This void thingies is to avoid complains from eslint/typescript
      void canvas;
      void ctx;
      void candles;
      void drawings;
      void orders;
      void persistedVars;
      void balance;
      void createOrder;
      void removeAllOrders;

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
      canvas: this.PainterService.getCanvas(),
      ctx: this.PainterService.getContext(),
      candles,
      drawings: this.PainterService.getExternalDrawings(),
      orders: this.tradesContext.state.orders,
      persistedVars: this.persistedVars,
      balance,
      createOrder: this.getCreateOrderFunc(replayMode),
      removeAllOrders: this.getRemoveAllOrdersFunc(replayMode),
    });
    return this;
  }
}

export default ScriptsExecutionerService;
