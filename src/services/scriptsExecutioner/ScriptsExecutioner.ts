import { toast } from "react-toastify";
import { Script } from "../../context/scriptsContext/Types";
import { addOrder, removeAllOrders } from "../../context/tradesContext/Actions";
import { Order, TradesContext, State as TradesContextState } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";
import { ScriptFuncParameters } from "./Types";

class ScriptsExecutionerService {
  private PainterService: PainterService;

  private tradesContext: TradesContext;
  private scripts: Script[] = [];
  private persistedVars: { [key: string]: unknown } = {};

  public constructor(painterService: PainterService, tradesContext: TradesContext) {
    this.PainterService = painterService;
    this.tradesContext = tradesContext;
  }

  public updateTradesContextState(state: TradesContextState): ScriptsExecutionerService {
    this.tradesContext.state = state;
    return this;
  }

  public setScripts(scripts: Script[]): ScriptsExecutionerService {
    this.scripts = scripts;
    return this;
  }

  public execute(): ScriptsExecutionerService {
    for (const script of this.scripts) {
      if (!script.isActive) continue;

      (function ({
        canvas,
        ctx,
        candles,
        currentCandle,
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
        void currentCandle;
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
        candles: this.PainterService.getData(),
        currentCandle: this.PainterService.getLastCandle(),
        drawings: this.PainterService.getExternalDrawings(),
        orders: this.tradesContext.state.orders,
        persistedVars: this.persistedVars,
        balance: this.tradesContext.state.balance,
        createOrder: this.getCreateOrderFunc(),
        removeAllOrders: this.getRemoveAllOrdersFunc(),
      });
    }
    return this;
  }

  private getCreateOrderFunc(): ScriptFuncParameters["createOrder"] {
    let createOrderFunc: ScriptFuncParameters["createOrder"];

    (function (tradesContext: TradesContext): void {
      createOrderFunc = (order: Order): void => tradesContext.dispatch(addOrder(order));
    })(this.tradesContext);

    return createOrderFunc;
  }

  private getRemoveAllOrdersFunc(): ScriptFuncParameters["removeAllOrders"] {
    let removeAllOrdersFunc: ScriptFuncParameters["removeAllOrders"];

    (function (tradesContext: TradesContext): void {
      removeAllOrdersFunc = (): void => tradesContext.dispatch(removeAllOrders());
    })(this.tradesContext);

    return removeAllOrdersFunc;
  }
}

export default ScriptsExecutionerService;
