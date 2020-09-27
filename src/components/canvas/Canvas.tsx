import React, { useEffect } from "react";
import styles from "./Canvas.module.css";

const canvasContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

function Canvas(): JSX.Element {
  useEffect(() => {
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
  });

  return (
    <div ref={canvasContainerRef} id={styles["canvas-container"]}>
      <canvas id={styles["canvas"]} ref={canvasRef}></canvas>
    </div>
  );
}

function setCanvasSize(): void {
  const canvasContainer: HTMLDivElement = canvasContainerRef.current!;
  const canvas: HTMLCanvasElement = canvasRef.current!;

  canvas.height = canvasContainer.clientHeight;
  canvas.width = canvasContainer.clientWidth;
}

export default Canvas;
