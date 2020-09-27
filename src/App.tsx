import React, { useEffect } from "react";
import "./App.css";

const canvasContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
const canvasRef: React.RefObject<HTMLCanvasElement> = React.createRef();

function App(): JSX.Element {
  useEffect(() => {
    resetCanvasSize();
    window.addEventListener("resize", resetCanvasSize);
  });

  return (
    <main>
      <div ref={canvasContainerRef} id="canvas-container">
        <canvas ref={canvasRef}></canvas>
      </div>
    </main>
  );
}

function resetCanvasSize(): void {
  const canvasContainer: HTMLDivElement = canvasContainerRef.current!;
  const canvas: HTMLCanvasElement = canvasRef.current!;

  canvas.height = canvasContainer.clientHeight;
  canvas.width = canvasContainer.clientWidth;
}

export default App;
