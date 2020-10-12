import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "../../context/globalContext/GlobalContext";
import { TradesContext } from "../../context/tradesContext/TradesContext";
import PainterService from "../../services/painter/Painter";
import ReplayerService from "../../services/painter/Replayer/Replayer";
import styles from "./Canvas.module.css";

const canvasContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

interface ContainerDimensions {
  width: number;
  height: number;
}

export default function Canvas(): JSX.Element {
  const {
    state: { painterService, replayerService, data },
  } = useContext(GlobalContext);
  const { dispatch: tradesContextDispatch } = useContext(TradesContext);

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
    if (!painterService || !replayerService) return;
    window.addEventListener("keydown", (e: KeyboardEvent) => onKeyDown(e, replayerService));
    painterService.setCanvas(canvasRef.current!);
    painterService.setTradesContextDispatch(tradesContextDispatch);
  }, [painterService, replayerService, tradesContextDispatch]);

  useEffect(() => {
    canvasRef.current!.height = containerDimensions.height;
    canvasRef.current!.width = containerDimensions.width;
  }, [containerDimensions]);

  useEffect(() => {
    if (!painterService || !replayerService) return;

    if (!replayerService.isReplayActive()) {
      painterService.setData(data ?? []);
      painterService.draw();
    }
  }, [data, containerDimensions, painterService, replayerService]);

  useEffect(() => {
    if (!painterService || !data || data.length === 0) return;
    painterService.resetDataArrayOffset();
    painterService.draw();
  }, [data, painterService]);

  const containerStyles = {
    height: getCanvasContainerHeight(),
  };

  return (
    <>
      <section style={containerStyles} ref={canvasContainerRef} id={styles["canvas-container"]}>
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
      </section>
    </>
  );
}

function onResizeWindow(setContainerDimensions: (d: ContainerDimensions) => void): void {
  if (!canvasContainerRef.current) return;

  canvasContainerRef.current.style.height = getCanvasContainerHeight();
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

function getCanvasContainerHeight(): string {
  const topBarFullHeight = 52;
  return `${window.innerHeight - topBarFullHeight}px`;
}

function onKeyDown(e: KeyboardEvent, replayerService: ReplayerService): void {
  switch (e.code) {
    case "Space":
      replayerService.togglePause();
      break;
    case "ArrowRight":
      replayerService.goForward();
      break;
    case "ArrowLeft":
      replayerService.goBack();
      break;
  }
}
