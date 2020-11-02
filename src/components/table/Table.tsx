import { Paper } from "@material-ui/core";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import React, { useState } from "react";
import Arrow from "./arrow/Arrow";
import styles from "./Table.module.css";
import { BodyCell, BodyRow, HeaderCell, HeaderRow, OrderBy, SortingType } from "./Types";

export interface Props {
  className?: string;
  id?: string;
  header: HeaderRow;
  body: BodyRow[];
  sortingType?: SortingType;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  order?: OrderBy;
}
const C = ({
  className,
  id,
  header,
  body,
  sortingType = "client",
  onSort = () => null,
  order = { column: "", direction: "asc" },
}: Props): JSX.Element => {
  let changeOrder: (order: OrderBy) => void = () => undefined;
  [order, changeOrder] = useState(order);
  if (sortingType === "client" && order.column !== null) {
    clientSideOrdering(order, header, body);
  }
  let finalClassName = styles["table"];
  finalClassName = className ? className + " " + finalClassName : finalClassName;
  return (
    <TableContainer component={Paper}>
      <Table className={finalClassName} id={id} aria-label="simple table">
        <TableHead className={header.className}>
          <TableRow>
            {header.cells.map((cell, index) => {
              const headerCellContent = renderHeaderCellContent(cell, order, sortingType, changeOrder, onSort);
              let className = cell.className || "";
              if (cell.meta && cell.meta.sortable) {
                className += styles["sortable"];
              }
              return (
                <TableCell key={index} className={className}>
                  {cell.meta && cell.meta.expandable ? (
                    <div className={styles["header-with-expander"]}>
                      {headerCellContent} {cell.meta.expandIcon}
                    </div>
                  ) : (
                    headerCellContent
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {body.map((row, index) => {
            return (
              <TableRow key={index} className={row.className}>
                {row.cells.map((cell: BodyCell, index) => {
                  return (
                    <TableCell key={index} className={cell.className}>
                      {cell.displayContent}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

function clientSideOrdering(order: OrderBy, header: Props["header"], body: Props["body"]): void {
  const columnNumber = header.cells.findIndex((cell: HeaderCell) => {
    return cell.meta && cell.meta.columnName === order.column;
  });
  if (columnNumber === -1) return;
  body.sort((a, b) => {
    const ifGreater = order.direction === "asc" ? 1 : -1;
    const ifSmaller = ifGreater > 0 ? -1 : 1;
    let returnValue = 0;
    const aValue = a.cells[columnNumber].internalValue || 0;
    const bValue = b.cells[columnNumber].internalValue || 0;

    if (aValue > bValue) {
      returnValue = ifGreater;
    }
    if (aValue < bValue) {
      returnValue = ifSmaller;
    }
    return returnValue;
  });
}

function renderHeaderCellContent(
  cell: HeaderCell,
  order: OrderBy,
  sortingType: SortingType,
  changeOrder: (order: OrderBy) => void,
  onSort: Props["onSort"]
): JSX.Element {
  return (
    <div onClick={() => onClickHeader(cell, order, sortingType, changeOrder, onSort)}>
      {cell.meta && cell.meta.columnName === order.column ? (
        <Arrow direction={order.direction === "asc" ? "down" : "up"} />
      ) : (
        ""
      )}
      {cell.content}
    </div>
  );
}

function onClickHeader(
  cell: HeaderCell,
  order: OrderBy,
  sortingType: SortingType,
  changeOrder: (order: OrderBy) => void,
  onSort: Props["onSort"]
): void {
  if (cell.meta && !cell.meta.sortable) {
    return;
  }
  let direction = order.direction;
  if (cell.meta && cell.meta.columnName === order.column) {
    if (direction === "asc") {
      direction = "desc";
    } else {
      direction = "asc";
    }
  }
  const column = cell.meta ? cell.meta.columnName : "";
  changeOrder({ column, direction });
  if (cell.meta && cell.meta.sortable && sortingType === "server" && onSort) {
    onSort(column, direction);
  }
}
export default C;
