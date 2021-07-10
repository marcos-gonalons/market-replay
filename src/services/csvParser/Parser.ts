import { Candle } from "../../context/globalContext/Types";

export function parse(csvContents: string): Candle[] {
  if (csvContents.length === 0) {
    throw new Error("Empty contents");
  }

  let lines = csvContents.split("\r\n");
  if (lines.length === 1) {
    lines = csvContents.split("\n");
  }

  const data: Candle[] = [];
  lines.shift();
  for (const line of lines) {
    const [date, open, high, low, close, volume] = line.trim().split(",");
    const dateObject = getDateObject(date);
    if (dateObject.toString() === "Invalid Date") {
      throw new Error(`Invalid date: ${date}`);
    }
    data.push({
      timestamp: dateObject.valueOf(),
      open: parseFloat(open ?? 0),
      high: parseFloat(high ?? 0),
      low: parseFloat(low ?? 0),
      close: parseFloat(close ?? 0),
      volume: parseFloat(volume ?? 0),
    });

    // TODO: Same as the scripts executioner, return from time to time the progress %
  }

  return data;
}

export function getDateObject(dateString: string): Date {
  // return new Date((parseInt(dateString) - 3600) * 1000);   // Winter time
  // return new Date((parseInt(dateString) - 3600 * 2) * 1000); // Summer time

  const splits = dateString.split(" ");
  const [day, month, year] = splits[0].split(".");
  splits[0] = `${month}.${day}.${year}`;
  return new Date(splits.join(" "));
}
