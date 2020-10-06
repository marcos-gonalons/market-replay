import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "../../context/globalContext/GlobalContext";
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
  const {
    state: { painterService, data },
  } = useContext(GlobalContext);

  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });
  const [canvasClassName, setCanvasClassName] = useState<string>("");

  useEffect(() => {
    const width = canvasContainerRef.current!.clientWidth;
    const height = canvasContainerRef.current!.clientHeight;
    setContainerDimensions({ width, height });

    window.addEventListener("resize", () => onResizeWindow(setContainerDimensions));
  }, []);

  useEffect(() => {
    if (!painterService) return;
    painterService.setCanvas(canvasRef.current!);
  }, [painterService]);

  useEffect(() => {
    canvasRef.current!.height = containerDimensions.height;
    canvasRef.current!.width = containerDimensions.width;
  }, [containerDimensions]);

  useEffect(() => {
    if (!painterService) return;

    painterService.setData(data ?? []);
    painterService.draw();
  }, [data, containerDimensions, painterService]);

  useEffect(() => {
    if (!painterService || !data || data.length === 0) return;
    painterService.resetDataArrayOffset();
    painterService.draw();
  }, [data, painterService]);

  return (
    <>
      <div ref={canvasContainerRef} id={styles["canvas-container"]}>
        <canvas
          className={canvasClassName}
          onWheel={(e: React.WheelEvent<HTMLCanvasElement>) => {
            if (!painterService) return;
            onScrollCanvas(painterService, e);
          }}
          onMouseMove={(e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!canvasRef.current || !painterService) return;
            onMouseMoveCanvas(painterService, e, canvasRef.current.getBoundingClientRect());
          }}
          onMouseDown={() => {
            if (!painterService) return;
            painterService.setIsDragging(true);
            setCanvasClassName(styles["grabbing"]);
          }}
          onMouseUp={() => {
            if (!painterService) return;
            painterService.setIsDragging(false);
            setCanvasClassName("");
          }}
          onMouseOut={() => {
            if (!painterService) return;
            painterService.setIsDragging(false);
            setCanvasClassName("");
          }}
          id={styles["canvas"]}
          ref={canvasRef}
        ></canvas>
      </div>
      <FileSelector />
    </>
  );
}

function onResizeWindow(setContainerDimensions: (d: ContainerDimensions) => void): void {
  if (!canvasContainerRef.current) return;
  setContainerDimensions({
    width: canvasContainerRef.current.clientWidth,
    height: canvasContainerRef.current.clientHeight,
  });
}

function onScrollCanvas(painterService: PainterService, e: React.WheelEvent<HTMLCanvasElement>): void {
  painterService.updateZoomLevel(-(e.deltaY / 100));
  painterService.draw();
}

function onMouseMoveCanvas(
  painterService: PainterService,
  e: React.MouseEvent<HTMLCanvasElement>,
  canvasRect: DOMRect
): void {
  painterService.updateMouseCoords({
    x: e.clientX - canvasRect.x,
    y: e.clientY - canvasRect.y,
  });
  painterService.draw();
}

export default Canvas;
