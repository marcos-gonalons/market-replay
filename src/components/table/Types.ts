export type HeaderCell = {
  content: JSX.Element;
  className?: string;
  meta?: {
    sortable: boolean;
    columnName: string;
    expandable?: boolean;
    expandIcon?: JSX.Element;
  };
};

export type BodyCell = {
  displayContent: JSX.Element;
  internalValue?: string | number;
  className?: string;
};

export type Row = {
  className?: string;
  isTotalsRow?: boolean;
};
export type HeaderRow = Row & {
  cells: HeaderCell[];
};
export type BodyRow = Row & {
  cells: BodyCell[];
};

export type OrderBy = {
  column: string;
  direction: "asc" | "desc";
};

export type SortingType = "client" | "server";
