"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { C, sc } from "./constants/colors";
import { CLIENTS as MOCK_CLIENTS } from "./constants/clients";
import { getNav } from "./constants/nav";
import { ScoreDonut, MiniBar } from "./shared";
import { useLang } from "./contexts/LangContext";
import { calcScores, calcSemantic, calcSemanticAlignment } from "./utils/scoring";
import { WeeklyDigest, Overview, ScoreHistory, ImpactSimulator } from "./overview";
import { ReviewIntelligence } from "./analysis";
import { ProfileHub } from "./profile";
import { BulkActions, SeasonalityTab, LSAModule } from "./tools";
import { AIChatAgent } from "./ai";
import { SemanticEngine, NAPIntelligence, CompetitorRadar } from "./intelligence";
import { ComplianceCenter, RescueCenter } from "./protection";
import { ContentStudio } from "./action";
import { ReportsHub } from "./commandcenter";

export default function Dashboard({ user, onBack, onLogout, clients: clientsProp }) {
  const CLIENTS = clientsProp || MOCK_CLIENTS;
  const initClient = user?.selectedClient || CLIENTS[0];
  const [activeTab, setActiveTab] = useState("brain");
  const [selectedClient, setSelectedClient] = useState(initClient);
  const [collapsed, setCollapsed] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { lang, setLang, t } = useLang();
  const navGroups = getNav(t);

  // trocar cliente mantém aba atual
  const handleClientChange = useCallback((id) => {
    const c = CLIENTS.find(c => String(c.id) === String(id));
    if (c) setSelectedClient(c);
  }, []);

  // Build full data object for scoring/AI panels
  const clientData = useMemo(() => ({
    ...selectedClient,
    businessName: selectedClient.businessName || selectedClient.name,
  }), [selectedClient]);
  const scores = useMemo(() => calcScores(clientData), [clientData]);
  const semantic = useMemo(() => calcSemantic(clientData), [clientData]);
  const semanticAlignment = useMemo(() => calcSemanticAlignment(clientData), [clientData]);
  // Cross-client urgency count — drives the sidebar badge on Attention Required
  const urgentCount = useMemo(() => CLIENTS.filter(p => {
    const s = calcScores(p);
    const sm = calcSemantic(p);
    const sa = calcSemanticAlignment(p);
    const lp = p.posts?.[0]?.date ? Math.floor((new Date() - new Date(p.posts[0].date)) / 86400000) : 999;
    return (p.reviews?.negativeUnanswered || 0) > 0 || lp === 999 || s.overall < 40 || !p.verified || sm.score < 35 || (sa.score > 0 && sa.score < 30);
  }).length, [CLIENTS]);

  // Normalize client so old tabs (expecting flat fields) and new scoring (expecting .reviews.total) both work
  const normalizedClient = {
    ...selectedClient,
    name: selectedClient.name || selectedClient.businessName,
    businessName: selectedClient.businessName || selectedClient.name,
    city: selectedClient.city || selectedClient.address?.split(",")[0]?.trim() || "",
    // flat fields for old tabs
    reviews: selectedClient.reviews?.total ?? selectedClient.reviews ?? 0,
    rating: selectedClient.reviews?.average ?? selectedClient.rating ?? 0,
    score: scores.overall,
    // keep nested for new components
    reviewsData: selectedClient.reviews,
    scoresData: scores,
    semanticData: semantic,
    semanticAlignmentData: semanticAlignment,
  };


  // Smart Alerts — computed from real data
  const lp_ = selectedClient.posts?.[0]?.date ? Math.floor((new Date() - new Date(selectedClient.posts[0].date)) / 86400000) : 999;
  const negUnans_ = selectedClient.reviews?.negativeUnanswered || 0;
  const photosOld_ = selectedClient.photos?.lastUpload ? Math.floor((new Date() - new Date(selectedClient.photos.lastUpload)) / 86400000) : 999;

  const smartAlerts = [];
  if (negUnans_ > 0) smartAlerts.push({ level: "critical", text: t.alertNegReviews(negUnans_), tab: "reviewintel", icon: "🚨" });
  if (lp_ > 14 && lp_ < 999) smartAlerts.push({ level: "high", text: t.alertLastPost(lp_), tab: "profilehub", icon: "📢" });
  if (lp_ === 999) smartAlerts.push({ level: "critical", text: t.alertNoPost, tab: "profilehub", icon: "📢" });
  if (scores.overall < 50) smartAlerts.push({ level: "high", text: t.alertScoreCritical(scores.overall), tab: "overview", icon: "📊" });
  if (semantic.score < 40) smartAlerts.push({ level: "high", text: t.alertAILow(semantic.score), tab: "semantic", icon: "🧠" });
  if ((selectedClient.photos?.total || 0) < 10) smartAlerts.push({ level: "medium", text: t.alertFewPhotos(selectedClient.photos?.total || 0), tab: "profilehub", icon: "📸" });
  if (photosOld_ > 90) smartAlerts.push({ level: "medium", text: t.alertOldPhoto(photosOld_), tab: "profilehub", icon: "📸" });
  if ((selectedClient.reviews?.last30days || 0) === 0) smartAlerts.push({ level: "medium", text: t.alertZeroReviews, tab: "reviewintel", icon: "⭐" });
  if (!selectedClient.website) smartAlerts.push({ level: "medium", text: t.alertNoWebsite, tab: "profilehub", icon: "🌐" });
  if (semanticAlignment.score > 0 && semanticAlignment.score < 40) smartAlerts.push({ level: "high", text: t.alertSemanticLow(semanticAlignment.score, semanticAlignment.gaps), tab: "semantic", icon: "◐" });
  if (scores.overall >= 80 && semantic.score >= 70) smartAlerts.push({ level: "ok", text: t.alertExcellent, tab: "brain", icon: "✅" });

  const criticalCount = smartAlerts.filter(a => a.level === "critical" || a.level === "high").length;
  const alertColor = { critical: C.red, high: C.orange, medium: C.yellow, ok: C.green };

  const selectClient = (p) => { setSelectedClient(p); setActiveTab("brain"); };

  const renderTab = () => {
    const props = { client: normalizedClient, onNavigate: setActiveTab, t };
    switch (activeTab) {
      // ── COMMAND CENTER ──
      case "brain":       return <WeeklyDigest {...props} allClients={CLIENTS} onSelectClient={(p) => { setSelectedClient(p); }} />;
      case "overview":    return <Overview {...props} />;
      case "attention":   return <RescueCenter {...props} allClients={CLIENTS} onSelectClient={selectClient} />;
      case "reports":     return <ReportsHub {...props} allClients={CLIENTS} onSelectClient={selectClient} />;

      // ── INTELLIGENCE ──
      case "semantic":    return <SemanticEngine {...props} />;
      case "nap":         return <NAPIntelligence {...props} allClients={CLIENTS} />;
      case "competitor":  return <CompetitorRadar {...props} />;
      case "reviewintel": return <ReviewIntelligence {...props} />;

      // ── PROTECTION ──
      case "rescue":      return <RescueCenter {...props} allClients={CLIENTS} onSelectClient={selectClient} />;
      case "compliance":  return <ComplianceCenter {...props} />;

      // ── PROFILE ──
      case "profilehub":
      case "description":
      case "photos":
      case "posts":
      case "reviews":
      case "info":
      case "optimize":    return <ProfileHub {...props} initialTab={activeTab === "profilehub" ? "description" : activeTab} />;

      // ── ACTION ──
      case "contentstudio": return <ContentStudio {...props} />;
      case "bulkactions":   return <BulkActions {...props} allClients={CLIENTS} />;
      case "lsa":           return <LSAModule {...props} />;

      // ── Extras ──
      case "seasonal":    return <SeasonalityTab {...props} />;
      case "history":     return <ScoreHistory {...props} />;
      case "insights":    return <ImpactSimulator {...props} allClients={CLIENTS} />;
      case "response":    return <ProfileHub {...props} initialTab="reviews" />;

      // ── Legacy aliases ──
      case "weekly":      return <WeeklyDigest {...props} allClients={CLIENTS} onSelectClient={(p) => { setSelectedClient(p); }} />;
      case "aimode":      return <SemanticEngine {...props} />;
      case "napsuite":    return <NAPIntelligence {...props} allClients={CLIENTS} />;
      case "napmaster":   return <NAPIntelligence {...props} allClients={CLIENTS} />;
      case "compete":     return <CompetitorRadar {...props} />;
      case "competitors": return <CompetitorRadar {...props} />;
      case "competitive": return <CompetitorRadar {...props} />;
      case "cities":      return <CompetitorRadar {...props} />;
      case "spamdetect":  return <ComplianceCenter {...props} />;
      case "shadowedit":  return <ComplianceCenter {...props} />;
      case "predictive":  return <RescueCenter {...props} allClients={CLIENTS} onSelectClient={selectClient} />;
      case "portfolio":   return <ReportsHub {...props} allClients={CLIENTS} onSelectClient={selectClient} />;
      case "presentation": return <ReportsHub {...props} allClients={CLIENTS} onSelectClient={selectClient} />;
      case "contentgen":  return <ContentStudio {...props} />;
      case "citations":   return <ContentStudio {...props} />;
      case "roi":         return <ImpactSimulator {...props} allClients={CLIENTS} />;
      case "impact":      return <ImpactSimulator {...props} allClients={CLIENTS} />;
      case "entropy":     return <SemanticEngine {...props} />;
      case "semanticgap": return <SemanticEngine {...props} />;
      case "triangulation": return <SemanticEngine {...props} />;
      case "ecosystem":   return <NAPIntelligence {...props} allClients={CLIENTS} />;
      case "rankestimator": return <CompetitorRadar {...props} />;
      default:            return <WeeklyDigest {...props} allClients={CLIENTS} onSelectClient={(p) => { setSelectedClient(p); }} />;
    }
  };

  // Collapsible group state — each group can be open/closed
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    navGroups.forEach(g => { initial[g.label] = false; });
    const activeG = navGroups.find(g => g.items.some(i => i.id === "brain"));
    if (activeG) initial[activeG.label] = true;
    return initial;
  });
  const toggleGroup = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  // Auto-open the group that contains the active tab on tab change
  const activeGroup = navGroups.find(g => g.items.some(i => i.id === activeTab));
  const [prevTab, setPrevTab] = useState(activeTab);
  if (activeTab !== prevTab) {
    setPrevTab(activeTab);
    if (activeGroup && !openGroups[activeGroup.label]) {
      const next = {};
      navGroups.forEach(g => { next[g.label] = false; });
      next[activeGroup.label] = true;
      setOpenGroups(next);
    }
  }

  const scoreColor = normalizedClient.score >= 80 ? C.green : normalizedClient.score >= 50 ? C.yellow : C.red;
  const SW = collapsed ? 52 : 216;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden", fontFamily: "'Space Grotesk', system-ui" }}>
      {/* Mobile overlay */}
      <div className="z-overlay" onClick={() => setSidebarOpen(false)}
        style={{ display: "none", position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} />

      {/* ═══ SIDEBAR ═══ */}
      <div className={"z-sidebar" + (sidebarOpen ? " open" : "")}
        style={{ width: SW, flexShrink: 0, borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", transition: "width 0.2s ease", background: C.bgCard, overflow: "hidden", zIndex: 100 }}>

        {/* Logo bar */}
        <div style={{ padding: collapsed ? "14px 0" : "14px 12px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minHeight: 54 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 12, flexShrink: 0, margin: collapsed ? "0 auto" : "0", fontFamily: "var(--font-zenith), 'Orbitron', sans-serif" }}>Z</div>
          {!collapsed && (
            <>
              <span style={{ fontWeight: 900, fontSize: 15, color: C.text, whiteSpace: "nowrap", flex: 1, fontFamily: "var(--font-zenith), 'Orbitron', sans-serif", letterSpacing: 3, background: "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ZENITH</span>
              {onBack && <button onClick={onBack} style={{ background: C.blue + "18", border: "1px solid " + C.blue + "33", borderRadius: 5, color: C.blue, cursor: "pointer", fontSize: 9, fontWeight: 700, padding: "3px 6px", whiteSpace: "nowrap" }}>Agency</button>}
            </>
          )}
        </div>

        {/* Client selector */}
        {!collapsed && (
          <div style={{ padding: "10px 12px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5, textTransform: "uppercase" }}>{t.client}</div>
            <select value={selectedClient.id} onChange={e => handleClientChange(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", background: C.bg, border: "1px solid " + C.border, borderRadius: 6, color: C.text, fontSize: 12, outline: "none", cursor: "pointer" }}>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.businessName || c.name}</option>)}
            </select>
            {/* Score mini bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: C.textMuted }}>{t.gbpScore}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor }}>{normalizedClient.score}</span>
            </div>
            <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: normalizedClient.score + "%", height: "100%", background: scoreColor, transition: "width 0.4s" }} />
            </div>
          </div>
        )}

        {/* Navigation — collapsible groups */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {navGroups.map(group => {
            const isOpen = openGroups[group.label];
            const hasActive = group.items.some(i => i.id === activeTab);
            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                {/* Group header */}
                <button className="group-header" onClick={() => !collapsed && toggleGroup(group.label)}
                  style={{ width: "100%", padding: collapsed ? "8px 0" : "6px 8px", borderRadius: 6, border: "none", background: hasActive ? C.blue + "0d" : "transparent", color: hasActive ? C.blue : C.textMuted, display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: collapsed ? 0 : 0.8, textTransform: "uppercase", transition: "all 0.15s", justifyContent: collapsed ? "center" : "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{group.icon}</span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
                      <span style={{ fontSize: 10, color: C.textMuted, transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    </>
                  )}
                </button>

                {/* Group items */}
                {(isOpen || collapsed) && (
                  <div style={{ marginTop: 1, marginBottom: 2 }}>
                    {group.items.map(item => {
                      const active = activeTab === item.id;
                      return (
                        <button key={item.id} className="nav-item" onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                          style={{ width: "100%", padding: collapsed ? "8px 0" : "6px 10px 6px 20px", borderRadius: 5, border: "none", background: active ? C.blue + "18" : "transparent", color: active ? C.blue : C.textDim, fontWeight: active ? 600 : 400, fontSize: 12, textAlign: collapsed ? "center" : "left", cursor: "pointer", transition: "all 0.12s", display: "flex", alignItems: "center", gap: 7, borderLeft: active ? "2px solid " + C.blue : "2px solid transparent", marginBottom: 1 }}>
                          <span style={{ fontSize: 12, opacity: 0.8, flexShrink: 0 }}>{item.icon}</span>
                          {!collapsed && (
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                            {item.label}
                            {item.id === "attention" && urgentCount > 0 && (
                              <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, padding: "1px 5px", borderRadius: 10, flexShrink: 0, lineHeight: "14px" }}>{urgentCount}</span>
                            )}
                          </span>
                        )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid " + C.border, flexShrink: 0 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", padding: "6px 0", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {collapsed ? "→" : "← Collapse"}
          </button>
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── TOPBAR ── */}
        <div className="z-topbar" style={{ height: 52, borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", flexShrink: 0, background: C.bgCard }}>

          {/* Left: hamburger (mobile) + client + tab breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {/* Mobile hamburger */}
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}
              style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ☰
            </button>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{normalizedClient.name}</span>
            <span className="hide-mobile" style={{ color: C.border, fontSize: 14 }}>/</span>
            <span className="hide-mobile" style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
              {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "Dashboard"}
            </span>
          </div>

          {/* Right: score + alerts + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

            {/* Score pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: scoreColor + "15", borderRadius: 20, border: "1px solid " + scoreColor + "33" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: scoreColor }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{normalizedClient.score}</span>
            </div>

            {/* Rating */}
            <span style={{ fontSize: 12, color: C.textMuted }}>{normalizedClient.rating} ★</span>

            {/* Alerts bell */}
            <div style={{ position: "relative" }}>
              <button className="topbar-btn" onClick={() => setAlertsOpen(o => !o)}
                style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid " + (criticalCount > 0 ? C.red + "44" : C.border), background: criticalCount > 0 ? C.red + "0d" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, position: "relative", transition: "all 0.15s" }}>
                🔔
                {criticalCount > 0 && <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{criticalCount}</div>}
              </button>

              {alertsOpen && (
                <div style={{ position: "absolute", top: 38, right: 0, width: 300, background: C.bgCard, border: "1px solid " + C.border, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Alerts</span>
                    <button onClick={() => setAlertsOpen(false)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                  <div style={{ maxHeight: 280, overflowY: "auto" }}>
                    {smartAlerts.map((a, i) => (
                      <div key={i} className="alert-item" onClick={() => { setActiveTab(a.tab); setAlertsOpen(false); }}
                        style={{ display: "flex", gap: 10, padding: "9px 14px", borderBottom: "1px solid " + C.border, cursor: "pointer", transition: "background 0.12s" }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{a.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{a.text}</div>
                          <div style={{ fontSize: 10, color: alertColor[a.level], fontWeight: 700, marginTop: 2, textTransform: "uppercase" }}>{a.level}</div>
                        </div>
                        <span style={{ fontSize: 10, color: C.cyan, flexShrink: 0, alignSelf: "center" }}>→</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + Logout */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <button onClick={() => setShowUserMenu(v => !v)} style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 12, cursor: "pointer", flexShrink: 0, border: "none" }}>
                {(user?.name || "U")[0].toUpperCase()}
              </button>
              {showUserMenu && (
                <div style={{ position: "absolute", top: 38, right: 0, width: 200, background: C.bgCard, border: "1px solid " + C.border, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.border }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{user?.name || "User"}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{user?.email || ""}</div>
                    {user?.demo && <div style={{ fontSize: 9, color: C.yellow, fontWeight: 700, marginTop: 4 }}>DEMO MODE</div>}
                  </div>
                  {onBack && <button onClick={() => { setShowUserMenu(false); onBack(); }} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid " + C.border, color: C.textDim, fontSize: 12, textAlign: "left", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.bgHover} onMouseLeave={e => e.currentTarget.style.background = "none"}>Agency Dashboard</button>}
                  {onLogout && <button onClick={() => { setShowUserMenu(false); onLogout(); }} style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: C.red, fontSize: 12, fontWeight: 600, textAlign: "left", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = C.bgHover} onMouseLeave={e => e.currentTarget.style.background = "none"}>Sign Out</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="z-content" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {renderTab()}
        </div>
      </div>

      {/* AI Chat Agent */}
      <AIChatAgent data={clientData} scores={scores} semantic={semantic} />
    </div>
  );
}
