"use client";
import { useState, useMemo } from "react";
import { C } from "../constants/colors";
import { Card, Badge, StatCard, TabBar } from "../shared";

/**
 * LSA Module — Local Services Ads Monitor
 * Tracks Google Guaranteed / Screened status, lead quality, budget pacing, and competitor LSA presence.
 */

const LSA_CATEGORIES = {
  "Home Renovation Contractor": { eligible: true, type: "Google Guaranteed", leadCost: "$25-65", avgLeads: "15-40/mo" },
  "Plumber": { eligible: true, type: "Google Guaranteed", leadCost: "$15-45", avgLeads: "20-60/mo" },
  "HVAC Contractor": { eligible: true, type: "Google Guaranteed", leadCost: "$20-55", avgLeads: "15-50/mo" },
  "Electrician": { eligible: true, type: "Google Guaranteed", leadCost: "$18-50", avgLeads: "15-45/mo" },
  "Landscaping Company": { eligible: true, type: "Google Guaranteed", leadCost: "$12-35", avgLeads: "20-50/mo" },
  "Family Law Attorney": { eligible: true, type: "Google Screened", leadCost: "$75-200", avgLeads: "5-20/mo" },
  "Dentist": { eligible: true, type: "Google Screened", leadCost: "$30-80", avgLeads: "10-30/mo" },
  "Car Detailing Service": { eligible: false, type: "Not eligible", leadCost: "N/A", avgLeads: "N/A" },
  "Digital Marketing Agency": { eligible: false, type: "Not eligible", leadCost: "N/A", avgLeads: "N/A" },
  "IT Services & Computer Repair": { eligible: false, type: "Not eligible", leadCost: "N/A", avgLeads: "N/A" },
};

export default function LSAModule({ client }) {
  const [activeTab, setActiveTab] = useState("overview");
  const category = client.category || "";
  const city = client.city || "";
  const seed = String(client.id || "1").split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const lsaConfig = LSA_CATEGORIES[category] || { eligible: false, type: "Unknown", leadCost: "N/A", avgLeads: "N/A" };

  // Simulated LSA data
  const lsaData = useMemo(() => {
    if (!lsaConfig.eligible) return null;
    const isActive = (seed % 3) !== 0;
    const weeklyBudget = 200 + (seed % 300);
    const spent = isActive ? Math.round(weeklyBudget * (0.4 + (seed % 40) / 100)) : 0;
    const leads = isActive ? 3 + (seed % 12) : 0;
    const answered = isActive ? Math.max(0, leads - (seed % 3)) : 0;
    const booked = isActive ? Math.max(0, answered - (seed % 4)) : 0;
    const compCount = 2 + (seed % 5);

    return { isActive, weeklyBudget, spent, leads, answered, booked, compCount, responseRate: leads > 0 ? Math.round((answered / leads) * 100) : 0, bookingRate: answered > 0 ? Math.round((booked / answered) * 100) : 0 };
  }, [seed, lsaConfig.eligible]);

  // Competitor LSA data
  const competitors = useMemo(() => {
    if (!lsaConfig.eligible) return [];
    return Array.from({ length: lsaData?.compCount || 3 }, (_, i) => {
      const cseed = seed + i * 41;
      return {
        name: [`${city} ${category.split(" ")[0]} Pros`, `Quality ${category.split(" ")[0]}`, `Fast ${category.split(" ")[0]} ${city}`, `${city} Premier`, `Reliable Service Co`][i % 5],
        badge: lsaConfig.type,
        reviews: 30 + (cseed % 200),
        rating: [4.5, 4.7, 4.8, 4.9, 5.0][cseed % 5],
        yearsInBusiness: 3 + (cseed % 15),
        responseTime: ["< 1 hour", "< 2 hours", "< 4 hours", "Same day", "Next day"][cseed % 5],
      };
    });
  }, [seed, city, category, lsaConfig, lsaData]);

  if (!lsaConfig.eligible) {
    return (
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>LSA — {client.name}</div>
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.yellow, marginBottom: 8 }}>LSA Not Available</div>
          <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 400, margin: "0 auto" }}>
            "{category}" is not currently eligible for Google Local Services Ads. LSA is available for home services, legal, healthcare, and select professional services.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>LSA — {client.name}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Local Services Ads — {lsaConfig.type}</div>
        </div>
        <Badge label={lsaData?.isActive ? "ACTIVE" : "INACTIVE"} color={lsaData?.isActive ? C.green : C.red} />
      </div>

      <TabBar tabs={[{ id: "overview", label: "Overview" }, { id: "leads", label: "Lead Quality" }, { id: "competitors", label: "LSA Competitors" }]} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            <StatCard label="Weekly Budget" value={"$" + lsaData.weeklyBudget} color={C.blue} />
            <StatCard label="Spent" value={"$" + lsaData.spent} color={lsaData.spent > lsaData.weeklyBudget * 0.8 ? C.orange : C.green} />
            <StatCard label="Leads" value={lsaData.leads} color={lsaData.leads > 0 ? C.cyan : C.red} />
            <StatCard label="Booked" value={lsaData.booked} color={lsaData.booked > 0 ? C.green : C.red} />
          </div>

          {/* Status cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <Card style={{ border: "1px solid " + (lsaData.isActive ? C.green : C.red) + "33" }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{lsaConfig.type} Status</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: (lsaData.isActive ? C.green : C.red) + "10", borderRadius: 8 }}>
                <span style={{ fontSize: 24 }}>{lsaData.isActive ? "✅" : "❌"}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: lsaData.isActive ? C.green : C.red }}>{lsaData.isActive ? "Active & Running" : "Not Active"}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                    {lsaData.isActive ? "Ads showing in Local Services results" : "Set up LSA in Google Ads to start receiving leads"}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Category Benchmarks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>Avg Cost per Lead</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{lsaConfig.leadCost}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>Typical Lead Volume</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{lsaConfig.avgLeads}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: C.textMuted }}>Badge Type</span>
                  <span style={{ color: C.green, fontWeight: 600 }}>{lsaConfig.type}</span>
                </div>
              </div>
            </Card>
          </div>

          {!lsaData.isActive && (
            <Card style={{ border: "1px solid " + C.blue + "33" }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: C.blue }}>🚀 How to Get Started with LSA</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.textDim }}>
                {[
                  "1. Go to ads.google.com/local-services-ads",
                  "2. Complete business verification (license, insurance, background check)",
                  "3. Set weekly budget and service areas",
                  "4. Enable messaging and phone tracking",
                  "5. Respond to leads within 5 minutes for best ranking",
                ].map(step => <div key={step}>{step}</div>)}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "leads" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            <StatCard label="Response Rate" value={lsaData.responseRate + "%"} color={lsaData.responseRate >= 80 ? C.green : C.orange} />
            <StatCard label="Booking Rate" value={lsaData.bookingRate + "%"} color={lsaData.bookingRate >= 50 ? C.green : C.yellow} />
            <StatCard label="LSA Competitors" value={lsaData.compCount} color={C.cyan} />
          </div>

          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Lead Quality Optimization</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { tip: "Respond to every lead within 5 minutes — first responder wins 78% of the time", impact: "HIGH", color: C.red },
                { tip: "Mark irrelevant leads as 'Not a lead' to train Google's algorithm", impact: "HIGH", color: C.red },
                { tip: "Request reviews from LSA customers — LSA reviews boost ranking", impact: "MEDIUM", color: C.yellow },
                { tip: "Keep business hours updated — leads outside hours lower response rate", impact: "MEDIUM", color: C.yellow },
                { tip: "Add all service types accurately — prevents irrelevant leads", impact: "LOW", color: C.textMuted },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: C.bg, border: "1px solid " + C.border, borderRadius: 8 }}>
                  <Badge label={item.impact} color={item.color} />
                  <span style={{ fontSize: 12, color: C.textDim, flex: 1 }}>{item.tip}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "competitors" && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>LSA Competitors — {category} in {city}</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Businesses showing in Local Services Ads for your category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {competitors.map((comp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bg, border: "1px solid " + C.border, borderRadius: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.green + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: C.green, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{comp.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{comp.reviews} reviews · {comp.rating}★ · {comp.yearsInBusiness}yr · Response: {comp.responseTime}</div>
                </div>
                <Badge label={comp.badge} color={C.green} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
