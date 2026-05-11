import { useMemo } from "react";
import * as d3 from "d3";
import { PALETTE, ENERGY_KEYS } from "./constants";

const FLAG_W = 12;
const FLAG_H = 12;
const FLAG_GAP = 6; // gap between flag and text

export default function BarChart({
  data = [],
  width = 600,
  height = 400,
  margin = { top: 16, right: 32, bottom: 32, left: 140 },
  keys = ENERGY_KEYS,
  hoveredKey = null,
}) {
  const compact = width < 500;
  const effectiveMargin = compact
    ? { ...margin, left: FLAG_W + FLAG_GAP * 2 + 4 }
    : margin;

  const innerW = width - effectiveMargin.left - effectiveMargin.right;
  const innerH = height - effectiveMargin.top - effectiveMargin.bottom;

  const op = (key) => (!hoveredKey || hoveredKey.has(key) ? 1 : 0.08);

  const { rows, xScale, yScale, xTicks } = useMemo(() => {
    const countries = Array.from(
      d3.group(
        data.filter((d) => d.country !== "World"),
        (d) => d.country,
      ),
      ([country, records]) => {
        const totals = {};
        let grand = 0;
        for (const key of keys) {
          const sum = d3.sum(records, (r) => r[key]);
          totals[key] = sum;
          grand += sum;
        }
        const props = {};
        for (const key of keys)
          props[key] = grand > 0 ? totals[key] / grand : 0;
        return { country, ...props };
      },
    );

    countries.sort((a, b) => d3.descending(a.coal, b.coal));

    const series = d3.stack().keys(keys)(countries);

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const yScale = d3
      .scaleBand()
      .domain(countries.map((d) => d.country))
      .range([0, innerH])
      .padding(0.25);

    const rows = series.map((s) => ({
      key: s.key,
      fill: PALETTE[s.key] || "#ccc",
      segments: s.map((d) => ({
        country: d.data.country,
        x0: d[0],
        x1: d[1],
      })),
    }));

    return { rows, xScale, yScale, xTicks: xScale.ticks(compact ? 3 : 5) };
  }, [data, innerW, innerH, keys, compact]);

  const pct = d3.format(".0%");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <g transform={`translate(${effectiveMargin.left},${effectiveMargin.top})`}>
        {xTicks.map((t) => (
          <line
            key={t}
            x1={xScale(t)}
            x2={xScale(t)}
            y1={0}
            y2={innerH}
            stroke="var(--grid)"
            strokeWidth={0.1}
          />
        ))}

        {/* Stacked horizontal bars */}
        {rows.map((row) =>
          row.segments.map((seg) => (
            <rect
              key={`${row.key}-${seg.country}`}
              x={xScale(seg.x0)}
              y={yScale(seg.country)}
              width={xScale(seg.x1) - xScale(seg.x0)}
              height={yScale.bandwidth()}
              fill={row.fill}
              opacity={op(row.key)}
              style={{ transition: "opacity 0.2s" }}
            />
          )),
        )}

        {/* X axis */}
        <line
          x1={0}
          x2={innerW}
          y1={innerH}
          y2={innerH}
          stroke="var(--axis)"
          strokeWidth={1.5}
        />
        {xTicks.map((t) => (
          <text
            key={t}
            x={xScale(t)}
            y={innerH + 14}
            dy="0.71em"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {pct(t)}
          </text>
        ))}

        {/* Y axis */}
        <line
          x1={0}
          x2={0}
          y1={0}
          y2={innerH}
          stroke="var(--axis)"
          strokeWidth={1.5}
        />

        {/* Country labels + flags */}
        {yScale.domain().map((country) => {
          const midY = (yScale(country) ?? 0) + yScale.bandwidth() / 2;
          // flag sits right against the axis, text to its left
          const flagX = -FLAG_GAP - FLAG_W;
          const textX = flagX - FLAG_GAP;

          return (
            <g key={country}>
              {/* Flag */}
              <image
                href={`${import.meta.env.BASE_URL}flags/${country}.png`}
                x={flagX}
                y={midY - FLAG_H / 2}
                width={FLAG_W}
                height={FLAG_H}
                preserveAspectRatio="xMidYMid meet"
              />
              <circle
                cx={flagX + FLAG_W / 2}
                cy={midY}
                r={FLAG_W / 2}
                fill="none"
                stroke="var(--border)"
                strokeWidth={0.8}
              />
              {/* Country name */}
              {!compact && (
                <text
                  x={textX}
                  y={midY}
                  dy="0.32em"
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize={10}
                  fontFamily="var(--font-sans)"
                >
                  {country}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
