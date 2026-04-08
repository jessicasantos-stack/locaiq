"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, StatCard, Rec, Btn } from "../shared";
import { CITY_DB, SEASONALITY, REVENUE_DATA, CTR_BY_POSITION } from "./marketRadarData";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOW_MONTH = new Date().getMonth() + 1; // 1-12

// ── Views ──
const VIEWS = [
  { id: "matrix",    label: "City x Service Matrix" },
  { id: "territory", label: "Territorial Presence" },
  { id: "golden",    label: "Golden Combos" },
  { id: "season",    label: "Seasonality" },
];

// ── Strategy badges ──
const STRATEGY = {
  DEFENDER:   { label: "DEFENDER",   color: C.blue,   bg: `${C.blue}18`,   desc: "Top 3 — maintain position" },
  ACELERAR:   { label: "ACELERAR",   color: C.green,  bg: `${C.green}18`,  desc: "Pos 4-10 — best ROI" },
  CONQUISTAR: { label: "CONQUISTAR", color: C.orange, bg: `${C.orange}18`, desc: "Not appearing — build presence" },
};

export default function MarketRadar({ client, onNavigate }) {
  const [view, setView] = useState("territory");
  const [sortBy, setSortBy] = useState("revenue");
  const [filter, setFilter] = useState("all");
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const cat = client.category || "";
  const homeCity = client.city || client.address?.split(",")[0]?.trim() || "";
  const seasonData = SEASONALITY[cat] || SEASONALITY["Home Renovation Contractor"];
  const revenueData = REVENUE_DATA[cat] || REVENUE_DATA["Home Renovation Contractor"];
  const services = seasonData.services || [];
  const currentSeasonMultiplier = seasonData[NOW_MONTH] || 1.0;

  // Default cities for unknown niches
  const defaultCities = Array.from({ length: 20 }, (_, i) => ({
    city: `City ${i + 1}`, state: client.address?.split(",")[1]?.trim()?.split(" ")[0] || "US",
    dist: (i + 1) * 5, pop: 15000 + i * 8000, income: 55000 + i * 3000,
    saturation: i < 6 ? "Low" : i < 13 ? "Medium" : "High",
    demand: 60 + Math.round(Math.sin(i * 0.8) * 20), clientPresence: i === 0,
  }));

  const rawCities = CITY_DB[cat] || defaultCities;

  // ── Niche weights for viability ──
  const nicheWeights = {
    "Home Renovation Contractor": { dist: 0.25, income: 0.25, saturation: 0.20, demand: 0.15, season: 0.15 },
    "Dentist":                    { dist: 0.20, income: 0.20, saturation: 0.20, demand: 0.25, season: 0.15 },
    "HVAC Contractor":            { dist: 0.25, income: 0.10, saturation: 0.15, demand: 0.30, season: 0.20 },
    "Plumber":                    { dist: 0.30, income: 0.10, saturation: 0.15, demand: 0.25, season: 0.20 },
    "Family Law Attorney":        { dist: 0.15, income: 0.25, saturation: 0.20, demand: 0.25, season: 0.15 },
    "Digital Marketing Agency":   { dist: 0.10, income: 0.30, saturation: 0.20, demand: 0.25, season: 0.15 },
  };
  const w = nicheWeights[cat] || { dist: 0.25, income: 0.20, saturation: 0.20, demand: 0.20, season: 0.15 };

  // ── Analyze cities with seasonality + revenue ──
  const analyzed = useMemo(() => rawCities.map(c => {
    const maxDist = 50;
    const distScore = Math.max(0, 100 - (c.dist / maxDist) * 100);
    const incomeScore = Math.min(100, (c.income / 120000) * 100);
    const satScore = c.saturation === "Low" ? 90 : c.saturation === "Medium" ? 60 : 30;
    const demandScore = c.demand;
    const seasonScore = Math.min(100, currentSeasonMultiplier * 75);

    const viability = Math.round(
      distScore * w.dist + incomeScore * w.income + satScore * w.saturation +
      demandScore * w.demand + seasonScore * w.season
    );

    // Strategy assignment
    const strategy = c.clientPresence ? "DEFENDER"
      : viability >= 65 ? "ACELERAR"
      : "CONQUISTAR";

    // Estimated position (simulated from viability + saturation)
    const estPosition = c.clientPresence ? Math.ceil(Math.random() * 3)
      : c.saturation === "Low" ? Math.min(10, Math.ceil((100 - viability) / 8))
      : c.saturation === "Medium" ? Math.min(10, Math.ceil((100 - viability) / 6))
      : Math.min(10, Math.ceil((100 - viability) / 4));

    // Revenue estimation: searches × CTR by position × conversion rate × ticket × season multiplier
    const ctr = CTR_BY_POSITION[Math.min(estPosition, 10)] || 0.01;
    const monthlyRevenue = Math.round(
      revenueData.monthlySearches * ctr * revenueData.convRate * revenueData.avgTicket * currentSeasonMultiplier
    );

    // Opportunity score if improved to position 3
    const improvedCtr = CTR_BY_POSITION[3] || 0.15;
    const potentialRevenue = Math.round(
      revenueData.monthlySearches * improvedCtr * revenueData.convRate * revenueData.avgTicket * currentSeasonMultiplier
    );

    const revenueGap = potentialRevenue - monthlyRevenue;

    return {
      ...c, distScore: Math.round(distScore), incomeScore: Math.round(incomeScore),
      satScore, demandScore, seasonScore: Math.round(seasonScore), viability,
      strategy, estPosition, monthlyRevenue, potentialRevenue, revenueGap,
    };
  }), [cat, currentSeasonMultiplier]);

  // ── City × Service matrix (top 5 cities × all services) ──
  const matrix = useMemo(() => {
    const topCities = [...analyzed].sort((a, b) => b.viability - a.viability).slice(0, 8);
    return topCities.map(city => ({
      ...city,
      serviceScores: services.map(svc => {
        // Each service has a slightly different fit per city based on income + demand + season
        const svcIndex = services.indexOf(svc);
        const variance = ((svcIndex * 7 + city.pop) % 30) - 15; // deterministic variance
        const score = Math.max(20, Math.min(100, city.viability + variance));
        const svcSeasonMultiplier = currentSeasonMultiplier + ((svcIndex % 3) * 0.1 - 0.1);
        const svcRevenue = Math.round(
          revenueData.monthlySearches * 0.15 * revenueData.convRate * revenueData.avgTicket * svcSeasonMultiplier * (score / 100)
        );
        return { service: svc, score, revenue: svcRevenue };
      }),
    }));
  }, [analyzed, services, currentSeasonMultiplier]);

  // ── Golden combos (top city+service by revenue) ──
  const goldenCombos = useMemo(() => {
    const combos = [];
    matrix.forEach(city => {
      city.serviceScores.forEach(ss => {
        combos.push({
          city: city.city, state: city.state, dist: city.dist,
          service: ss.service, score: ss.score, revenue: ss.revenue,
          viability: city.viability, saturation: city.saturation, strategy: city.strategy,
        });
      });
    });
    return combos.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [matrix]);

  // ── Sorting & filtering ──
  const sorted = useMemo(() => {
    let list = [...analyzed];
    if (sortBy === "revenue") list.sort((a, b) => b.revenueGap - a.revenueGap);
    else if (sortBy === "viability") list.sort((a, b) => b.viability - a.viability);
    else if (sortBy === "distance") list.sort((a, b) => a.dist - b.dist);
    else if (sortBy === "income") list.sort((a, b) => b.income - a.income);

    if (filter === "defender") list = list.filter(c => c.strategy === "DEFENDER");
    else if (filter === "acelerar") list = list.filter(c => c.strategy === "ACELERAR");
    else if (filter === "conquistar") list = list.filter(c => c.strategy === "CONQUISTAR");
    return list;
  }, [analyzed, sortBy, filter]);

  // ── KPI totals ──
  const totalCurrentRevenue = analyzed.reduce((s, c) => s + c.monthlyRevenue, 0);
  const totalPotentialRevenue = analyzed.reduce((s, c) => s + c.potentialRevenue, 0);
  const totalGap = totalPotentialRevenue - totalCurrentRevenue;
  const defendCount = analyzed.filter(c => c.strategy === "DEFENDER").length;
  const acelerarCount = analyzed.filter(c => c.strategy === "ACELERAR").length;
  const conquistarCount = analyzed.filter(c => c.strategy === "CONQUISTAR").length;

  const diffColors = { Hard: C.red, Medium: C.yellow, Easy: C.green };
  const stratColors = { DEFENDER: C.blue, ACELERAR: C.green, CONQUISTAR: C.orange };

  // ── Seasonality chart data ──
  const seasonChartData = Array.from({ length: 12 }, (_, i) => ({
    month: MONTH_NAMES[i],
    multiplier: seasonData[i + 1] || 1.0,
    isCurrent: i + 1 === NOW_MONTH,
    isPeak: (seasonData.peakMonths || []).includes(i + 1),
    isLow: (seasonData.lowMonths || []).includes(i + 1),
  }));

  return (
    <div>
      <SectionTitle>Market Radar — {client.name}</SectionTitle>

      {/* Seasonality alert banner */}
      {currentSeasonMultiplier >= 1.1 && (
        <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>&#9650;</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
              Peak season for {cat} — demand {Math.round((currentSeasonMultiplier - 1) * 100)}% above average
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>
              Peak: {seasonData.peakLabel || "N/A"} | Now: {MONTH_NAMES[NOW_MONTH - 1]} (x{currentSeasonMultiplier.toFixed(2)})
            </div>
          </div>
        </div>
      )}
      {currentSeasonMultiplier <= 0.85 && (
        <div style={{ background: `${C.yellow}15`, border: `1px solid ${C.yellow}44`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>&#9660;</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.yellow }}>
              Low season for {cat} — demand {Math.round((1 - currentSeasonMultiplier) * 100)}% below average
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>
              Next peak: {seasonData.peakLabel || "N/A"} | Now: {MONTH_NAMES[NOW_MONTH - 1]} (x{currentSeasonMultiplier.toFixed(2)})
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Current Revenue/mo" value={`$${(totalCurrentRevenue / 1000).toFixed(1)}K`} color={C.cyan} />
        <StatCard label="Potential/mo" value={`$${(totalPotentialRevenue / 1000).toFixed(1)}K`} color={C.green} />
        <StatCard label="Revenue Gap" value={`+$${(totalGap / 1000).toFixed(1)}K`} color={C.yellow} />
        <StatCard label="Seasonality" value={`x${currentSeasonMultiplier.toFixed(2)}`} color={currentSeasonMultiplier >= 1.0 ? C.green : C.yellow} />
        <StatCard label="Cities" value={`${defendCount}D ${acelerarCount}A ${conquistarCount}C`} color={C.purple} />
      </div>

      {/* Strategy summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { key: "DEFENDER", count: defendCount, icon: "&#9632;", desc: "Maintain position — reviews + frequent posts" },
          { key: "ACELERAR", count: acelerarCount, icon: "&#9650;", desc: "Already appearing — best investment ROI" },
          { key: "CONQUISTAR", count: conquistarCount, icon: "&#9733;", desc: "Not appearing — landing page + service area" },
        ].map(s => (
          <div key={s.key} onClick={() => setFilter(filter === s.key.toLowerCase() ? "all" : s.key.toLowerCase())}
            style={{ background: filter === s.key.toLowerCase() ? `${stratColors[s.key]}15` : C.bgCard, border: `1px solid ${filter === s.key.toLowerCase() ? stratColors[s.key] + "55" : C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "all .2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: stratColors[s.key], letterSpacing: 1, textTransform: "uppercase" }}>{STRATEGY[s.key].label}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: stratColors[s.key] }}>{s.count}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textDim }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${view === v.id ? C.cyan : C.border}`, background: view === v.id ? `${C.cyan}22` : "transparent", color: view === v.id ? C.cyan : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ═══ VIEW: Territory (main table) ═══ */}
      {view === "territory" && (
        <>
          {/* Sort + filter controls */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Sort:</span>
            {[["revenue","Revenue"],["viability","Viability"],["distance","Distance"],["income","Income"]].map(([id, label]) => (
              <button key={id} onClick={() => setSortBy(id)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${sortBy === id ? C.blue : C.border}`, background: sortBy === id ? `${C.blue}22` : "transparent", color: sortBy === id ? C.blue : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{label}</button>
            ))}
          </div>

          {/* Table */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 46px 58px 58px 70px 70px 80px 80px", background: `${C.purple}15`, padding: "8px 12px", gap: 6, borderRadius: "8px 8px 0 0" }}>
              {["#", "City", "Dist", "Income", "Demand", "Strategy", "Position", "Revenue/mo", "Potential"].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: C.purple, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {sorted.map((c, i) => (
              <div key={`${c.city}-${c.state}`} onClick={() => setSelectedCity(selectedCity === c ? null : c)}
                style={{ display: "grid", gridTemplateColumns: "22px 1fr 46px 58px 58px 70px 70px 80px 80px", padding: "9px 12px", gap: 6, borderTop: `1px solid ${C.border}`, background: c.clientPresence ? `${C.blue}08` : selectedCity === c ? `${C.cyan}08` : i % 2 === 0 ? "transparent" : `${C.bgCard}80`, cursor: "pointer", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: c.clientPresence ? C.blue : C.text, fontWeight: c.clientPresence ? 700 : 400 }}>
                  {c.clientPresence ? "\u{1F4CD} " : ""}{c.city}, {c.state}
                </span>
                <span style={{ fontSize: 11, color: C.textMuted }}>{c.dist}mi</span>
                <span style={{ fontSize: 10, color: c.income >= 100000 ? C.green : c.income >= 70000 ? C.yellow : C.textMuted }}>${Math.round(c.income / 1000)}K</span>
                <span style={{ fontSize: 10, color: c.demand >= 85 ? C.green : c.demand >= 70 ? C.yellow : C.textMuted }}>{c.demand}%</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: stratColors[c.strategy], background: `${stratColors[c.strategy]}18`, borderRadius: 4, padding: "2px 6px", textAlign: "center" }}>{c.strategy}</span>
                <span style={{ fontSize: 10, color: c.estPosition <= 3 ? C.green : c.estPosition <= 7 ? C.yellow : C.red, fontWeight: 700, textAlign: "center" }}>#{c.estPosition}</span>
                <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace" }}>${c.monthlyRevenue.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: C.green, fontFamily: "monospace", fontWeight: 600 }}>${c.potentialRevenue.toLocaleString()}</span>
              </div>
            ))}
          </Card>

          {/* Selected city detail */}
          {selectedCity && (
            <Card style={{ border: `1px solid ${C.cyan}44`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{selectedCity.city}, {selectedCity.state}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                    <span style={{ color: stratColors[selectedCity.strategy], fontWeight: 700 }}>{STRATEGY[selectedCity.strategy].label}</span> — {STRATEGY[selectedCity.strategy].desc}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.green }}>${selectedCity.potentialRevenue.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>potential/mo</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  { l: "Distance", v: `${selectedCity.dist} mi`, c: selectedCity.dist <= 20 ? C.green : selectedCity.dist <= 35 ? C.yellow : C.red },
                  { l: "Avg Income", v: `$${Math.round(selectedCity.income/1000)}K`, c: selectedCity.income >= 100000 ? C.green : C.yellow },
                  { l: "Saturation", v: selectedCity.saturation, c: selectedCity.saturation === "Low" ? C.green : selectedCity.saturation === "Medium" ? C.yellow : C.red },
                  { l: "Est. Position", v: `#${selectedCity.estPosition}`, c: selectedCity.estPosition <= 3 ? C.green : selectedCity.estPosition <= 7 ? C.yellow : C.red },
                  { l: "Revenue Gap", v: `+$${selectedCity.revenueGap.toLocaleString()}`, c: C.yellow },
                ].map(m => (
                  <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>{m.l}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {onNavigate && (
                  <>
                    <button onClick={() => onNavigate("contentstudio")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.cyan}55`, background: `${C.cyan}15`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Generate Landing Page
                    </button>
                    <button onClick={() => onNavigate("competitor")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.purple}55`, background: `${C.purple}15`, color: C.purple, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      View Competitors
                    </button>
                    <button onClick={() => onNavigate("reports")} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.blue}55`, background: `${C.blue}15`, color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Include in Report
                    </button>
                  </>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ═══ VIEW: Matrix (City × Service) ═══ */}
      {view === "matrix" && (
        <Card style={{ marginBottom: 16, overflowX: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            City x Service Matrix — Opportunity Score
          </div>
          <div style={{ minWidth: services.length * 90 + 140 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${services.length}, 1fr)`, gap: 2, marginBottom: 2 }}>
              <div style={{ padding: 6, fontSize: 9, fontWeight: 700, color: C.purple }}>CITY</div>
              {services.map(s => (
                <div key={s} onClick={() => setSelectedService(selectedService === s ? null : s)}
                  style={{ padding: "6px 4px", fontSize: 8, fontWeight: 700, color: selectedService === s ? C.cyan : C.purple, textAlign: "center", cursor: "pointer", textTransform: "uppercase", background: selectedService === s ? `${C.cyan}15` : "transparent", borderRadius: 4 }}>
                  {s.length > 14 ? s.slice(0, 12) + ".." : s}
                </div>
              ))}
            </div>
            {/* Rows */}
            {matrix.map((city, ri) => (
              <div key={city.city} style={{ display: "grid", gridTemplateColumns: `140px repeat(${services.length}, 1fr)`, gap: 2, borderTop: `1px solid ${C.border}` }}>
                <div style={{ padding: "8px 6px", fontSize: 11, color: C.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  {city.clientPresence ? "\u{1F4CD}" : ""} {city.city}
                  <span style={{ fontSize: 8, color: stratColors[city.strategy], fontWeight: 700 }}>{city.strategy[0]}</span>
                </div>
                {city.serviceScores.map((ss, ci) => {
                  const bg = ss.score >= 75 ? `${C.green}25` : ss.score >= 55 ? `${C.yellow}20` : `${C.red}15`;
                  const tc = ss.score >= 75 ? C.green : ss.score >= 55 ? C.yellow : C.red;
                  return (
                    <div key={ss.service} style={{ padding: "6px 4px", textAlign: "center", background: selectedService === ss.service ? `${C.cyan}15` : bg, borderRadius: 2, cursor: "pointer" }}
                      title={`${city.city} × ${ss.service}: Score ${ss.score} | $${ss.revenue.toLocaleString()}/mo`}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: tc }}>{ss.score}</div>
                      <div style={{ fontSize: 8, color: C.textMuted }}>${ss.revenue.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: C.textMuted }}>
            Click a service to highlight the column | Hover to see details
          </div>
        </Card>
      )}

      {/* ═══ VIEW: Golden Combos ═══ */}
      {view === "golden" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Top 10 Golden Combos — Highest Estimated Revenue
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
            City + service combination sorted by estimated monthly revenue (seasonality: x{currentSeasonMultiplier.toFixed(2)})
          </div>
          {goldenCombos.map((combo, i) => (
            <div key={`${combo.city}-${combo.service}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i > 0 ? `1px solid ${C.border}` : "none", background: i === 0 ? `${C.green}08` : "transparent" }}>
              <div style={{ width: 28, textAlign: "center" }}>
                <span style={{ fontSize: i < 3 ? 16 : 12, fontWeight: 900, color: i === 0 ? C.green : i < 3 ? C.yellow : C.textMuted }}>
                  {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `#${i + 1}`}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  {combo.service} <span style={{ color: C.textMuted, fontWeight: 400 }}>in</span> {combo.city}, {combo.state}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: `${stratColors[combo.strategy]}18`, color: stratColors[combo.strategy], fontWeight: 700 }}>{combo.strategy}</span>
                  <span style={{ fontSize: 9, color: C.textMuted }}>{combo.dist}mi</span>
                  <span style={{ fontSize: 9, color: C.textMuted }}>Sat: {combo.saturation}</span>

                  <span style={{ fontSize: 9, color: C.textMuted }}>Score: {combo.score}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.green }}>${combo.revenue.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: C.textMuted }}>revenue/mo</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* ═══ VIEW: Seasonality ═══ */}
      {view === "season" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Seasonal Demand — {cat}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>
            Demand multiplier by month | Peak: {seasonData.peakLabel} | Low: {seasonData.lowLabel}
          </div>

          {/* Bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, marginBottom: 8 }}>
            {seasonChartData.map(d => {
              const height = Math.round((d.multiplier / 1.5) * 120);
              const barColor = d.isCurrent ? C.cyan : d.isPeak ? C.green : d.isLow ? C.red : C.blue;
              return (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, color: barColor, fontWeight: 700 }}>{d.multiplier.toFixed(2)}</span>
                  <div style={{ width: "100%", height, background: `${barColor}${d.isCurrent ? "55" : "33"}`, borderRadius: "4px 4px 0 0", border: d.isCurrent ? `2px solid ${C.cyan}` : "none", transition: "height .3s" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {seasonChartData.map(d => (
              <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: 9, color: d.isCurrent ? C.cyan : C.textMuted, fontWeight: d.isCurrent ? 700 : 400 }}>
                {d.month}
              </div>
            ))}
          </div>

          {/* Seasonal alerts */}
          <div style={{ marginTop: 20 }}>
            {seasonData.peakMonths && seasonData.peakMonths.some(m => m === NOW_MONTH + 1 || (NOW_MONTH === 12 && m === 1)) && (
              <Rec type="warn" text={`Peak demand in ${MONTH_NAMES[(NOW_MONTH) % 12]} — prepare landing pages and posts NOW to capture searches before the competition.`} />
            )}
            {seasonData.peakMonths && seasonData.peakMonths.includes(NOW_MONTH) && (
              <Rec type="ok" text={`You are AT PEAK demand. Maximize reviews, daily posts and recent work photos. Every day without posting is lost revenue.`} />
            )}
            {currentSeasonMultiplier < 0.9 && (
              <Rec type="tip" text={`Low season is the time to PREPARE: create territorial landing pages, accumulate reviews, optimize profile. When the peak arrives (${seasonData.peakLabel}), you will already be positioned.`} />
            )}
            <Rec type="tip" text={`Niche services: ${services.join(", ")}. Each service has its own micro-seasonality — use the Content Generator for specific posts.`} />
          </div>
        </Card>
      )}

      {/* Strategy footer */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Territorial Strategy — Market Radar</div>
        <Rec type="ok" text={`${acelerarCount} cities in the ACELERAR zone — best ROI. Prioritize territorial pages for these.`} />
        <Rec type="tip" text={`Total revenue gap: +$${(totalGap / 1000).toFixed(1)}K/mo if all cities reach top 3.`} />
        <Rec type="tip" text={`Current seasonality: x${currentSeasonMultiplier.toFixed(2)} — ${currentSeasonMultiplier >= 1.0 ? "take advantage of the moment" : "prepare for the next peak"}.`} />
        <Rec type="warn" text="Data based on market estimates. Actual revenue depends on client website/phone conversion." />
      </Card>
    </div>
  );
}
