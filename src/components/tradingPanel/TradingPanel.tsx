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
    state: { orders },
    dispatch: tradesContextDispatch,
  } = useContext(TradesContext);
  const [size, setSize] = useState<number>(0);
  const [orderType, setOrderType] = useState<Order["type"]>("market");
  const [limitOrderPrice, setLimitOrderPrice] = useState<number>(0);
  const [hasTakeProfit, setHasTakeProfit] = useState<boolean>(false);
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(0);

  useEffect(() => {
    console.log("setting orders");
    painterService.setOrders(orders);
    painterService.draw();
  }, [painterService, orders]);

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
                className={orderType === "limit" ? styles["selected"] : ""}
                onClick={() => {
                  setOrderType("limit");
                }}
              >
                Limit
              </span>
            </div>
            {orderType === "limit" ? (
              <div>
                <label>Price</label>
                <input
                  type="text"
                  value={limitOrderPrice}
                  onChange={(e) => {
                    setLimitOrderPrice(parseInt(e.target.value));
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
                  type: orderType,
                  position: "long",
                  size,
                  painterService,
                  hasStopLoss,
                  hasTakeProfit,
                  limitPrice: limitOrderPrice,
                  stopLossPrice: stopLossPrice,
                  takeProfitPrice: takeProfitPrice,
                  createdAt: painterService.getLastCandle().timestamp,
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
                  type: orderType,
                  position: "short",
                  size,
                  painterService,
                  hasStopLoss,
                  hasTakeProfit,
                  limitPrice: limitOrderPrice,
                  stopLossPrice: stopLossPrice,
                  takeProfitPrice: takeProfitPrice,
                  createdAt: painterService.getLastCandle().timestamp,
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
  limitPrice?: number;
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
  limitPrice,
  stopLossPrice,
  takeProfitPrice,
  createdAt,
}: GetOrderParams): Order {
  const order: Order = { type, position, size, price: 0, createdAt };
  if (type === "limit") {
    order.price = limitPrice as number;
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

export default TradingPanel;
