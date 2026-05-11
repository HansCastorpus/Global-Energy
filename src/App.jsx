import { useState, useRef, useEffect, useMemo } from "react";
import { useWindowWidth } from "./useWindowWidth";
import ResponsiveContainer from "./ResponsiveContainer";
import BarChart from "./BarChart";
import StackedAreaChart from "./StackedAreaChart";
import { data } from "./data";
import "./index.css";
import AlluvialChart from "./AlluvialChart";
import AlluvialChartPct from "./AlluvialChartPct";
import LineChart from "./LineChart";
import { PALETTE, ENERGY_KEYS } from "./constants";
import CirclePack from "./CirclePack";
import introIcon from "./assets/introduction.svg";
const sharedYMax = 50000;

function CountryPicker({ selectedCountries, onSelect }) {
  const windowWidth = useWindowWidth();
  const compact = windowWidth < 500;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 0, justifyContent: "center",
      padding: 0,
      background: "var(--surface)",
      border: "1px solid var(--border)",
    }}>
      {COUNTRIES_WITH_FLAGS.map((country) => {
        const isSelected = selectedCountries.includes(country);
        return (
          <button
            key={country}
            onClick={() => onSelect(country)}
            className="country-btn"
            data-selected={isSelected}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "5px 7px",
              background: isSelected ? "var(--btn-pressed)" : "transparent",
              borderTop: "none",
              borderBottom: "none",
              borderLeft: isSelected ? "1px solid var(--border)" : "1px solid transparent",
              borderRight: isSelected ? "1px solid var(--border)" : "1px solid transparent",
              cursor: isSelected ? "default" : "pointer",
              fontFamily: "var(--font-mono)",
              color: isSelected ? "var(--text)" : "var(--text-muted)",
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}flags/${country}.png`}
              width={14} height={14}
              style={{ borderRadius: "50%", objectFit: "cover", border: "0.5px solid var(--border)" }}
              alt={country}
            />
            {!compact && <span className="country-btn-label">{country}</span>}
          </button>
        );
      })}
    </div>
  );
}

const COUNTRIES_WITH_FLAGS = [
  "Argentina", "Australia", "Brazil", "Canada", "China",
  "Egypt", "France", "Germany", "India", "Indonesia",
  "Iran", "Italy", "Japan", "Malaysia", "Mexico",
  "Poland", "Saudi Arabia", "South Africa", "South Korea", "Spain",
  "Thailand", "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam",
];

export default function App() {
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [barYear, setBarYear] = useState(2024);
  const [barSortKey, setBarSortKey] = useState("coal");
  const [selectedCountries, setSelectedCountries] = useState(["United States", "France", "China"]);

  const selectCountry = (country) => {
    setSelectedCountries((prev) => {
      if (prev.includes(country)) return prev;
      return [...prev.slice(1), country];
    });
  };

  const pickerRef = useRef(null);
  const chartsEndRef = useRef(null);
  const [pickerFixed, setPickerFixed] = useState(false);

  useEffect(() => {
    const check = () => {
      const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
      const pickerBottom = pickerRef.current?.getBoundingClientRect().bottom ?? 0;
      const chartsEndTop = chartsEndRef.current?.getBoundingClientRect().top ?? Infinity;
      setPickerFixed(pickerBottom < headerBottom && chartsEndTop > headerBottom);
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, []);

  const dynamicYMax = useMemo(() => {
    let max = 0;
    for (const d of data) {
      if (!selectedCountries.includes(d.country)) continue;
      const total = ENERGY_KEYS.reduce((sum, k) => sum + (d[k] ?? 0), 0);
      if (total > max) max = total;
    }
    return max;
  }, [selectedCountries]);

  const toggleKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const hoveredKey = selectedKeys.size > 0 ? selectedKeys : null;

  // Measure header height so CirclePack slider sits below it
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure legend position/width so CirclePack slider matches it
  const legendRef = useRef(null);
  const [legendRect, setLegendRect] = useState({
    left: 0,
    width: "100%",
  });

  useEffect(() => {
    const el = legendRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setLegendRect({
        left: rect.left,
        width: rect.width,
      });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);

    update();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => setHeaderHeight(el.getBoundingClientRect().bottom);

    const observer = new ResizeObserver(update);
    observer.observe(el);

    update();

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app">
      <header className="app-header" ref={headerRef}>
        <div className="app-header-title">
          <h1>Global Energy</h1>
          <p className="subtitle">
            Primary energy consumption by country 1965–2024
          </p>
        </div>

        <div className="sticky-legend" ref={legendRef}>
          <p>Click to select →</p>
          {ENERGY_KEYS.map((key) => (
            <div
              key={key}
              className={`legend-item legend-btn${
                selectedKeys.has(key) ? " legend-btn--active" : ""
              }`}
              onClick={() => toggleKey(key)}
              style={{
                opacity:
                  selectedKeys.size > 0 && !selectedKeys.has(key) ? 0.3 : 1,
              }}
            >
              <span
                className="legend-swatch"
                style={{ background: PALETTE[key] }}
              />
              <span className="legend-label">{key.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </header>

      <main>
        {/* ── Info band ── */}
        <div className="intro">
          <div className="info-band">
            <div className="info-band-title">
              <h2 className="section-heading">
                <img src={introIcon} alt="" className="section-icon" />
                Introduction
              </h2>
            </div>
            <div className="info-band-text">
              <p>
                Energy is an essential element of our modern world. Its use has
                continuously increased for the last few decades with no sign of
                stopping. Who uses what? How much? This data visualization looks
                at this use through a series of different graphs. The legend
                serves as a filter for specific energy viewing.
              </p>
            </div>
          </div>
        </div>

        {/* ── Info band ── */}
        <div className="info-band">
          <div className="info-band-title">
            <h2>Reading the charts</h2>
            <h1>↓</h1>
          </div>
          <div className="info-band-text">
            <p>
              The horizontal stacked barplot on the left shows the
              proportional use oer six decades of the different energy sources showcased in this
              dataset. The stacked area chart on the right shows the world’s
              total energy output by source over six decades. Important events
              are shown to give some more insight.
            </p>
          </div>
        </div>

        {/* ── Row 1: 2 columns ── */}
        <div className="charts-grid-2">
          <section className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
              <h2 className="chart-title">Energy Use by Country</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                  Top Energy User
                </span>
                <select
                  value={barSortKey}
                  onChange={(e) => setBarSortKey(e.target.value)}
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 11,
                    color: "var(--text-muted)", background: "var(--surface)",
                    border: "1px solid var(--border)", padding: "2px 6px",
                    cursor: "pointer",
                  }}
                >
                  {ENERGY_KEYS.map((k) => (
                    <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0",
              fontFamily: "var(--font-mono)", fontSize: 12,
              color: "var(--text-muted)",
              width: "100%",
            }}>
              <span>1965</span>
              <input
                type="range"
                min={1965} max={2024} step={1} value={barYear}
                onChange={(e) => setBarYear(+e.target.value)}
                style={{ flex: 1, minWidth: 0, accentColor: "var(--accent)" }}
              />
              <span>2024</span>
              <span style={{ flexShrink: 0, color: "var(--text)", fontWeight: 600, fontSize: "clamp(12px, 3vw, 18px)" }}>
                {barYear}
              </span>
              
            </div>
            <ResponsiveContainer height={500} className="chart-wrapper">
              <BarChart data={data} hoveredKey={hoveredKey} year={barYear} sortKey={barSortKey} />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={introIcon} alt="" className="section-icon" />
              World Energy Use
            </h2>
            <ResponsiveContainer height={500} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="World"
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>
        </div>

        {/* ── Info band ── */}
        <div className="info-band">
          <div className="info-band-title">
            <h2>Reading the charts</h2>
            <h1>↓</h1>
          </div>
          <div className="info-band-text">
            <p>
              These six stacked area charts compare the energy usage over the
              last six decades of France, the United States and China. The first
              row shows each country's usage with an independent scale on the
              y-axis for each. The second row fixes the scales on the y-axis to
              show the vast discrepancies between the different sized economies.
            </p>
          </div>
        </div>

        {/* ── Country picker ── */}
        {pickerFixed && (
          <div style={{ position: "fixed", top: headerHeight, left: "32px", width: "calc(100% - 64px)", zIndex: 9 }}>
            <CountryPicker selectedCountries={selectedCountries} onSelect={selectCountry} />
          </div>
        )}
        <div ref={pickerRef}>
          <CountryPicker selectedCountries={selectedCountries} onSelect={selectCountry} />
        </div>

        {/* ── Row 2: 3 columns (independent y) ── */}
        <div className="row-label">Independent Scale</div>
        <div className="charts-grid-3">
          {selectedCountries.map((country) => (
            <section key={country} className="chart-card">
              <h2 className="section-heading">
                <img
                  src={`${import.meta.env.BASE_URL}flags/${country}.png`}
                  alt="" className="section-icon"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                {country} Energy Use
              </h2>
              <p className="chart-desc">By source · 1965 → 2024</p>
              <ResponsiveContainer height={200} className="chart-wrapper">
                <StackedAreaChart data={data} country={country} hoveredKey={hoveredKey} />
              </ResponsiveContainer>
            </section>
          ))}
        </div>

        {/* ── Row 3: 3 columns (shared y) ── */}
        <div className="row-label">Fixed Scale</div>
        <div className="charts-grid-3">
          {selectedCountries.map((country) => (
            <section key={country} className="chart-card">
              <h2 className="section-heading">
                <img
                  src={`${import.meta.env.BASE_URL}flags/${country}.png`}
                  alt="" className="section-icon"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
                {country} Energy Use
              </h2>
              <p className="chart-desc">By source · 1965 → 2024</p>
              <ResponsiveContainer height={200} className="chart-wrapper">
                <StackedAreaChart
                  data={data} country={country}
                  yMax={dynamicYMax} showBrackets={false}
                  hoveredKey={hoveredKey}
                />
              </ResponsiveContainer>
            </section>
          ))}
        </div>
        <div ref={chartsEndRef} />

        {/* ── Info band ── */}
        <div className="info-band">
          <div className="info-band-title">
            <h2>Reading the charts</h2>
            <h1>↓</h1>
          </div>
          <div className="info-band-text">
            <p>
              The line chart shows the evolution of energy usage throughout the
              decades. It helps us see the incredible increase in consumption
              from China and to a lesser extent, India. On the other hand older
              economies reach something resembling a plateau. The reasons why
              are of great interest! The alluvial chart on the right shows the
              proportion of energies used at a global level.
            </p>
          </div>
        </div>

        <div className="charts-grid-2">
          <section className="chart-card">
            <h2 className="section-heading">
              <img src={introIcon} alt="" className="section-icon" />
              World Energy Flow
            </h2>
            <p className="chart-desc">
              How the global mix shifted across key years · TWh
            </p>
            <ResponsiveContainer height={400} className="chart-wrapper">
              <LineChart data={data} hoveredKey={hoveredKey} />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={introIcon} alt="" className="section-icon" />
              World Energy Flow — Share
            </h2>
            <p className="chart-desc">
              Each source as % of total · columns fill full height
            </p>
            <ResponsiveContainer height={400} className="chart-wrapper">
              <AlluvialChartPct
                data={data}
                country="World"
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>
        </div>

        {/* ── Info band ── */}
        <div className="info-band">
          <div className="info-band-title">
            <h2>Reading the charts</h2>
            <h1>↓</h1>
          </div>
          <div className="info-band-text">
            <p>
              Finally, each country’s energy proportional usage is shown in a
              pie chart. You may use the slider to check out the proportion of
              each energy used per year.
            </p>
          </div>
        </div>

        <div className="charts-grid-1">
          <section className="chart-card">
            <h2 className="section-heading">
              <img src={introIcon} alt="" className="section-icon" />
              Energy Use by Country
            </h2>
            <p className="chart-desc">
              Proportional source breakdown · select a year
            </p>

            <CirclePack
              data={data}
              hoveredKey={hoveredKey}
              headerHeight={headerHeight}
              legendLeft={legendRect.left}
              legendWidth={legendRect.width}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
