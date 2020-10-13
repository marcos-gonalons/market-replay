import { Dispatch } from "react";
import { toast } from "react-toastify";
import { Candle } from "../../../context/globalContext/Types";
import { Script } from "../../../context/scriptsContext/Types";
import { addOrder } from "../../../context/tradesContext/Actions";
import { Order, Trade } from "../../../context/tradesContext/Types";
import { ReducerAction } from "../../../context/Types";
import { DEFAULT_REPLAY_TIMER_TICK_IN_MS } from "../Constants";
import PainterService from "../Painter";

class ReplayerService {
  private PainterService: PainterService;

  private replayTimer: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private replayTimerTickMilliseconds: number = DEFAULT_REPLAY_TIMER_TICK_IN_MS;
  private trades: Trade[] = [];
  private dataBackup: Candle[] = [];
  private scripts: Script[] = [];

  public constructor(painterService: PainterService) {
    this.PainterService = painterService;
  }

  public setScripts(scripts: Script[]): ReplayerService {
    this.scripts = scripts;
    return this;
  }

  public getTrades(): Trade[] {
    return this.trades;
  }

  public startReplay(): ReplayerService {
    if (this.replayTimer !== null) return this;
    this.trades = [];

    const painterData = this.PainterService.getData();

    this.dataBackup = [...painterData];

    this.PainterService.setData(
      painterData.slice(
        0,
        painterData.length -
          this.PainterService.getDataArrayOffset() -
          Math.round(this.PainterService.getMaxCandlesAmountInScreen() / 5)
      )
    );

    this.PainterService.setDataArrayOffset(-Math.round(this.PainterService.getMaxCandlesAmountInScreen() / 5));

    this.PainterService.draw();

    this.isPaused = false;
    this.replayTimer = setInterval(() => {
      if (this.isPaused) return;
      this.onReplayTimerTick();
    }, this.replayTimerTickMilliseconds);

    return this;
  }

  public togglePause(): ReplayerService {
    this.isPaused = !this.isPaused;
    return this;
  }

  public stopReplay(): ReplayerService {
    clearInterval(this.replayTimer!);

    this.replayTimer = null;
    this.isPaused = false;

    this.PainterService.setOrders([], true);
    this.PainterService.setData([...this.dataBackup]);
    this.PainterService.draw();
    return this;
  }

  public goBack(): ReplayerService {
    if (!this.isPaused) return this;

    const data = [...this.PainterService.getData()];
    data.splice(data.length - 1, 1);

    this.PainterService.setData(data);

    const orders = [...this.PainterService.getOrders()];

    const indicesOfOrdersToRemove: number[] = [];
    for (const [index, order] of orders.entries()) {
      if (order.createdAt! > data[data.length - 1].timestamp) {
        indicesOfOrdersToRemove.push(index);
      }
    }
    for (const i of indicesOfOrdersToRemove) {
      orders.splice(i, 1);
    }

    this.PainterService.setOrders(orders, true);
    this.PainterService.draw();
    return this;
  }

  public goForward(): ReplayerService {
    if (!this.isPaused) return this;

    this.onReplayTimerTick();
    return this;
  }

  public isReplayActive(): boolean {
    return this.replayTimer !== null;
  }

  public isReplayPaused(): boolean {
    return this.isPaused;
  }

  private onReplayTimerTick(): void {
    const data = this.PainterService.getData();
    const orders = [...this.PainterService.getOrders()];

    if (this.dataBackup.length > data.length) {
      data.push(this.dataBackup[data.length]);

      const limitOrders = orders.filter((o) => o.type === "limit");
      const marketOrders = orders.filter((o) => o.type === "market");
      const currentCandle = this.PainterService.getLastCandle();

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

        if (order.stopLoss && order.stopLoss >= currentCandle.low && order.stopLoss <= currentCandle.high) {
          this.trades.push({
            startDate: order.createdAt!,
            endDate: data[data.length - 1].timestamp,
            startPrice: order.price,
            endPrice: order.stopLoss,
            size: order.size,
            position: order.position,
          });
          indicesOfMarketOrdersToRemove.push(index);
          continue;
        }

        if (order.takeProfit && order.takeProfit >= currentCandle.low && order.takeProfit <= currentCandle.high) {
          this.trades.push({
            startDate: order.createdAt!,
            endDate: data[data.length - 1].timestamp,
            startPrice: order.price,
            endPrice: order.takeProfit,
            size: order.size,
            position: order.position,
          });
          indicesOfMarketOrdersToRemove.push(index);
          continue;
        }
      }

      for (const i of indicesOfMarketOrdersToRemove) {
        orders.splice(i, 1);
      }
      this.PainterService.setOrders(orders, true);
    } else {
      this.stopReplay();
      return;
    }

    this.executeScripts();
    this.PainterService.draw();
  }

  private executeScripts(): ReplayerService {
    for (const script of this.scripts) {
      if (!script.isActive) continue;

      (function ({ candles, currentCandle, createOrder }: ScriptFuncParameters) {
        // This void thingies is to avoid complains from eslint/typescript
        void candles;
        void currentCandle;
        void createOrder;

        // TODO: Function to close an order
        // TODO: Function to modify an order

        try {
          // eslint-disable-next-line
          eval(script.contents);
        } catch (err) {
          toast.error("There is an error in your scripts; Check console for more details.");
          console.error(err);
        }
      })({
        candles: this.PainterService.getData(),
        currentCandle: this.PainterService.getLastCandle(),
        createOrder: this.getCreateOrderFuncForScripts(),
      });
    }
    return this;
  }

  private getCreateOrderFuncForScripts(): (order: Order) => number {
    let createOrderFunc: (order: Order) => number;

    (function (dispatch: Dispatch<ReducerAction>, ordersLength: number, currentCandle: Candle): void {
      createOrderFunc = (order: Order): number => {
        dispatch(
          addOrder({
            ...order,
            createdAt: currentCandle.timestamp,
          })
        );
        return ordersLength;
      };
    })(
      this.PainterService.getTradesContextDispatch(),
      this.PainterService.getOrders().length,
      this.PainterService.getLastCandle()
    );

    return createOrderFunc;
  }
}

interface ScriptFuncParameters {
  candles: Candle[];
  currentCandle: Candle;
  createOrder: (order: Order) => number;
}

export default ReplayerService;
