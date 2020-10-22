import React, { useContext, useRef, useState, useEffect } from "react";
import Draggable from "react-draggable";
import { toast } from "react-toastify";
import { setIsTradingPanelVisible } from "../../context/globalContext/Actions";

import { GlobalContext } from "../../context/globalContext/GlobalContext";
import { addOrder } from "../../context/tradesContext/Actions";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import { Order, OrderType, Position } from "../../context/tradesContext/Types";
import PainterService from "../../services/painter/Painter";

import styles from "./TradingPanel.module.css";

function TradingPanel(): JSX.Element {
  const {
    state: { isTradingPanelVisible, painterService },
    dispatch: globalContextDispath,
  } = useContext(GlobalContext);
  const {
    state: { orders, trades },
    dispatch: tradesContextDispatch,
  } = useContext(TradesContext);
  const [size, setSize] = useState<number>(0);
  const [orderType, setOrderType] = useState<"market" | "stop-or-limit">("market");
  const [stopOrLimitOrderPrice, setStopOrLimitOrderPrice] = useState<number>(0);
  const [hasTakeProfit, setHasTakeProfit] = useState<boolean>(false);
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);

  useEffect(() => {
    if (!painterService) return;

    painterService.draw();
  }, [painterService, orders, trades]);

  // This weird ref is necessary for the Draggable component otherwise the console throws a warning.
  const ref = useRef(null);

  if (!isTradingPanelVisible) {
    return <></>;
  }

  // TODO: use decimal number component
  return (
    <>
      <Draggable nodeRef={ref} defaultClassName={styles["panel-container"]} axis="both" handle={`.${styles["handle"]}`}>
        <div ref={ref}>
          <div className={styles["handle"]}>+</div>
          <div
            onClick={() => {
              globalContextDispath(setIsTradingPanelVisible(false));
            }}
          >
            X
          </div>
          <section>
            <div>
              <label>Size </label>
              <input
                type="text"
                value={size}
                onChange={(e) => {
                  setSize(parseInt(e.target.value));
                }}
              />
            </div>
            <div>
              <label>Type</label>
              <span
                className={orderType === "market" ? styles["selected"] : ""}
                onClick={() => {
                  setOrderType("market");
                }}
              >
                Market
              </span>
              <span
                className={orderType === "stop-or-limit" ? styles["selected"] : ""}
                onClick={() => {
                  setOrderType("stop-or-limit");
                }}
              >
                Limit / Stop
              </span>
            </div>
            {orderType === "stop-or-limit" ? (
              <div>
                <label>Price</label>
                <input
                  type="text"
                  value={stopOrLimitOrderPrice}
                  onChange={(e) => {
                    setStopOrLimitOrderPrice(parseInt(e.target.value));
                  }}
                />
              </div>
            ) : (
              ""
            )}
            <div>
              <span
                className={hasTakeProfit ? styles["selected"] : ""}
                onClick={() => {
                  setHasTakeProfit(!hasTakeProfit);
                }}
              >
                Take profit
              </span>
              {hasTakeProfit ? (
                <>
                  <label>Price</label>
                  <input
                    type="text"
                    value={takeProfitPrice}
                    onChange={(e) => {
                      setTakeProfitPrice(parseInt(e.target.value));
                    }}
                  />
                </>
              ) : (
                ""
              )}
            </div>
            <div>
              <span
                className={hasStopLoss ? styles["selected"] : ""}
                onClick={() => {
                  setHasStopLoss(!hasStopLoss);
                }}
              >
                Stop loss
              </span>
              {hasStopLoss ? (
                <>
                  <label>Price</label>
                  <input
                    type="text"
                    value={stopLossPrice}
                    onChange={(e) => {
                      setStopLossPrice(parseInt(e.target.value));
                    }}
                  />
                </>
              ) : (
                ""
              )}
            </div>
            <button
              onClick={() => {
                const order = getOrder({
                  type:
                    orderType === "stop-or-limit"
                      ? getStopOrLimitOrderType("long", stopOrLimitOrderPrice, painterService!.getLastCandle().close!)
                      : "market",
                  position: "long",
                  size,
                  painterService: painterService!,
                  hasStopLoss,
                  hasTakeProfit,
                  stopOrLimitPrice: stopOrLimitOrderPrice,
                  stopLossPrice: stopLossPrice,
                  takeProfitPrice: takeProfitPrice,
                  createdAt: painterService!.getLastCandle().timestamp,
                });
                try {
                  validateOrder(order);
                } catch (err: unknown) {
                  toast.error((err as Error).message);
                  return;
                }
                tradesContextDispatch(addOrder(order));
              }}
            >
              Buy
            </button>
            <button
              onClick={() => {
                const order = getOrder({
                  type:
                    orderType === "stop-or-limit"
                      ? getStopOrLimitOrderType("long", stopOrLimitOrderPrice, painterService!.getLastCandle().close!)
                      : "market",
                  position: "short",
                  size,
                  painterService: painterService!,
                  hasStopLoss,
                  hasTakeProfit,
                  stopOrLimitPrice: stopOrLimitOrderPrice,
                  stopLossPrice: stopLossPrice,
                  takeProfitPrice: takeProfitPrice,
                  createdAt: painterService!.getLastCandle().timestamp,
                });
                try {
                  validateOrder(order);
                } catch (err: unknown) {
                  toast.error((err as Error).message);
                  return;
                }
                tradesContextDispatch(addOrder(order));
              }}
            >
              Sell
            </button>
          </section>
        </div>
      </Draggable>
    </>
  );
}

interface GetOrderParams {
  type: OrderType;
  position: Position;
  size: number;
  painterService: PainterService;
  createdAt: number;
  hasStopLoss: boolean;
  hasTakeProfit: boolean;
  stopOrLimitPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}
function getOrder({
  type,
  position,
  size,
  painterService,
  hasStopLoss,
  hasTakeProfit,
  stopOrLimitPrice,
  stopLossPrice,
  takeProfitPrice,
  createdAt,
}: GetOrderParams): Order {
  const order: Order = { type, position, size, price: 0, createdAt };
  if (type !== "market") {
    order.price = stopOrLimitPrice as number;
  } else {
    order.fillDate = painterService.getLastCandle().timestamp;
    order.price = painterService.getLastCandle().close;
  }
  if (hasStopLoss) {
    order.stopLoss = stopLossPrice;
  }
  if (hasTakeProfit) {
    order.takeProfit = takeProfitPrice;
  }
  return order;
}

function validateOrder(order: Order): void {
  if (!order.size || order.size < 0) {
    throw new Error("Invalid size");
  }

  if (order.stopLoss) {
    if (
      (order.position === "long" && order.stopLoss >= order.price) ||
      (order.position === "short" && order.stopLoss <= order.price)
    ) {
      throw new Error("Invalid stop loss");
    }
  }

  if (order.takeProfit) {
    if (
      (order.position === "long" && order.takeProfit <= order.price) ||
      (order.position === "short" && order.takeProfit >= order.price)
    ) {
      throw new Error("Invalid take profit");
    }
  }
}

function getStopOrLimitOrderType(position: Order["position"], orderPrice: number, currentPrice: number): Order["type"] {
  if (position === "long") {
    if (orderPrice < currentPrice) {
      return "buy-limit";
    } else {
      return "buy-stop";
    }
  } else {
    if (orderPrice < currentPrice) {
      return "sell-stop";
    } else {
      return "sell-limit";
    }
  }
}

export default TradingPanel;
