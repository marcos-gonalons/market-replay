import { toast } from "react-toastify";
import { Candle } from "../../context/globalContext/Types";
import { Script } from "../../context/scriptsContext/Types";
import { setBalance } from "../../context/tradesContext/Actions";
import { Order, Trade } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";

class ReplayerService {
  private PainterService: PainterService;

  private replayTimer: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private replayTimerTickMilliseconds: number = 1;
  private dataBackup: Candle[] = [];
  private scripts: Script[] = [];
  private persistedVars: { [key: string]: unknown } = {};
  private accountBalance: number = 0;

  public constructor(painterService: PainterService) {
    this.PainterService = painterService;
  }

  public setScripts(scripts: Script[]): ReplayerService {
    this.scripts = scripts;
    return this;
  }

  public setAccountBalance(balance: number): ReplayerService {
    this.accountBalance = balance;
    return this;
  }

  public startReplay(): ReplayerService {
    if (this.replayTimer !== null) return this;

    this.PainterService.setTrades([]);

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
    this.PainterService.setTrades([], true);
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
    const trades = [...this.PainterService.getTrades()];

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
          trades.push(trade);
          indicesOfMarketOrdersToRemove.push(index);
          this.adjustAccountBalance(trade);
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
          trades.push(trade);
          indicesOfMarketOrdersToRemove.push(index);
          this.adjustAccountBalance(trade);
          continue;
        }
      }

      for (const i of indicesOfMarketOrdersToRemove) {
        orders.splice(i, 1);
      }

      this.PainterService.setTrades(trades, true);
      this.PainterService.setOrders(orders, true);
    } else {
      this.stopReplay();
      return;
    }

    this.executeScripts();
  }

  private executeScripts(): ReplayerService {
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

  private adjustAccountBalance(trade: Trade): ReplayerService {
    const dispatch = this.PainterService.getTradesContextDispatch();

    let tradeResult = (trade.endPrice - trade.startPrice) * trade.size;
    if (trade.position === "short") tradeResult = -tradeResult;

    dispatch(setBalance(this.accountBalance + tradeResult));
    return this;
  }
}

interface ScriptFuncParameters {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  candles: Candle[];
  currentCandle: Candle;
  drawings: (() => void)[];
  orders: Order[];
  persistedVars: { [key: string]: unknown };
  painterService: PainterService;
  balance: number;
  createOrder: (order: Order) => number;
}

export default ReplayerService;
