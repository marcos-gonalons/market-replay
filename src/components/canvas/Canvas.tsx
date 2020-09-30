import React, { useEffect, useState, useContext } from "react";
import { DataContext } from "../../context/dataContext/DataContext";
import PainterService from "../../services/painter/Painter";
import FileSelector from "../fileSelector/FileSelector";
import styles from "./Canvas.module.css";

const canvasContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

interface ContainerDimensions {
  width: number;
  height: number;
}

function Canvas(): JSX.Element {
  const { state } = useContext(DataContext);

  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });
  const [painterService, setPainterService] = useState<PainterService | null>(null);

  useEffect(() => {
    const painterService = new PainterService();
    painterService.setCanvas(canvasRef.current!);
    setPainterService(painterService);

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
    if (!painterService) return;

    painterService.setData(state.data ?? []);
    painterService.updateCandlesAmountInScreen();
    painterService.updateCandleWidth();
    painterService.updatePriceRangeInScreen();
    painterService.draw();
  }, [state.data, containerDimensions, painterService]);

  return (
    <>
      <div ref={canvasContainerRef} id={styles["canvas-container"]}>
        <canvas id={styles["canvas"]} ref={canvasRef}></canvas>
      </div>
      <FileSelector />
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
