import { Trade } from "../../context/tradesContext/Types";
import { getMinutesAsHalfAnHour } from "../../utils/Utils";
import { Report, ReportData } from "./Types";

export function generateReports(trades: Trade[], initialBalance: number): Report[] {
  const hourlyReport: Report = {};
  const weekdayReport: Report = {};
  const monthlyReport: Report = {};
  const yearlyReport: Report = {};
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

  let maxDrawdown = 0;
  let balance = initialBalance;
  let maxBalance = balance;

  for (const trade of trades) {
    const date = new Date(trade.startDate);
    const hour = `${date.getHours().toString()}:${getMinutesAsHalfAnHour(date.getMinutes())}`;
    const weekday = weekdays[date.getDay()];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString();

    balance += trade.result;
    if (balance > maxBalance) {
      maxBalance = balance;
    } else {
      const drawdown = maxBalance - balance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    if (!yearlyReport[year]) {
      yearlyReport[year] = initReport();
    }

    if (!hourlyReport[hour]) {
      hourlyReport[hour] = initReport();
      // todo ("create date from hour, add groupValue the valueOf");
    }
    if (!weekdayReport[weekday]) {
      weekdayReport[weekday] = initReport();
      // todo ("create date from weekday, add groupValue the valueOf");
    }
    if (!monthlyReport[month]) {
      monthlyReport[month] = initReport();
    }

    updateReport(yearlyReport, year, trade);
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

  for (const year in yearlyReport) {
    yearlyReport[year].successPercentage = (yearlyReport[year].positives / yearlyReport[year].total) * 100;
  }

  console.log("Max drawdown", maxDrawdown);
  return [hourlyReport, weekdayReport, monthlyReport, yearlyReport];
}

function initReport(): ReportData {
  return {
    groupValue: 0,
    total: 0,
    positives: 0,
    negatives: 0,
    successPercentage: 0,
    profits: 0,
    trades: [],
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
  report[key].trades.push(trade);
}
