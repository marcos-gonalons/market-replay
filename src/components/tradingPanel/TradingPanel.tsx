import React, { useContext, useRef, useState } from "react";
import Draggable from "react-draggable";
import { setIsTradingPanelVisible } from "../../context/globalContext/Actions";

import { GlobalContext } from "../../context/globalContext/GlobalContext";
import { addOrder } from "../../context/tradesContext/Actions";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import { Order } from "../../context/tradesContext/Types";

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

  console.log(orders);

  // This weird ref is necessary for the Draggable component otherwise the console throws a warning.
  const ref = useRef(null);

  if (!isTradingPanelVisible) {
    return <></>;
  }
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
                const order: Order = {
                  type: orderType,
                  position: "long",
                  size,
                };
                if (orderType === "limit") {
                  order.limitPrice = limitOrderPrice;
                } else {
                  order.fillDate = painterService.getLastCandle().date;
                }
                if (hasStopLoss) {
                  order.stopLoss = stopLossPrice;
                }
                if (hasTakeProfit) {
                  order.takeProfit = takeProfitPrice;
                }
                tradesContextDispatch(addOrder(order));
              }}
            >
              Buy
            </button>
            <button>Sell</button>
          </section>
        </div>
      </Draggable>
    </>
  );
}

export default TradingPanel;
