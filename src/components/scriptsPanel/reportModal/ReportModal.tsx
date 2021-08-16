import React, { useContext, useState } from "react";
import { Modal } from "semantic-ui-react";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";
import { Trade } from "../../../context/tradesContext/Types";
import PainterService from "../../../services/painter/Painter";
import { Report, ReportData } from "../../../services/reporter/Types";
import { getNSigmaWithWeightedAverage } from "../../../utils/Utils";
import Table from "../../table/Table";
import { BodyRow, HeaderRow } from "../../table/Types";
import styles from "./ReportModal.module.css";

export interface Props {
  readonly isVisible: boolean;
  readonly hourlyReport: Report;
  readonly weekdayReport: Report;
  readonly monthlyReport: Report;
  readonly yearlyReport: Report;
  readonly onClose: () => void;
}

export type Tab = "hourly-report" | "weekday-report" | "monthly-report" | "yearly-report";

export default function ReportModal({
  isVisible,
  hourlyReport,
  weekdayReport,
  monthlyReport,
  yearlyReport,
  onClose,
}: Props): JSX.Element {
  logSigma([hourlyReport, weekdayReport, monthlyReport, yearlyReport]);
  const [activeTab, setActiveTab] = useState<Tab>("hourly-report");
  const [areTradesVisible, setAreTradesVisible] = useState<boolean>(false);
  const {
    state: { painterService },
  } = useContext(GlobalContext);
  return (
    <Modal centered={false} open={isVisible} onClose={onClose}>
      <Modal.Header>Reports</Modal.Header>
      <Modal.Content>
        {renderTabs(activeTab, setActiveTab)}
        {renderTable(getReportToRender(activeTab, [hourlyReport, weekdayReport, monthlyReport, yearlyReport]))}
        <button
          onClick={() => {
            setAreTradesVisible(!areTradesVisible);
          }}
        >
          {areTradesVisible ? "Hide trades" : "Show trades"}
        </button>
        {areTradesVisible ? renderTradesList(weekdayReport, painterService as PainterService) : ""}
      </Modal.Content>
    </Modal>
  );
}

function renderTabs(activeTab: Tab, setActiveTab: (tab: Tab) => void): JSX.Element {
  const tabs = [
    {
      displayName: "Hourly report",
      tabName: "hourly-report",
    },
    {
      displayName: "Weekday report",
      tabName: "weekday-report",
    },
    {
      displayName: "Monthly report",
      tabName: "monthly-report",
    },
    {
      displayName: "Yearly report",
      tabName: "yearly-report",
    },
  ] as {
    displayName: string;
    tabName: Tab;
  }[];
  return (
    <nav>
      {tabs.map((t, index) => {
        let className = styles["tab"];
        if (t.tabName === activeTab) {
          className = className + ` ${styles["active-tab"]}`;
        }
        return (
          <button key={index} onClick={() => setActiveTab(t.tabName)} className={className}>
            {t.displayName}
          </button>
        );
      })}
    </nav>
  );
}

function getReportToRender(activeTab: Tab, reports: Report[]): Report {
  switch (activeTab) {
    case "hourly-report":
      return reports[0];
    case "weekday-report":
      return reports[1];
    case "monthly-report":
      return reports[2];
    case "yearly-report":
      return reports[3];
  }
}

function renderTable(report: Report) {
  const tableHeader = getTableHeader();
  const tableBody = getTableBody(report);
  return <Table header={tableHeader} body={tableBody} />;
}

function getTableHeader(): HeaderRow {
  return {
    cells: [
      {
        content: <>Group</>,
        meta: { columnName: "group", sortable: true },
      },
      {
        content: <>Positives</>,
        meta: { columnName: "positives", sortable: true },
      },
      {
        content: <>Negatives</>,
        meta: { columnName: "negatives", sortable: true },
      },
      {
        content: <>Success %</>,
        meta: { columnName: "successPercentage", sortable: true },
      },
      {
        content: <>Profits</>,
        meta: { columnName: "profits", sortable: true },
      },
      {
        content: <>Total trades</>,
        meta: { columnName: "totalTrades", sortable: true },
      },
    ],
  };
}

function getTableBody(report: Report): BodyRow[] {
  const body: BodyRow[] = [];
  const totals: ReportData = {
    groupValue: 0,
    positives: 0,
    negatives: 0,
    successPercentage: 0,
    profits: 0,
    total: 0,
    trades: [],
  };
  for (const group in report) {
    totals.positives += report[group].positives;
    totals.negatives += report[group].negatives;
    totals.profits += report[group].profits;
    totals.total += report[group].total;
    body.push(getBodyRow(report[group], group));
  }
  totals.successPercentage = (totals.positives / totals.total) * 100;
  body.push(getBodyRow(totals, "Totals"));
  return body;
}

function getBodyRow(r: ReportData, group: "Totals" | string): BodyRow {
  return {
    isTotalsRow: group === "Totals",
    cells: [
      {
        displayContent: <>{group}</>,
        internalValue: group,
      },
      {
        displayContent: <>{r.positives}</>,
        internalValue: r.positives,
      },
      {
        displayContent: <>{r.negatives}</>,
        internalValue: r.negatives,
      },
      {
        displayContent: <>{r.successPercentage.toFixed(2)}</>,
        internalValue: r.successPercentage,
      },
      {
        displayContent: <>{r.profits.toFixed(2)}</>,
        internalValue: r.profits,
      },
      {
        displayContent: <>{r.total}</>,
        internalValue: r.total,
      },
    ],
    className: group === "Totals" ? styles["totals-row"] : "",
  };
}

function renderTradesList(report: Report, painterService: PainterService): JSX.Element {
  let trades: Trade[] = [];
  for (const group in report) {
    trades = trades.concat(report[group].trades);
  }
  trades.sort((a, b) => {
    return a.startDate.valueOf() > b.startDate.valueOf() ? 1 : -1;
  });
  return (
    <div style={{ fontFamily: "monospace" }}>
      {trades.map((t) => {
        const d = new Date(t.startDate);
        const ed = new Date(t.endDate);
        return (
          <div
            key={t.startDate}
            onClick={() => {
              painterService.setOffsetByDate(d);
            }}
          >
            <span>{`${t.size} ${t.position} -> ${t.result.toFixed(
              2
            )} -> ${d.toLocaleString()} to ${ed.toLocaleString()}`}</span>
          </div>
        );
      })}
    </div>
  );
}

function logSigma(reports: Report[]): void {
  return;
  let percentages: number[] = [];
  let totals: number[] = [];
  for (const h in reports[0]) {
    percentages.push(reports[0][h].successPercentage);
    totals.push(reports[0][h].total);
  }

  console.log("hour 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
  console.log("hour 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
  console.log("hour 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
  console.log("hour 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));

  percentages = [];
  totals = [];
  for (const d in reports[1]) {
    percentages.push(reports[1][d].successPercentage);
    totals.push(reports[1][d].total);
  }

  console.log("weekday 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
  console.log("weekday 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
  console.log("weekday 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
  console.log("weekday 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));

  percentages = [];
  totals = [];
  for (const d in reports[2]) {
    percentages.push(reports[2][d].successPercentage);
    totals.push(reports[2][d].total);
  }

  console.log("month 3 sigma", getNSigmaWithWeightedAverage(3, totals, percentages));
  console.log("month 4 sigma", getNSigmaWithWeightedAverage(4, totals, percentages));
  console.log("month 5 sigma", getNSigmaWithWeightedAverage(5, totals, percentages));
  console.log("month 6 sigma", getNSigmaWithWeightedAverage(6, totals, percentages));
}
