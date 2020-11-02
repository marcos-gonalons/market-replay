import { Trade } from "../../context/tradesContext/Types";
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
import { Report, ReportData } from "./Types";

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
      hourlyReport[hour] = initReport();
    }
    if (!weekdayReport[weekday]) {
      weekdayReport[weekday] = initReport();
    }
    if (!monthlyReport[month]) {
      monthlyReport[month] = initReport();
    }

    updateReport(hourlyReport, hour, trade);
    updateReport(weekdayReport, weekday, trade);
    updateReport(monthlyReport, month, trade);
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

function initReport(): ReportData {
  return {
    total: 0,
    positives: 0,
    negatives: 0,
    successPercentage: 0,
    profits: 0,
  };
}

function updateReport(report: Report, key: string, trade: Trade): void {
  report[key].total++;
  report[key].profits += trade.result;
  if (trade.result >= 0) {
    report[key].positives++;
  } else {
    report[key].negatives++;
  }
}
