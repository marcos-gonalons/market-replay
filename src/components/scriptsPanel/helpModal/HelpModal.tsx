import Modal from "react-modal";
import React from "react";

export interface Props {
  readonly isVisible: boolean;
  readonly onClose: () => void;
}

export default function HelpModal({ isVisible, onClose }: Props): JSX.Element {
  return (
    <Modal
      ariaHideApp={false}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={isVisible}
      onRequestClose={onClose}
      style={{
        content: {},
      }}
    >
      /** * Variables that are accessible * ----------------------------- * - candles * Array containing all the candles
      * Every item of the array is an object with this properties: * timestamp, open, high, low, close, volume * * -
      currentCandle * The candle where the replay is at * * * Functions that can be called *
      ---------------------------- * - createOrder * Allows to create market/limit orders. Returns the index of the
      order created. * * Example for a market order
      {`createOrder({
     *     type: "market",
     *     position: "long",
     *     size: 50,
     *     stopLoss: 12345
     *   })'`}
      * * * Example for a limit order *{" "}
      {`createOrder({
     *     type: "limit",
     *     position: "short",
     *     size: 100,
     *     price: 1234.56,
     *     stopLoss: 1244.77,
     *     takeProfit: 1200.02
     *   })`}
      * * */
    </Modal>
  );
}
