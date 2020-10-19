import { toast } from "react-toastify";
import { Script } from "../../context/scriptsContext/Types";
import { Order } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";
import { ScriptFuncParameters } from "./Types";

class ScriptsExecutionerService {
  private scripts: Script[] = [];
  private persistedVars: { [key: string]: unknown } = {};

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
        painterService,
        balance,
        createOrder,
      }: ScriptFuncParameters) {
        // This void thingies is to avoid complains from eslint/typescript
        void canvas;
        void ctx;
        void candles;
        void currentCandle;
        void drawings;
        void orders;
        void persistedVars;
        void painterService;
        void balance;
        void createOrder;

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
        createOrder: this.getCreateOrderFuncForScripts(),
        orders: this.PainterService.getOrders(),
        persistedVars: this.persistedVars,
        painterService: this.PainterService,
        balance: this.accountBalance,
      });
    }
    return this;
  }

  private getCreateOrderFuncForScripts(): (order: Order) => number {
    let createOrderFunc: (order: Order) => number;

    (function (painterService: PainterService): void {
      createOrderFunc = (order: Order): number => {
        const orders = [...painterService.getOrders()];
        orders.push({
          ...order,
          createdAt: painterService.getLastCandle().timestamp,
        });
        painterService.setOrders(orders, true);
        return orders.length;
      };
    })(this.PainterService);

    return createOrderFunc;
  }
}

export default ScriptsExecutionerService;
