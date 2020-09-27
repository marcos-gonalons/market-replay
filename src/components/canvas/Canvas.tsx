import React, { useEffect, useState } from "react";
import { draw } from "../../services/painter/Painter";
import { ChartData } from "../../types/ChartData";
import FileSelector from "../fileSelector/FileSelector";
import styles from "./Canvas.module.css";

const canvasContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

interface ContainerDimensions {
  width: number;
  height: number;
}

function Canvas(): JSX.Element {
  const [data, setData] = useState<ChartData[]>([]);
  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const width = canvasContainerRef.current!.clientWidth;
    const height = canvasContainerRef.current!.clientHeight;
    setContainerDimensions({ width, height });

    window.addEventListener("resize", () => onResize(setContainerDimensions));
  }, []);

  useEffect(() => {
    canvasRef.current!.height = containerDimensions.height;
    canvasRef.current!.width = containerDimensions.width;
  }, [containerDimensions]);

  useEffect(() => {
    draw(data, canvasRef.current!, canvasRef.current!.getContext("2d", { alpha: false }) as CanvasRenderingContext2D);
  }, [data, containerDimensions]);

  return (
    <>
      <div ref={canvasContainerRef} id={styles["canvas-container"]}>
        <canvas id={styles["canvas"]} ref={canvasRef}></canvas>
      </div>
      <FileSelector setDataCallback={setData} />
    </>
  );
}

function onResize(setContainerDimensions: (d: ContainerDimensions) => void): void {
  setContainerDimensions({
    width: canvasContainerRef.current!.clientWidth,
    height: canvasContainerRef.current!.clientHeight,
  });
}

export default Canvas;
