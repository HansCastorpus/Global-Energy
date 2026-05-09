import { useMemo } from "react";
import * as d3 from "d3";
import { PALETTE, ENERGY_KEYS } from "./constants";

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

const GAP = 3;

/**
 * AlluvialChart — absolute TWh volume
 * Column height reflects actual energy quantity.
 * All columns share the same scale so growth is visible.
 */
export default function AlluvialChart({
  data = [],
  width = 800,
  height = 500,
  margin = { top: 48, right: 110, bottom: 16, left: 16 },
  keys = ENERGY_KEYS,
  country = "World",
  hoveredKey = null,
}) {
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const { columns, ribbons } = useMemo(() => {
    const snapshots = YEARS.map((year) =>
      data.find((d) => d.country === country && d.year === year) || null
    );

    if (snapshots.every((s) => s === null)) return { columns: [], ribbons: [] };

    const totalPerYear = snapshots.map((s) =>
      s ? d3.sum(keys, (k) => s[k] ?? 0) : 0
    );
    const globalMax = d3.max(totalPerYear) ?? 1;
    const nodeWidth = Math.max(6, innerW * 0.018);
    const colX = YEARS.map((_, i) => (i / (YEARS.length - 1)) * innerW);
    const scale = (innerH - GAP * (keys.length - 1)) / globalMax;

    const columns = snapshots.map((snap, ci) => {
      let cursor = 0;
      const nodes = keys.map((key) => {
        const value = snap ? (snap[key] ?? 0) : 0;
        const h = value * scale;
        const node = { key, value, y0: cursor, y1: cursor + h, x: colX[ci] };
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

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>

        {/* Ribbons */}
        {ribbons.map((r, i) => (
          <path key={i} d={r.path} fill={r.fill}
            opacity={!hoveredKey || hoveredKey === r.key ? 0.3 : 0.04}
            stroke={r.fill} strokeWidth={0.3}
            style={{ transition: "opacity 0.2s" }} />
        ))}

        {/* Nodes */}
        {columns.map((col) =>
          col.nodes.map((node) => (
            <rect key={`${col.year}-${node.key}`}
              x={node.x} y={node.y0}
              width={col.nodeWidth} height={Math.max(0, node.y1 - node.y0)}
              fill={PALETTE[node.key]}
              opacity={!hoveredKey || hoveredKey === node.key ? 1 : 0.08}
              style={{ transition: "opacity 0.2s" }} />
          ))
        )}

        {/* Year labels */}
        {columns.map((col) => {
          const lines = LABELS[col.year] || [String(col.year)];
          return (
            <g key={col.year} transform={`translate(${col.x + col.nodeWidth / 2}, -12)`}>
              {lines.map((line, li) => (
                <text
                  key={li}
                  y={-li * 13}
                  textAnchor="middle"
                  fill={li === 0 ? "var(--text)" : "var(--text-muted)"}
                  fontSize={li === 0 ? 11 : 8}
                  fontFamily="var(--font-mono)"
                  fontWeight={li === 0 ? 600 : 400}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {/* Source labels — right of last column */}
        {columns[columns.length - 1]?.nodes.map((node) => {
          const h = node.y1 - node.y0;
          if (h < 6) return null;
          return (
            <text
              key={node.key}
              x={node.x + columns[columns.length - 1].nodeWidth + 6}
              y={(node.y0 + node.y1) / 2}
              dy="0.32em"
              fill="var(--text-muted)"
              fontSize={9}
              fontFamily="var(--font-sans)"
            >
              {node.key.replace(/_/g, " ")}
            </text>
          );
        })}

      </g>
    </svg>
  );
}