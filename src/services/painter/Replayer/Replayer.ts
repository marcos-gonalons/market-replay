import { Candle } from "../../../context/globalContext/Types";
import { Trade } from "../../../context/tradesContext/Types";
import { DEFAULT_REPLAY_TIMER_TICK_IN_MS } from "../Constants";
import PainterService from "../Painter";

class ReplayerService {
  private PainterService: PainterService;

  private replayTimer: NodeJS.Timeout | null = null;
  private isReplayPaused: boolean = false;
  private replayTimerTickMilliseconds: number = DEFAULT_REPLAY_TIMER_TICK_IN_MS;
  private trades: Trade[] = [];
  private dataBackup: Candle[] = [];

  public constructor(painterService: PainterService) {
    this.PainterService = painterService;
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

    this.isReplayPaused = false;
    this.replayTimer = setInterval(() => {
      if (this.isReplayPaused) return;
      this.onReplayTimerTick();
    }, this.replayTimerTickMilliseconds);

    return this;
  }

  public togglePause(): ReplayerService {
    this.isReplayPaused = !this.isReplayPaused;
    return this;
  }

  public stopReplay(): ReplayerService {
    clearInterval(this.replayTimer!);

    this.replayTimer = null;
    this.isReplayPaused = false;

    this.PainterService.setOrders([]);
    this.PainterService.setData([...this.dataBackup]);
    this.PainterService.draw();
    return this;
  }

  public goBack(): ReplayerService {
    if (!this.isReplayPaused) return this;

    const data = [...this.PainterService.getData()];
    data.splice(data.length - 1, 1);

    this.PainterService.setData(data);

    const orders = [...this.PainterService.getOrders()];

    const indicesOfOrdersToRemove: number[] = [];
    for (const [index, order] of orders.entries()) {
      if (order.createdAt > data[data.length - 1].timestamp) {
        indicesOfOrdersToRemove.push(index);
      }
    }
    for (const i of indicesOfOrdersToRemove) {
      orders.splice(i, 1);
    }

    this.PainterService.setOrders(orders);
    this.PainterService.draw();
    return this;
  }

  public goForward(): ReplayerService {
    if (!this.isReplayPaused) return this;

    this.onReplayTimerTick();
    return this;
  }

  public isReplayActive(): boolean {
    return this.replayTimer !== null;
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
            startDate: order.createdAt,
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
            startDate: order.createdAt,
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
      this.PainterService.setOrders(orders);
    } else {
      this.stopReplay();
      return;
    }

    this.PainterService.draw();
  }
}

export default ReplayerService;
