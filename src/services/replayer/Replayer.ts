import { Candle } from "../../context/globalContext/Types";
import {
  removeAllOrders,
  removeAllTrades,
  setBalance,
  setOrders,
  setTrades,
} from "../../context/tradesContext/Actions";
import { Trade, TradesContext, State as TradesContextState } from "../../context/tradesContext/Types";
import PainterService from "../painter/Painter";
import ScriptsExecutionerService from "../scriptsExecutioner/ScriptsExecutioner";

class ReplayerService {
  private PainterService: PainterService;
  private ScriptsExecutionerService: ScriptsExecutionerService;

  private tradesContext: TradesContext;

  private replayTimer: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private replayTimerTickMilliseconds: number = 1;
  private dataBackup: Candle[] = [];
  private accountBalance: number = 0;

  public constructor(
    painterService: PainterService,
    scriptsExecutionerService: ScriptsExecutionerService,
    tradesContext: TradesContext
  ) {
    this.PainterService = painterService;
    this.ScriptsExecutionerService = scriptsExecutionerService;
    this.tradesContext = tradesContext;
  }

  public updateTradesContextState(state: TradesContextState): ReplayerService {
    this.tradesContext.state = state;
    return this;
  }

  public setAccountBalance(balance: number): ReplayerService {
    this.accountBalance = balance;
    return this;
  }

  public startReplay(): ReplayerService {
    if (this.replayTimer !== null) return this;

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

    this.tradesContext.dispatch(removeAllOrders());
    this.tradesContext.dispatch(removeAllTrades());
    this.PainterService.setData([...this.dataBackup]);
    this.PainterService.draw();
    return this;
  }

  public goBack(): ReplayerService {
    if (!this.isPaused) return this;

    const data = [...this.PainterService.getData()];
    data.splice(data.length - 1, 1);

    this.PainterService.setData(data);

    const orders = [...this.tradesContext.state.orders];

    const indicesOfOrdersToRemove: number[] = [];
    for (const [index, order] of orders.entries()) {
      if (order.createdAt! > data[data.length - 1].timestamp) {
        indicesOfOrdersToRemove.push(index);
      }
    }
    for (const i of indicesOfOrdersToRemove) {
      orders.splice(i, 1);
    }

    this.tradesContext.dispatch(setOrders(orders));
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
    const orders = [...this.tradesContext.state.orders];
    const trades = [...this.tradesContext.state.trades];

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

      this.tradesContext.dispatch(setTrades(trades));
      this.tradesContext.dispatch(setOrders(orders));
    } else {
      this.stopReplay();
      return;
    }

    this.ScriptsExecutionerService.execute();
    this.PainterService.draw();
  }

  private adjustAccountBalance(trade: Trade): ReplayerService {
    let tradeResult = (trade.endPrice - trade.startPrice) * trade.size;
    if (trade.position === "short") tradeResult = -tradeResult;

    this.tradesContext.dispatch(setBalance(this.accountBalance + tradeResult));
    return this;
  }
}

export default ReplayerService;
