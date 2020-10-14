import { TIME_SCALE_HEIGHT_IN_PX, VOLUME_HEIGHT_IN_PERCENTAGE } from "../Constants";
import { DrawVolumeParameters } from "./Types";

export function drawVolume({
  ctx,
  data,
  canvasHeight,
  dataStartIndex,
  dataEndIndex,
  candleWidth,
  colors,
  volumeRange,
}: DrawVolumeParameters): void {
  void data;

  const volumeHeightInPx = canvasHeight * VOLUME_HEIGHT_IN_PERCENTAGE;

  let candleNumber = 0;
  for (let i = dataStartIndex; i <= dataEndIndex; i++) {
    const candle = data[i];
    if (!candle) continue;

    const isPositive = candle.close >= candle.open;
    const x = candleWidth * candleNumber;
    const height =
      (volumeHeightInPx / (volumeRange.max - volumeRange.min || 1)) * (candle.volume - volumeRange.min) || 1;

    ctx.fillStyle = isPositive ? colors.positive : colors.negative;
    ctx.fillRect(x, canvasHeight - height - TIME_SCALE_HEIGHT_IN_PX, candleWidth, height);

    candleNumber++;
  }
}
