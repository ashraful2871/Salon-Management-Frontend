import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SortHeader } from "@/components/Shared/SortHeader";

/**
 * Where a column goes on a phone card:
 * - `eyebrow`: a small line above the title, joined with "·" (e.g. "#5 · 10:30 AM")
 * - `primary`: the title line
 * - `secondary`: a muted line under it, joined with "·"
 * - `meta`: a small muted line, joined with "·"
 * - `trailing`: top right (a status badge)
 * - `hidden`: table only
 */
export type MobileSlot =
  | "eyebrow"
  | "primary"
  | "secondary"
  | "meta"
  | "trailing"
  | "hidden";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** What the phone card shows instead of `cell`, when it needs less. */
  mobileCell?: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Defaults to `meta`. */
  mobile?: MobileSlot;
  /**
   * On the table's header and cells only. The list is a size container, so
   * `hidden @5xl:table-cell` drops a column when the list itself is narrow.
   */
  className?: string;
  /** The header sorts the list through `?sort=<key>:asc|desc`; the page reads it. */
  sortable?: boolean;
};

export type DataListLayout = "table" | "card";

// Literal class pairs, so Tailwind sees them. Container widths: 42, 48, 56rem.
const TABLE_FROM = {
  "2xl": { table: "hidden @2xl:block", cards: "@2xl:hidden" },
  "3xl": { table: "hidden @3xl:block", cards: "@3xl:hidden" },
  "4xl": { table: "hidden @4xl:block", cards: "@4xl:hidden" },
} as const;

export type DataListProps<T> = {
  items: T[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  /** Called once per layout; return null when the row has nothing to do. */
  rowActions?: (row: T, layout: DataListLayout) => ReactNode;
  empty: ReactNode;
  rowClassName?: (row: T) => string;
  /** Read out to screen readers as the table's name. */
  caption?: string;
  /**
   * The list's own width at which the table replaces the cards. The default
   * (42rem) is about `md` without the sidebar; a wide table asks for more.
   */
  tableFrom?: keyof typeof TABLE_FROM;
  /**
   * Splits the list into sections under a heading row. `items` must already
   * be sorted so each group's rows are next to each other.
   */
  groupOf?: (row: T) => string;
  groupHeader?: (key: string, rows: T[]) => ReactNode;
  /**
   * A checkbox per row (and select-all in the table header), for bulk
   * actions. Controlled by `rowKey` values; pair with `BulkActionBar`. The
   * parent must be a client component to pass `onSelectedChange`.
   */
  selectable?: boolean;
  selected?: readonly string[];
  onSelectedChange?: (keys: string[]) => void;
  /** `compact` tightens rows (`py-2 text-sm`) for dense back-office lists. */
  density?: "comfortable" | "compact";
  /** Links the first column (table) and the card title to the row's page. */
  rowHref?: (row: T) => string;
};

const CHECKBOX = "size-4 shrink-0 cursor-pointer rounded accent-primary";

const isEmpty = (node: ReactNode) =>
  node === null || node === undefined || node === false || node === "";

/** Renders `sep` between the non-empty cells of one card line. */
const Joined = ({ nodes, sep = "·" }: { nodes: [string, ReactNode][]; sep?: string }) =>
  nodes.map(([key, node], i) => (
    <Fragment key={key}>
      {i > 0 && <span aria-hidden="true">{sep}</span>}
      {node}
    </Fragment>
  ));

/**
 * One list, two layouts: a table when the list is wide enough, a stack of
 * cards below that. The switch reads the list's own width (a container query),
 * not the screen's, so the sidebar is accounted for. Both are in the markup and
 * CSS picks one, which keeps this a plain render for server or client parents.
 */
export function DataList<T>({
  items,
  rowKey,
  columns,
  rowActions,
  empty,
  rowClassName,
  caption,
  tableFrom = "2xl",
  groupOf,
  groupHeader,
  selectable = false,
  selected = [],
  onSelectedChange,
  density = "comfortable",
  rowHref,
}: DataListProps<T>) {
  if (items.length === 0) return <>{empty}</>;

  const compact = density === "compact";
  const chosen = new Set(selected);
  const allKeys = items.map(rowKey);
  const allChosen = allKeys.every((k) => chosen.has(k));
  const someChosen = !allChosen && allKeys.some((k) => chosen.has(k));
  const toggle = (key: string) =>
    onSelectedChange?.(
      chosen.has(key) ? selected.filter((k) => k !== key) : [...selected, key],
    );
  const toggleAll = () =>
    onSelectedChange?.(
      allChosen
        ? selected.filter((k) => !allKeys.includes(k))
        : [...new Set([...selected, ...allKeys])],
    );
  const rowCheckbox = (row: T, label: string) => (
    <input
      type="checkbox"
      className={CHECKBOX}
      checked={chosen.has(rowKey(row))}
      onChange={() => toggle(rowKey(row))}
      aria-label={label}
    />
  );
  // The first column (table) and the title (card) open the row when linked.
  const linked = (row: T, node: ReactNode) =>
    rowHref ? (
      <Link
        href={rowHref(row)}
        className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {node}
      </Link>
    ) : (
      node
    );

  const slot = (name: MobileSlot) =>
    columns.filter((c) => (c.mobile ?? "meta") === name);
  const slots = {
    eyebrow: slot("eyebrow"),
    primary: slot("primary"),
    secondary: slot("secondary"),
    meta: slot("meta"),
    trailing: slot("trailing"),
  };
  const cardCells = (row: T, cols: Column<T>[]) =>
    cols
      .map((c): [string, ReactNode] => [c.key, (c.mobileCell ?? c.cell)(row)])
      .filter(([, node]) => !isEmpty(node));

  // Consecutive runs of the same group; one run with no key when ungrouped.
  const groups: { key: string | null; rows: T[] }[] = [];
  for (const row of items) {
    const key = groupOf ? groupOf(row) : null;
    const last = groups.at(-1);
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row] });
  }
  const headerOf = (group: (typeof groups)[number]) =>
    group.key !== null && groupHeader ? groupHeader(group.key, group.rows) : null;

  const layout = TABLE_FROM[tableFrom];
  const span = columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0);

  const tableRow = (row: T) => (
    <TableRow
      key={rowKey(row)}
      className={cn(
        compact ? "h-10 text-sm" : "h-14",
        "hover:bg-surface-subtle/60",
        selectable && chosen.has(rowKey(row)) && "bg-primary-soft/40",
        rowClassName?.(row),
      )}
    >
      {selectable && (
        <TableCell className={cn("w-10 pr-0 pl-4", compact ? "py-2" : "py-3")}>
          {rowCheckbox(row, "Select row")}
        </TableCell>
      )}
      {columns.map((c, i) => (
        <TableCell
          key={c.key}
          className={cn(
            "px-4 whitespace-normal",
            compact ? "py-2" : "py-3",
            c.align === "right" && "text-right tabular-nums",
            c.className,
          )}
        >
          {i === 0 ? linked(row, c.cell(row)) : c.cell(row)}
        </TableCell>
      ))}
      {rowActions && (
        <TableCell className={cn("px-4", compact ? "py-2" : "py-3")}>
          <div className="flex items-center justify-end gap-2">
            {rowActions(row, "table")}
          </div>
        </TableCell>
      )}
    </TableRow>
  );

  const card = (row: T) => {
    const eyebrow = cardCells(row, slots.eyebrow);
    const primary = cardCells(row, slots.primary);
    const secondary = cardCells(row, slots.secondary);
    const meta = cardCells(row, slots.meta);
    const trailing = cardCells(row, slots.trailing);
    const actions = rowActions?.(row, "card");

    return (
      <li
        key={rowKey(row)}
        className={cn(
          compact ? "p-3 text-sm" : "p-4",
          selectable && chosen.has(rowKey(row)) && "bg-primary-soft/40",
          rowClassName?.(row),
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {selectable && <div className="pt-0.5">{rowCheckbox(row, "Select")}</div>}
          <div className="min-w-0 flex-1 space-y-1">
            {eyebrow.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                <Joined nodes={eyebrow} />
              </p>
            )}
            {primary.map(([key, node]) => (
              <div key={key} className="break-words font-semibold text-foreground">
                {linked(row, node)}
              </div>
            ))}
            {secondary.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
                <Joined nodes={secondary} />
              </p>
            )}
            {meta.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                <Joined nodes={meta} />
              </div>
            )}
          </div>
          {trailing.length > 0 && (
            <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-1 text-right">
              {trailing.map(([key, node]) => (
                <Fragment key={key}>{node}</Fragment>
              ))}
            </div>
          )}
        </div>
        {!isEmpty(actions) && (
          <div className="mt-3 flex items-center gap-2">{actions}</div>
        )}
      </li>
    );
  };

  return (
    <div className="@container">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-surface",
          layout.table,
        )}
      >
        <Table>
          {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
          <TableHeader className="bg-surface-subtle">
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="h-11 w-10 pr-0 pl-4">
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={allChosen}
                    ref={(el) => {
                      if (el) el.indeterminate = someChosen;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "h-11 px-4 text-xs font-semibold text-muted-foreground",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  {c.sortable ? (
                    <SortHeader sortKey={c.key} label={c.header} align={c.align} />
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              {rowActions && (
                <TableHead className="h-11 px-4 text-right text-xs font-semibold text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const header = headerOf(group);
              return (
                <Fragment key={group.key ?? "all"}>
                  {header && (
                    <TableRow className="bg-surface-subtle/60 hover:bg-surface-subtle/60">
                      <TableCell colSpan={span} className="px-4 py-2.5 text-sm">
                        {header}
                      </TableCell>
                    </TableRow>
                  )}
                  {group.rows.map(tableRow)}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul
        aria-label={caption}
        className={cn(
          "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface",
          layout.cards,
        )}
      >
        {groups.map((group) => {
          const header = headerOf(group);
          return (
            <Fragment key={group.key ?? "all"}>
              {header && (
                <li className="bg-surface-subtle px-4 py-2.5 text-sm">{header}</li>
              )}
              {group.rows.map(card)}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
