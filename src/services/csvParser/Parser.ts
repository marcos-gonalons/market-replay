import { Candle } from "../../context/globalContext/Types";
import { AddIndicatorsData } from "../indicators/Builder";

export function parse(csvContents: string): Candle[] {
  if (csvContents.length === 0) {
    throw new Error("Empty contents");
  }

  let lines = csvContents.split("\r\n");
  if (lines.length === 1) {
    lines = csvContents.split("\n");
  }

  const data: Candle[] = [];
  for (const line of lines) {
    const [date, open, high, low, close, volume] = line.trim().split(",");
    const dateObject = getDateObject(date);
    if (dateObject.toString() === "Invalid Date") {
      throw new Error(`Invalid date: ${date}`);
    }
    const candle: Candle = {
      timestamp: dateObject.valueOf(),
      open: parseFloat(open ?? 0),
      high: parseFloat(high ?? 0),
      low: parseFloat(low ?? 0),
      close: parseFloat(close ?? 0),
      volume: parseFloat(volume ?? 0),
      indicators: {
        movingAverages: [],
        rsi: {
          value: 0,
          averageLoses: 0,
          averageProfits: 0
        }
      },
    };

    data.push(candle);

    AddIndicatorsData(data);
  }

  return data;
}

export function getDateObject(dateString: string): Date {
  try {
    const splits = dateString.split(" ");
    const [day, month, year] = splits[0].split(".");
    const time = splits[1];
    const timezone = splits[2];

    const correctTimezone = timezone[3]+timezone[4]+timezone[5]+':'+timezone[6]+timezone[7];

    const final = `${year}-${month}-${day}T${time}${correctTimezone}`

    const date = new Date(final);

    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
    date.getUTCDate(), date.getUTCHours(),
    date.getUTCMinutes(), date.getUTCSeconds()));
  } catch (e) {
    return new Date((parseInt(dateString)*1000));
  }
}
