import { ChartData } from "../../types/ChartData";

export function parse(csvContents: string): ChartData[] {
  if (csvContents.length === 0) {
    throw new Error("Empty contents");
  }

  let lines = csvContents.split("\r\n");
  if (lines.length === 1) {
    lines = csvContents.split("\n");
  }

  const data: ChartData[] = [];
  for (const line of lines) {
    const [date, open, high, low, close, volume] = line.trim().split(",");

    data.push({
      date: getDateObject(date),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseFloat(volume ?? 0),
    });
  }

  return data;
}

export function getDateObject(dateString: string): Date {
  const splits = dateString.split(" ");
  const [day, month, year] = splits[0].split(".");
  splits[0] = `${month}.${day}.${year}`;
  return new Date(splits.join(" "));
}
