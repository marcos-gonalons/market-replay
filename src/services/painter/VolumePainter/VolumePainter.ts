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
  const maxVolumeHeightInPx = canvasHeight * VOLUME_HEIGHT_IN_PERCENTAGE;
  let candleNumber = 0;
  for (let i = dataStartIndex; i <= dataEndIndex; i++) {
    const candle = data[i];
    if (!candle) continue;

    const x = candleWidth * candleNumber;
    const height =
      (maxVolumeHeightInPx / (volumeRange.max - volumeRange.min || 1)) * (candle.volume - volumeRange.min) || 1;

    ctx.fillStyle = candle.close >= candle.open ? colors.positive : colors.negative;
    ctx.fillRect(x, canvasHeight - height - TIME_SCALE_HEIGHT_IN_PX, candleWidth, height);

    candleNumber++;
  }
}
