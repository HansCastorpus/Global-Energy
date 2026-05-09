import { useMemo } from "react";
import * as d3 from "d3";
import { PALETTE, ENERGY_KEYS } from "./constants";
import { useWindowWidth } from "./useWindowWidth";

const ANNOTATIONS = {
  1973: ["1973", "Oil Crisis I"],
  1979: ["1979", "Oil Crisis II"],
  1991: ["1991", "USSR collapse"],
  2020: ["2020", "Covid-19"],
};

const BRACKET_GROUPS = [
  { label: "Fossil", keys: ["coal", "oil", "gas"] },
  { label: "Nuclear", keys: ["nuclear"] },
  {
    label: "Renewable",
    keys: ["hydro", "solar", "wind", "biofuel", "other_renewable"],
  },
];

const BRACKET_X_OFFSET = 10; // gap between chart right edge and tick tips
const BRACKET_W = 6; // length of tick arms
const LABEL_OFFSET = 11; // gap between spine and label
const LABEL_FONT_SIZE = 10;

export default function StackedAreaChart({
  data = [],
  width = 600,
  height = 400,
  margin = { top: 24, right: 80, bottom: 48, left: 72 },
  keys = ENERGY_KEYS,
  country = "World",
  yMax: yMaxProp = null,
  showBrackets = true,
  hoveredKey = null,
}) {
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const windowWidth = useWindowWidth();

  // Bracket geometry — computed here where innerW exists
  const tickX = innerW + BRACKET_X_OFFSET;
  const spineX = tickX + BRACKET_W;
  const labelX = spineX + LABEL_OFFSET;

  const { areas, xScale, yScale, yTicks, xTicks } = useMemo(() => {
    const rows = data
      .filter((d) => d.country === country)
      .sort((a, b) => d3.ascending(a.year, b.year));

    if (rows.length === 0)
      return { areas: [], xScale: null, yScale: null, yTicks: [], xTicks: [] };

    const series = d3.stack().keys(keys)(rows);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(rows, (d) => d.year))
      .range([0, innerW]);

    const yMax = yMaxProp ?? d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 0;
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerH, 0]);

    const area = d3
      .area()
      .x((d) => xScale(d.data.year))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveCatmullRom.alpha(0));

    const areas = series.map((s) => ({
      key: s.key,
      path: area(s),
      fill: PALETTE[s.key] || "#ccc",
    }));

    return {
      areas,
      xScale,
      yScale,
      yTicks: yScale.ticks(5),
      xTicks: xScale.ticks(8),
    };
  }, [data, innerW, innerH, keys, country, yMaxProp]);

  const brackets = useMemo(() => {
    if (!yScale || !showBrackets) return [];
    const rows = data
      .filter((d) => d.country === country)
      .sort((a, b) => d3.ascending(a.year, b.year));
    if (!rows.length) return [];

    const series = d3.stack().keys(keys)(rows);
    const lastIdx = rows.length - 1;

    const keyPixels = {};
    series.forEach((s) => {
      keyPixels[s.key] = [yScale(s[lastIdx][0]), yScale(s[lastIdx][1])];
    });

    return BRACKET_GROUPS.map((group) => {
      const groupKeys = group.keys.filter((k) => keyPixels[k]);
      if (!groupKeys.length) return null;
      const top = Math.min(...groupKeys.map((k) => keyPixels[k][1]));
      const bottom = Math.max(...groupKeys.map((k) => keyPixels[k][0]));
      const mid = (top + bottom) / 2;
      return { label: group.label, top, bottom, mid };
    }).filter(Boolean);
  }, [data, country, keys, yScale, showBrackets]);

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
            stroke="#000000"
            strokeWidth={0.1}
          />
        ))}

        {/* Stacked areas */}
        {areas.map((a) => (
          <path
            key={a.key}
            d={a.path}
            fill={a.fill}
            opacity={!hoveredKey || hoveredKey.has(a.key) ? 1 : 0.08}
            stroke={a.fill}
            strokeWidth={0.3}
            style={{ transition: "opacity 0.2s" }}
          />
        ))}

        {/* Annotation lines + labels — hidden on small screens */}
        {xScale &&
          windowWidth > 1300 &&
          (() => {
            const entries = Object.entries(ANNOTATIONS);
            const x73 = xScale(1973);
            const x79 = xScale(1979);
            const mergeOilCrises = x79 - x73 < 40;

            return entries.map(([yearStr, lines]) => {
              const x = xScale(+yearStr);
              const year = +yearStr;

              // When merging: skip 1979 label entirely, shift 1973 label to midpoint
              const skipLabel = mergeOilCrises && year === 1979;
              const labelX = x - 5;
              const labelLines =
                mergeOilCrises && year === 1973
                  ? ["1973 · 1979", "Oil Crises"]
                  : lines;

              return (
                <g key={yearStr}>
                  {/* Line always renders */}
                  <line
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={innerH}
                    stroke="var(--text-dim)"
                    strokeWidth={0.8}
                    strokeDasharray="3 3"
                  />

                  {/* Label only renders if not skipped */}
                  {!skipLabel &&
                    labelLines.map((line, li) => (
                      <text
                        key={li}
                        x={labelX + 3}
                        y={-6 - (labelLines.length - 1 - li) * 12}
                        fill={li === 0 ? "var(--text)" : "var(--text-muted)"}
                        fontSize={li === 0 ? 9 : 7.5}
                        fontFamily="var(--font-mono)"
                        fontWeight={li === 0 ? 600 : 400}
                      >
                        {line}
                      </text>
                    ))}
                </g>
              );
            });
          })()}

        {/* X axis */}
        <line
          x1={0}
          x2={innerW}
          y1={innerH}
          y2={innerH}
          stroke="var(--axis)"
          strokeWidth={1.5}
        />
        {xTicks.map((year) => (
          <text
            key={year}
            x={xScale(year)}
            y={innerH + 14}
            dy="0.71em"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {year}
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
          Energy Mix (TWh)
        </text>

        {/* Right-side brackets — ticks point left, label horizontal and centred on bracket zone */}
        {showBrackets &&
          brackets.map((b) => (
            <g key={b.label}>
              {/* Bracket: ticks at top and bottom pointing toward chart, spine on right */}
              <path
                d={`M ${tickX} ${b.top} L ${spineX} ${b.top} L ${spineX} ${b.bottom} L ${tickX} ${b.bottom}`}
                fill="none"
                stroke="var(--text-dim)"
                strokeWidth={1}
              />
              {/*
              Horizontal label centred on the bracket's midpoint.
              No rotation — reads left to right.
              x = labelX (fixed, just right of spine)
              y = b.mid  (vertical centre of the bracket zone)
            */}
              <text
                x={labelX}
                y={b.mid}
                textAnchor="start"
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontSize={LABEL_FONT_SIZE}
                fontFamily="var(--font-sans)"
                letterSpacing="0.06em"
              >
                {b.label.toUpperCase()}
              </text>
            </g>
          ))}
      </g>
    </svg>
  );
}
