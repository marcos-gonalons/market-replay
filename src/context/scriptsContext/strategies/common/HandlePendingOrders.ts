import { Candle } from "../../../globalContext/Types";
import { Order } from "../../../tradesContext/Types";

interface Params {
  readonly position: string;
  readonly isValidTime: boolean;
  readonly pendingOrder: Order | null;
  readonly orders: Order[];
  readonly candles: Candle[];
  readonly openPosition: Order | undefined;
  readonly currentDataIndex: number;

  readonly setPendingOrder: (o: Order | null) => void;
  readonly closeOrder: (orderId: string) => void;
  readonly createOrder: (order: Order) => void;
  readonly log: (...msg: any[]) => void;
}

export function handlePendingOrder({
  position,
  isValidTime,
  pendingOrder,
  orders,
  candles,
  openPosition,
  currentDataIndex,

  setPendingOrder,
  closeOrder,
  createOrder,
  log
}: Params): void {
  log("Current pending order", pendingOrder);
  if (!isValidTime) {
    log("Not valid time");
    const order = orders.find((o) => o.type !== "market" && o.position === position);
    if (order) {
      log("There is an active order, saving pending order...", order);
      setPendingOrder({ ...order });
      closeOrder(order.id!);
      return;
    } else {
      log("There isn't any active order");
    }
  } else {
    log("Time is right");
    if (pendingOrder) {
      const order = pendingOrder as Order;
      log("There is a pending order", order);
      if (order.position === position) {
        if (isValidPrice(order, candles[currentDataIndex])) {
          log("Creating pending order", order);
          if (!openPosition) {
            createOrder(order);
          } else {
            log("Can't create the pending order because there is an open position", openPosition);
          }
        } else {
          log(
            "Can't create the pending order since the price is smaller than the candle.high",
            order.price,
            candles[currentDataIndex],
          );
        }
        setPendingOrder(null);
        return;
      } else {
        log("Pending order is another side, will not be created");
      }
    } else {
      log("There is not any pending order");
    }
    setPendingOrder(null);
    log("Set pending order to null");
  }
}


function isValidPrice(order: Order, currentCandle: Candle): boolean {
  if (order.type === "buy-limit" || order.type === "sell-stop") {
    return order.price < currentCandle.close;
  }
  if (order.type === "sell-limit" || order.type === "buy-stop") {
    return order.price > currentCandle.close;
  }

  return false;
}