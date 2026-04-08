"use client";
import { C } from "../constants/colors";
import { Card, Badge, ProgressBar } from "../shared";

export default function InfoTab({ client }) {
  const fields = [
    { label: "Business Name", value: client.name, ok: !!client.name },
    { label: "Primary Category", value: client.category, ok: !!client.category },
    { label: "Secondary Categories", value: (client.secondaryCategories || []).join(", ") || "None", ok: (client.secondaryCategories || []).length > 0 },
    { label: "Address", value: client.address, ok: !!client.address },
    { label: "Phone", value: client.phone, ok: !!client.phone },
    { label: "Website", value: client.website || "Not filled in", ok: !!client.website },
    { label: "Filled Attributes", value: `${client.attributes || 0} attributes`, ok: (client.attributes || 0) >= 8 },
    { label: "Listed Services", value: `${(client.services || []).length} services`, ok: (client.services || []).length >= 5 },
    { label: "Google Verified", value: client.verified ? "✓ Verified" : "✗ Not verified", ok: !!client.verified },
  ];

  // Niche-specific attributes
  const nicheAttrs = {
    "Home Renovation Contractor": ["Google Guaranteed", "Licensed & Insured", "Free Estimates", "Senior Discount", "Emergency Service", "Financing Available", "Family Owned", "Veteran Owned"],
    "Dentist": ["Accepts Insurance", "New Patients Welcome", "Same-Day Emergency", "Sedation Dentistry", "LGBTQ+ Friendly", "Wheelchair Accessible", "Evening Appointments", "Online Booking"],
    "HVAC Contractor": ["24/7 Emergency", "NATE Certified", "Energy Star Partner", "Licensed & Insured", "Free Estimates", "Senior Discount", "Financing Available", "Same-Day Service"],
    "Plumber": ["24/7 Emergency", "Licensed & Insured", "Free Estimates", "Same-Day Service", "Upfront Pricing", "Veteran Owned", "Senior Discount", "Financing Available"],
    "Family Law Attorney": ["Free Consultation", "Bilingual Staff", "Flexible Payment Plans", "Weekend Appointments", "Virtual Consultations", "Serving All of Florida", "20+ Years Experience", "Mediation Services"],
    "Digital Marketing Agency": ["Google Partner", "Free Audit", "Results Guaranteed", "Dedicated Account Manager", "Monthly Reporting", "Local SEO Certified", "Remote Services", "No Long-Term Contracts"],
  };

  const defaultAttrs = ["Licensed & Insured", "Free Estimates", "Senior Discount", "Emergency Service", "Financing Available", "Family Owned", "Online Quotes", "Veteran Owned"];
  const attrs = nicheAttrs[client.category] || defaultAttrs;
  const filledAttrs = attrs.slice(0, client.attributes || 0);
  const missingAttrs = attrs.slice(client.attributes || 0);

  // Completeness checklist (dynamic)
  const completeness = [
    { label: "Basic Info (name, address, phone)", ok: !!(client.name && client.address && client.phone) },
    { label: "Website filled in", ok: !!client.website },
    { label: "Business Hours", ok: !!client.hours?.filled },
    { label: "Secondary Categories (1+)", ok: (client.secondaryCategories || []).length > 0 },
    { label: "Detailed Services (5+)", ok: (client.services || []).length >= 5 },
    { label: "Special Attributes (8+)", ok: (client.attributes || 0) >= 8 },
    { label: "Google Verified", ok: !!client.verified },
    { label: "Special Hours configured", ok: false },
    { label: "Owner photos added", ok: (client.photos?.team || 0) > 0 },
    { label: "Individual service descriptions", ok: (client.services || []).length >= 5 },
    { label: "Auto-edited category alert verified", ok: false },
  ];

  const score = Math.round((completeness.filter(c => c.ok).length / completeness.length) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Profile Information — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { const nap = (client.name || "") + "\n" + (client.address || "") + "\n" + (client.phone || ""); navigator.clipboard?.writeText(nap).catch(()=>{}); }} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.green + "44", background: C.green + "15", color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📋 Copiar NAP</button>
          {client.website && <a href={client.website} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.border, background: "transparent", color: C.cyan, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>🌐 Open Website →</a>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Profile Data</div>
            {fields.map(f => (
              <div key={f.label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <span style={{ color: f.ok ? C.green : C.red, fontWeight: 700, flexShrink: 0, fontSize: 13 }}>{f.ok ? "✓" : "✗"}</span>
                <div style={{ width: 190, fontSize: 12, color: C.textMuted, flexShrink: 0 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: f.ok ? C.text : C.red }}>{f.value}</div>
              </div>
            ))}
          </Card>

          {/* Attributes */}
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>GBP Attributes — {client.category}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Each attribute is a potential query match. Goal: 8+ attributes filled in.</div>
            {filledAttrs.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6 }}>✓ FILLED ({filledAttrs.length})</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {filledAttrs.map(a => <Badge key={a} label={a} color={C.green} />)}
                </div>
              </div>
            )}
            {missingAttrs.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 6 }}>✗ MISSING ({missingAttrs.length}) — add to GBP</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {missingAttrs.map(a => <Badge key={a} label={a} color={C.red} />)}
                </div>
              </div>
            )}
          </Card>

          {/* Services */}
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Listed Services ({(client.services || []).length})</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(client.services || []).map(s => <Badge key={s} label={s} color={C.blue} />)}
            </div>
            {(client.services || []).length < 5 && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.red }}>⚠ Add more services — each service creates a separate embedding in Google's index</div>
            )}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ border: `1px solid ${score >= 80 ? C.green : C.yellow}33` }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Profile Completeness</div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: score >= 80 ? C.green : score >= 60 ? C.yellow : C.red }}>{score}%</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>complete</div>
            </div>
            <ProgressBar value={score} color={score >= 80 ? C.green : score >= 60 ? C.yellow : C.red} />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {completeness.map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: c.ok ? C.green : C.red, fontWeight: 700, flexShrink: 0, fontSize: 12 }}>{c.ok ? "✓" : "✗"}</span>
                  <span style={{ fontSize: 11, color: c.ok ? C.textDim : C.textMuted, lineHeight: 1.4 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Auto-category alert */}
          <Card style={{ border: `1px solid ${C.yellow}33` }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: C.yellow, marginBottom: 8 }}>⚠ Alert: Google Auto-Edits Categories</div>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
              Google can change your primary category without notification. Check weekly whether the category is still <strong style={{ color: C.text }}>{client.category}</strong>.
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: C.yellow }}>Current category: <strong>{client.category}</strong></div>
          </Card>
        </div>
      </div>
    </div>
  );
}

