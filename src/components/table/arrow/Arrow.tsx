import * as React from "react";
import styles from "./Arrow.module.css";

export interface Props {
  direction: "up" | "down" | "left" | "right";
}

const Arrow = ({ direction = "up" }: Props): JSX.Element => {
  const className = `${styles["small-arrow"]} ${styles[direction]}`;
  return <i className={className}></i>;
};
export default Arrow;
