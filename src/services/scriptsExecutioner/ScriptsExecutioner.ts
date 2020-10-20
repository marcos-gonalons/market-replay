import { toast } from "react-toastify";
import { Candle } from "../../context/globalContext/Types";
import { Script } from "../../context/scriptsContext/Types";
import { addOrder, removeAllOrders, setBalance, setOrders, setTrades } from "../../context/tradesContext/Actions";
import { Order, TradesContext, State as TradesContextState, Trade } from "../../context/tradesContext/Types";
import processOrders from "../ordersHandler/OrdersHandler";
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
      this.balance = processOrders({
        orders: this.orders,
        trades: this.trades,
        currentCandle: data[i],
        balance: this.balance,
      });

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
