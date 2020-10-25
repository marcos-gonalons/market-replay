import { Candle } from "../../context/globalContext/Types";
import { removeAllOrders, removeAllTrades, setOrders, setTrades } from "../../context/tradesContext/Actions";
import { TradesContext, State as TradesContextState } from "../../context/tradesContext/Types";
import processOrders from "../ordersHandler/OrdersHandler";
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

      processOrders({
        orders,
        trades,
        currentCandle: this.PainterService.getLastCandle(),
        previousCandle: data.length - 2 >= 0 ? data[data.length - 2] : null,
      });

      this.tradesContext.dispatch(setTrades(trades));
      this.tradesContext.dispatch(setOrders(orders));
    } else {
      this.stopReplay();
      return;
    }

    this.ScriptsExecutionerService.executeAllScriptsOnReplayTick();
    this.PainterService.draw();
  }
}

export default ReplayerService;
