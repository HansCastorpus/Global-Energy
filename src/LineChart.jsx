import { useMemo } from "react";
import * as d3 from "d3";
import { useWindowWidth } from "./useWindowWidth";

const ANNOTATIONS = {
  1973: ["1973", "Oil Crisis I"],
  1979: ["1979", "Oil Crisis II"],
  1991: ["1991", "USSR collapse"],
  2020: ["2020", "Covid-19"],
};

export default function LineChart({
  data = [],
  width = 600,
  height = 400,
  margin = { top: 40, right: 120, bottom: 48, left: 72 },
  field = "primary_energy",
  label = "Total Energy (TWh)",
  hoveredKey = null,
}) {
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const windowWidth = useWindowWidth();

  const { lines, xScale, yScale, yTicks, xTicks } = useMemo(() => {
    // Exclude World aggregate
    const filtered = data.filter((d) => d.country !== "World");

    const grouped = d3.group(filtered, (d) => d.country);
    const countries = Array.from(grouped, ([country, rows]) => ({
      country,
      total: d3.sum(rows, (r) => r[field]),
    }))
      .sort((a, b) => d3.descending(a.total, b.total))
      .slice(0, 10)
      .map((d) => d.country);
    const colorScale = d3
      .scaleOrdinal()
      .domain(countries)
      .range(d3.schemeTableau10);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(filtered, (d) => d.year))
      .range([0, innerW]);

    const yMax = d3.max(filtered, (d) => d[field]) ?? 0;
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    const lineFn = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[field]))
      .curve(d3.curveCatmullRom.alpha(0.5))
      .defined((d) => d[field] != null);

    const lines = countries.map((country) => {
      const rows = Array.from(grouped.get(country)).sort((a, b) =>
        d3.ascending(a.year, b.year),
      );
      const lastRow = rows[rows.length - 1];
      return {
        country,
        path: lineFn(rows),
        color: colorScale(country),
        lastX: xScale(lastRow.year),
        lastY: yScale(lastRow[field]),
      };
    });

    return {
      lines,
      xScale,
      yScale,
      yTicks: yScale.ticks(6),
      xTicks: xScale.ticks(8),
    };
  }, [data, innerW, innerH, field]);

  // Collision-nudge end labels
  const nudgedLabels = useMemo(() => {
    if (!lines.length) return [];
    const MIN_SPACING = 12;
    const items = lines
      .map((l) => ({ ...l, y: l.lastY }))
      .sort((a, b) => a.y - b.y);
    for (let pass = 0; pass < 30; pass++) {
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].y - items[i - 1].y;
        if (gap < MIN_SPACING) {
          const push = (MIN_SPACING - gap) / 2;
          items[i - 1].y -= push;
          items[i].y += push;
        }
      }
    }
    return items;
  }, [lines]);

  const fmt = d3.format(",.0f");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Y grid */}
        {yTicks.map((t) => (
          <line
            key={t}
            x1={0}
            x2={innerW}
            y1={yScale(t)}
            y2={yScale(t)}
            stroke="var(--grid)"
            strokeWidth={0.1}
            strokeDasharray="3 3"
          />
        ))}

        {/* X grid */}
        {xTicks.map((t) => (
          <line
            key={t}
            x1={xScale(t)}
            x2={xScale(t)}
            y1={0}
            y2={innerH}
            stroke="var(--grid)"
            strokeWidth={0.3}
          />
        ))}

        {/* Annotation lines + labels — hidden on small screens */}
        {width > 640 && windowWidth > 1300 && Object.entries(ANNOTATIONS).map(([yearStr, lines_]) => {
          const x = xScale(+yearStr);
          return (
            <g key={yearStr}>
              <line
                x1={x}
                x2={x}
                y1={0}
                y2={innerH}
                stroke="var(--text-dim)"
                strokeWidth={0.8}
                strokeDasharray="3 3"
              />
              {lines_.map((line, li) => (
                <text
                  key={li}
                  x={x + 3}
                  y={-6 - (lines_.length - 1 - li) * 12}
                  fill={li === 0 ? "var(--text)" : "var(--text-muted)"}
                  fontSize={li === 0 ? 11 : 7.5}
                  fontFamily="var(--font-mono)"
                  fontWeight={li === 0 ? 600 : 400}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {/* Lines */}
        {lines.map((l) => (
          <path
            key={l.country}
            d={l.path}
            fill="none"
            stroke={l.color}
            strokeWidth={2.5}
            opacity={hoveredKey && hoveredKey.size > 0 ? 0.2 : 0.85}
          />
        ))}

        {/* End dots */}
        {lines.map((l) => (
          <circle
            key={l.country}
            cx={l.lastX}
            cy={l.lastY}
            r={3}
            fill={l.color}
          />
        ))}

        {/* Country labels — collision nudged */}
        {nudgedLabels.map((l) => (
          <g key={l.country}>
            <line
              x1={l.lastX + 4}
              y1={l.lastY}
              x2={l.lastX + 8}
              y2={l.y}
              stroke={l.color}
              strokeWidth={0.6}
              opacity={0.5}
            />
            <text
              x={l.lastX + 10}
              y={l.y}
              dy="0.32em"
              fill="var(--text-muted)"
              fontSize={11}
              fontFamily="var(--font-sans)"
            >
              {l.country}
            </text>
          </g>
        ))}

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
            {t}
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
        {yTicks.map((t) => (
          <text
            key={t}
            x={-10}
            y={yScale(t)}
            dy="0.32em"
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {fmt(t)}
          </text>
        ))}

        {/* Y axis label */}
        <text
          transform="rotate(-90)"
          x={-innerH / 2}
          y={-margin.left + 14}
          textAnchor="middle"
          fill="var(--text-dim)"
          fontSize={11}
          fontFamily="var(--font-sans)"
          letterSpacing="0.05em"
        >
          {label}
        </text>
      </g>
    </svg>
  );
}