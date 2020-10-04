import { ChartData } from "../../../context/dataContext/Types";
import { DEFAULT_FONT, MAX_DATES_IN_DATE_SCALE_PER_1000_PX, TIME_SCALE_HEIGHT_IN_PX } from "../Constants";
import { prependZero } from "../Utils";

interface Parameters {
  ctx: CanvasRenderingContext2D;
  colors: { background: string; border: string };
  candlesDisplayDimensions: { width: number; height: number };
  candlesInScreenStartIndex: number;
  candlesInScreenEndIndex: number;
  maxCandlesAmountInScreen: number;
  dataTemporality: number;
  data: ChartData[];
  canvasWidth: number;
  candleWidth: number;
}

export default function drawTimeScale({
  ctx,
  colors,
  candlesDisplayDimensions,
  candlesInScreenStartIndex,
  candlesInScreenEndIndex,
  maxCandlesAmountInScreen,
  dataTemporality,
  data,
  canvasWidth,
  candleWidth,
}: Parameters): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, candlesDisplayDimensions.height, candlesDisplayDimensions.width, TIME_SCALE_HEIGHT_IN_PX);

  ctx.fillStyle = colors.border;
  ctx.fillRect(0, candlesDisplayDimensions.height, canvasWidth, 2);

  ctx.font = "bold 15px Arial";

  let skip = Math.ceil(
    maxCandlesAmountInScreen / ((candlesDisplayDimensions.width * MAX_DATES_IN_DATE_SCALE_PER_1000_PX) / 1000)
  );
  if (dataTemporality < 3600) {
    skip = Math.ceil(skip / 10) * 10;
  }
  let candleNumber = 1;
  for (let i = candlesInScreenStartIndex; i < candlesInScreenEndIndex; i++) {
    if (candleNumber % skip === 0) {
      let date = data[i].date;

      let offset = 0;
      if (dataTemporality < 3600) {
        if (date.getMinutes() % 10 !== 0) {
          for (let j = i + 1; j < candlesInScreenEndIndex; j++) {
            offset++;
            if (data[j].date.getMinutes() % 10 === 0) break;
          }
        }
      }
      if (offset > 0) {
        date = data[i + offset].date;
      }

      const [hours, minutes] = [date.getHours(), date.getMinutes()].map(prependZero);
      /**
       * TODO: If data temporality is bigger than 1 day, display the day instead of hh:mm
       * Or if it's bigger than 1 week or 1 month, display the month
       * Make use of the method getDataTemporalityInSeconds !!! :) :)
       *
       * TODO2: If there is a day change while drawing the time, draw the day instead of the time
       * It should have another style/color to highlight that is a new day
       *
       * TODO3: Refactor this a lil bit
       *
       * TODO3: Beware that  data[i + offset] may be null
       */
      const text = `${hours}:${minutes}`;
      const textWidth = ctx.measureText(text).width;
      const x = (candleNumber + offset) * candleWidth - candleWidth / 2 - textWidth / 2;
      if (x < candlesDisplayDimensions.width - textWidth - 5) {
        ctx.fillText(text, x, candlesDisplayDimensions.height + 20);
      }
    }
    candleNumber++;
  }

  ctx.font = DEFAULT_FONT;
}
