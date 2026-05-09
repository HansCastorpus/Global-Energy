import { useMemo, useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { PALETTE, ENERGY_KEYS } from "./constants";
import useDimensions from "./useDimensions";

// ── Label layout constants — edit these ──────────────────
const LABEL_Y_OFFSET = 18;  // px below circle edge to label center
const FLAG_SIZE      = 14;  // flag diameter (square)
const GAP            = 4;   // exact px gap between flag circle edge and text
const FONT_SCALE     = 0.06; // font size as fraction of cell size
const MIN_FONT       = 7;   // minimum font size in px
// ─────────────────────────────────────────────────────────

function CountryCircle({ country, data, year, size, hoveredKey }) {
  const r  = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;

  const wedges = useMemo(() => {
    if (r <= 0) return [];
    const row = data.find((d) => d.country === country && d.year === year);
    if (!row) return [];
    const values = ENERGY_KEYS.map((k) => ({ key: k, value: row[k] ?? 0 }));
    const total  = d3.sum(values, (d) => d.value);
    if (total === 0) return [];
    const pie = d3.pie().value((d) => d.value).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(r);
    return pie(values).map((slice) => ({
      key:  slice.data.key,
      path: arc(slice),
      fill: PALETTE[slice.data.key] || "#ccc",
    }));
  }, [country, data, year, r]);

  const fontSize = Math.max(MIN_FONT, size * FONT_SCALE);
  const labelY   = r + LABEL_Y_OFFSET - 5;

  // Estimate text width for centering the whole group
  const textW  = country.length * fontSize * 0.52;
  const totalW = FLAG_SIZE + GAP + textW;
  const groupX = -totalW / 2;

  return (
    <svg width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <g transform={`translate(${cx},${cy})`}>

        {/* Pie wedges */}
        {wedges.map((w) => (
          <path key={w.key} d={w.path} fill={w.fill}
            stroke="var(--bg)" strokeWidth={0.8}
            opacity={!hoveredKey || hoveredKey.has(w.key) ? 0.9 : 0.08}
            style={{ transition: "opacity 0.2s" }} />
        ))}

        {/* Circle border */}
        <circle r={r} fill="none" stroke="var(--border)" strokeWidth={0.8} />

        {/* Label group: [flag circle] [GAP] [country name] — centered under circle */}
        <g transform={`translate(${groupX}, 0)`}>

          {/* Flag image clipped to circle */}
          <clipPath id={`clip-${country}`}>
            <circle cx={FLAG_SIZE / 2} cy={labelY} r={FLAG_SIZE / 2} />
          </clipPath>
          <image
            href={`${import.meta.env.BASE_URL}flags/${country}.png`}
            x={0}
            y={labelY - FLAG_SIZE / 2}
            width={FLAG_SIZE}
            height={FLAG_SIZE}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-${country})`}
          />
          {/* Circle stroke around flag */}
          <circle
            cx={FLAG_SIZE / 2}
            cy={labelY}
            r={FLAG_SIZE / 2}
            fill="none"
            stroke="var(--border)"
            strokeWidth={0.8}
          />

          {/* Country name — exactly GAP px to the right of the flag circle */}
          <text
            x={FLAG_SIZE + GAP}
            y={labelY + 1}
            textAnchor="start"
            dominantBaseline="middle"
            fill="var(--text-muted)"
            fontSize={fontSize}
            fontFamily="var(--font-sans)"
          >
            {country}
          </text>

        </g>
      </g>
    </svg>
  );
}

function SliderBar({ years, year, setYear }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 32px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      fontFamily: "var(--font-mono)", fontSize: 12,
      color: "var(--text-muted)",
      width: "100%",
    }}>
      <span>{years[0]}</span>
      <input type="range"
        min={years[0]} max={years[years.length - 1]} step={1} value={year}
        onChange={(e) => setYear(+e.target.value)}
        style={{ flex: 1, accentColor: "var(--accent)" }} />
      <span>{years[years.length - 1]}</span>
      <span style={{ minWidth: 44, textAlign: "right", color: "var(--text)", fontWeight: 600, fontSize: 24 }}>
        {year}
      </span>
    </div>
  );
}

export default function CirclePack({ data = [], hoveredKey = null, headerHeight = 0, legendLeft = 0, legendWidth = "100%" }) {
  const [ref, { width }] = useDimensions();
  const sliderRef = useRef(null);
  const [sliderFixed, setSliderFixed] = useState(false);

  const years = useMemo(() =>
    Array.from(new Set(data.map((d) => d.year))).sort(d3.ascending), [data]);

  const [year, setYear] = useState(() => years[years.length - 1] ?? 2024);

  const countries = useMemo(() =>
    Array.from(new Set(
      data
        .filter((d) => d.country !== "World" && d.country !== "Russia" && d.year === year)
        .map((d) => d.country)
    )).sort(),
    [data, year]
  );

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setSliderFixed(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const COLS     = width >= 1500 ? 10 : width >= 900 ? 6 : 3;
  const cellSize = width > 0 ? Math.floor(width / COLS) : 0;

  return (
    <div ref={ref} style={{ width: "100%" }}>

      {sliderFixed && (
        <div style={{ position: "fixed", top: headerHeight, left: legendLeft, width: legendWidth, zIndex: 9 }}>
          <SliderBar years={years} year={year} setYear={setYear} />
        </div>
      )}

      <div ref={sliderRef}>
        <SliderBar years={years} year={year} setYear={setYear} />
      </div>

      {cellSize > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gap: 0,
        }}>
          {countries.map((country) => (
            <CountryCircle key={country} country={country}
              data={data} year={year} size={cellSize} hoveredKey={hoveredKey} />
          ))}
        </div>
      )}

    </div>
  );
}