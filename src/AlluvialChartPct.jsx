import { useMemo } from "react";
import * as d3 from "d3";
import { PALETTE, ENERGY_KEYS } from "./constants";
import { useWindowWidth } from "./useWindowWidth";

const YEARS = [1965, 1973, 1979, 1991, 2000, 2010, 2020, 2024];
const LABELS = {
  1965: ["1965"],
  1973: ["1973", "Oil Crisis I"],
  1979: ["1979", "Oil Crisis II"],
  1991: ["1991", "USSR collapse"],
  2000: ["2000"],
  2010: ["2010"],
  2020: ["2020", "Covid-19"],
  2024: ["2024"],
};
const GAP = 1.5;

export default function AlluvialChartPct({
  data = [],
  width = 800,
  height = 500,
  margin = { top: 48, right: 110, bottom: 16, left: 40 },
  keys = ENERGY_KEYS,
  country = "World",
  hoveredKey = null,
}) {
  const windowWidth = useWindowWidth();
  
  const compact = width < 500;

  // Tighter margins on narrow screens; right needs ~30px for a "100%" label
  const adjustedMargin = compact
    ? { top: 32, right: 30, bottom: 16, left: 32 }
    : margin;
  
  const innerW = width - adjustedMargin.left - adjustedMargin.right;
  const innerH = height - adjustedMargin.top - adjustedMargin.bottom;

  const op = (key) => !hoveredKey || hoveredKey.has(key) ? 1 : 0.08;
  const ribbonOp = (key) => !hoveredKey || hoveredKey.has(key) ? 0.3 : 0.04;

  // Compact number format on narrow screens: 50,000 → 50k
  const fmtK   = (v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v));
  const fmtVal = width < 500 ? fmtK : (v) => v.toFixed(0);

  const { columns, ribbons } = useMemo(() => {
    const snapshots = YEARS.map((year) =>
      data.find((d) => d.country === country && d.year === year) || null
    );
    if (snapshots.every((s) => s === null)) return { columns: [], ribbons: [] };

    const nodeWidth = Math.max(6, innerW * 0.018);
    const colX = YEARS.map((_, i) => (i / (YEARS.length - 1)) * innerW);
    const usableH = innerH - GAP * (keys.length - 1);

    const columns = snapshots.map((snap, ci) => {
      const total = snap ? d3.sum(keys, (k) => snap[k] ?? 0) : 1;
      let cursor = 0;
      const nodes = keys.map((key) => {
        const value = snap ? (snap[key] ?? 0) : 0;
        const share = value / total;
        const h = share * usableH;
        const node = { key, value, share, y0: cursor, y1: cursor + h, x: colX[ci] };
        cursor += h + GAP;
        return node;
      });
      return { year: YEARS[ci], x: colX[ci], nodes, nodeWidth };
    });

    const ribbons = [];
    for (let ci = 0; ci < columns.length - 1; ci++) {
      const left = columns[ci];
      const right = columns[ci + 1];
      keys.forEach((key) => {
        const ln = left.nodes.find((n) => n.key === key);
        const rn = right.nodes.find((n) => n.key === key);
        if (!ln || !rn) return;
        const cpX = (left.x + right.x) / 2;
        const path = [
          `M ${left.x + left.nodeWidth} ${ln.y0}`,
          `C ${cpX} ${ln.y0}, ${cpX} ${rn.y0}, ${right.x} ${rn.y0}`,
          `L ${right.x} ${rn.y1}`,
          `C ${cpX} ${rn.y1}, ${cpX} ${ln.y1}, ${left.x + left.nodeWidth} ${ln.y1}`,
          `Z`,
        ].join(" ");
        ribbons.push({ key, path, fill: PALETTE[key] || "#ccc" });
      });
    }
    return { columns, ribbons };
  }, [data, innerW, innerH, keys, country]);

  const pct = d3.format(".0%");

  const rightLabels = useMemo(() => {
    const lastCol = columns[columns.length - 1];
    if (!lastCol) return [];
    const MIN_SPACING = 13;
    const items = keys.map((key) => {
      const node = lastCol.nodes.find((n) => n.key === key);
      const mid = node ? (node.y0 + node.y1) / 2 : 0;
      return { key, naturalY: mid, y: mid, share: node?.share ?? 0 };
    });
    for (let pass = 0; pass < 20; pass++) {
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].y - items[i - 1].y;
        if (gap < MIN_SPACING) {
          const push = (MIN_SPACING - gap) / 2;
          items[i - 1].y -= push;
          items[i].y     += push;
        }
      }
    }
    return items;
  }, [columns, keys]);

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <g transform={`translate(${adjustedMargin.left},${adjustedMargin.top})`}>

        {ribbons.map((r, i) => (
          <path key={i} d={r.path} fill={r.fill}
            opacity={ribbonOp(r.key)}
            stroke={r.fill} strokeWidth={0.1}
            style={{ transition: "opacity 0.2s" }} />
        ))}

        {columns.map((col) =>
          col.nodes.map((node) => (
            <rect key={`${col.year}-${node.key}`}
              x={node.x} y={node.y0}
              width={col.nodeWidth} height={Math.max(0, node.y1 - node.y0)}
              fill={PALETTE[node.key]}
              opacity={op(node.key)}
              style={{ transition: "opacity 0.2s" }} />
          ))
        )}

        {columns.map((col) => {
          const lines = LABELS[col.year] || [String(col.year)];
          return (
            <g key={col.year} transform={`translate(${col.x + col.nodeWidth / 2}, -12)`}>
              {lines.map((line, li) => (
                <text key={li} y={-li * 13} textAnchor="middle"
                  fill={li === 0 ? "var(--text)" : "var(--text-muted)"}
                  fontSize={li === 0 ? 11 : 8} fontFamily="var(--font-mono)"
                  fontWeight={li === 0 ? 600 : 400}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {columns[0]?.nodes.map((node) => {
          if (node.y1 - node.y0 < 8) return null;
          return (
            <text key={node.key} x={node.x - 6} y={(node.y0 + node.y1) / 2}
              dy="0.32em" textAnchor="end" fill="var(--text-muted)"
              fontSize={9} fontFamily="var(--font-mono)">
              {pct(node.share)}
            </text>
          );
        })}

        {(() => {
          const lastCol = columns[columns.length - 1];
          if (!lastCol) return null;

          if (compact) {
            return rightLabels.map(({ key, y, share }) => {
              const node = lastCol.nodes.find((n) => n.key === key);
              if (!node || node.y1 - node.y0 < 8) return null;
              return (
                <text key={key}
                  x={lastCol.x + lastCol.nodeWidth + 6}
                  y={y}
                  dy="0.32em"
                  textAnchor="start"
                  fill="var(--text-muted)"
                  fontSize={9}
                  fontFamily="var(--font-mono)">
                  {pct(share)}
                </text>
              );
            });
          }

          const labelX = lastCol.x + lastCol.nodeWidth + 8;
          return rightLabels.map(({ key, naturalY, y, share }) => (
            <g key={key}>
              <line x1={lastCol.x + lastCol.nodeWidth} y1={naturalY}
                x2={labelX - 2} y2={y}
                stroke={PALETTE[key]} strokeWidth={0.8} opacity={0.6} />
              <rect x={labelX} y={y - 4} width={8} height={8} rx={1}
                fill={PALETTE[key]}
                opacity={op(key)} style={{ transition: "opacity 0.2s" }} />
              <text x={labelX + 12} y={y} dy="0.32em"
                fill="var(--text-muted)" fontSize={9} fontFamily="var(--font-sans)">
                {key.replace(/_/g, " ")} {pct(share)}
              </text>
            </g>
          ));
        })()}

      </g>
    </svg>
  );
}