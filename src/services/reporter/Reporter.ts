import { Trade } from "../../context/tradesContext/Types";
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
import { Report } from "./Types";

export function generateReports(trades: Trade[]): Report[] {
  const hourlyReport: Report = {};
  const weekdayReport: Report = {};
  const monthlyReport: Report = {};
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  for (const trade of trades) {
    const date = new Date(trade.startDate);
    const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];

    if (!hourlyReport[hour]) {
      hourlyReport[hour] = {
        total: 0,
        positives: 0,
        negatives: 0,
        successPercentage: 0,
        profits: 0,
      };
    }
    if (!weekdayReport[weekday]) {
      weekdayReport[weekday] = {
        total: 0,
        positives: 0,
        negatives: 0,
        successPercentage: 0,
        profits: 0,
      };
    }
    if (!monthlyReport[month]) {
      monthlyReport[month] = {
        total: 0,
        positives: 0,
        negatives: 0,
        successPercentage: 0,
        profits: 0,
      };
    }

    hourlyReport[hour].total++;
    hourlyReport[hour].profits += trade.result;
    if (trade.result >= 0) {
      hourlyReport[hour].positives++;
    } else {
      hourlyReport[hour].negatives++;
    }

    weekdayReport[weekday].total++;
    weekdayReport[weekday].profits += trade.result;
    if (trade.result >= 0) {
      weekdayReport[weekday].positives++;
    } else {
      weekdayReport[weekday].negatives++;
    }

    monthlyReport[month].total++;
    monthlyReport[month].profits += trade.result;
    if (trade.result >= 0) {
      monthlyReport[month].positives++;
    } else {
      monthlyReport[month].negatives++;
    }
  }

  for (const hour in hourlyReport) {
    hourlyReport[hour].successPercentage = (hourlyReport[hour].positives / hourlyReport[hour].total) * 100;
  }

  for (const weekday in weekdayReport) {
    weekdayReport[weekday].successPercentage = (weekdayReport[weekday].positives / weekdayReport[weekday].total) * 100;
  }

  for (const month in monthlyReport) {
    monthlyReport[month].successPercentage = (monthlyReport[month].positives / monthlyReport[month].total) * 100;
  }

  return [hourlyReport, weekdayReport, monthlyReport];
}
