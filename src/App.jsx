import { useState, useRef, useEffect } from "react";
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
import frflag from "./assets/France.png";
import usflag from "./assets/United States.png";
import chflag from "./assets/China.png";

const sharedYMax = 50000;

export default function App() {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

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
            <h2 className="chart-title">Energy Mix by Country</h2>
            <ResponsiveContainer height={500} className="chart-wrapper">
              <BarChart data={data} hoveredKey={hoveredKey} />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={introIcon} alt="" className="section-icon" />
              World Energy Mix
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

        {/* ── Row 2: 3 columns ── */}
        <div className="charts-grid-3">
          <section className="chart-card">
            <h2 className="section-heading">
              <img src={usflag} alt="" className="section-icon" />
              USA Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="United States"
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={frflag} alt="" className="section-icon" />
              France Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="France"
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={chflag} alt="" className="section-icon" />
              China Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="China"
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>
        </div>

        <div className="charts-grid-3">
          <section className="chart-card">
            <h2 className="section-heading">
              <img src={usflag} alt="" className="section-icon" />
              USA Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="United States"
                yMax={sharedYMax}
                showBrackets={false}
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={frflag} alt="" className="section-icon" />
              France Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="France"
                yMax={sharedYMax}
                showBrackets={false}
                hoveredKey={hoveredKey}
              />
            </ResponsiveContainer>
          </section>

          <section className="chart-card">
            <h2 className="section-heading">
              <img src={chflag} alt="" className="section-icon" />
              China Energy Mix
            </h2>
            <p className="chart-desc">By source · 1965 → 2024</p>
            <ResponsiveContainer height={200} className="chart-wrapper">
              <StackedAreaChart
                data={data}
                country="China"
                yMax={sharedYMax}
                showBrackets={false}
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
              Energy Mix by Country
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
