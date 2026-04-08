"use client";
import { C } from "../constants/colors";
import { Card, ProgressBar, StatCard } from "../shared";
import { AIAnalysisPanel } from "../ai";

export default function PhotosTab({ client }) {
  const photos = client.photos || {};
  const total = photos.total || 0;
  const lastUploadDays = photos.lastUpload ? Math.floor((new Date() - new Date(photos.lastUpload)) / 86400000) : 999;

  // Real breakdown from client data
  const types = [
    { label: "Work / Services", count: photos.work || 0, rec: 15, tip: "Show service in action — Google AI validates context" },
    { label: "Interior", count: photos.interior || 0, rec: 8, tip: "Clean and well-lit environment conveys trust" },
    { label: "Exterior / Facade", count: photos.exterior || 0, rec: 8, tip: "Visible signage and landmarks improve location_score" },
    { label: "Team / Staff", count: photos.team || 0, rec: 5, tip: "Real people create connection and validate E-E-A-T — entity signal" },
  ];

  // Niche-specific recommendations
  const nichePhotoRecs = {
    "Home Renovation Contractor": ["Before/after of renovation — highest conversion impact", "Photos of materials and finishes — proof of quality", "Team working on-site — humanizes the company"],
    "Dentist": ["Clean, well-lit clinic — reduces patient anxiety", "Team smiling in a professional environment", "Modern equipment — conveys technology"],
    "HVAC Contractor": ["AC units installed outside", "Technician with tools at work", "Before/after of duct installation"],
    "Plumber": ["Before/after of repair — proof of results", "Technician with equipment", "Completed and clean installations"],
    "Family Law Attorney": ["Professional and welcoming office", "Attorney in a work environment", "Meeting room — trust and seriousness"],
    "Digital Marketing Agency": ["Team in a meeting or coworking space", "Campaign results on screen", "Creative and modern environment"],
  };
  const recs = nichePhotoRecs[client.category] || ["Work in progress photos", "Professional team", "Final delivered result"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, paddingBottom: 10, borderBottom: "1px solid " + C.border }}>Photo Management — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {total < 20 && (
            <span style={{ padding: "6px 12px", borderRadius: 6, background: C.yellow + "15", color: C.yellow, fontSize: 11, fontWeight: 700 }}>📸 Missing {20 - total} photos</span>
          )}
          {!photos.hasTeam && (
            <span style={{ padding: "6px 12px", borderRadius: 6, background: C.red + "15", color: C.red, fontSize: 11, fontWeight: 700 }}>⚠ No team photos</span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Total Photos" value={total} color={total >= 20 ? C.green : total >= 10 ? C.yellow : C.red} delta={total >= 20 ? "✓ Goal reached" : `Missing ${20 - total}`} up={total >= 20} />
        <StatCard label="Last Upload" value={lastUploadDays === 999 ? "Never" : `${lastUploadDays}d`} color={lastUploadDays <= 30 ? C.green : lastUploadDays <= 90 ? C.yellow : C.red} delta={lastUploadDays <= 30 ? "✓ Recent" : "Update!"} up={lastUploadDays <= 30} />
        <StatCard label="Cover Photo" value={photos.hasCoverPhoto ? "✓ Yes" : "✗ No"} color={photos.hasCoverPhoto ? C.green : C.red} />
        <StatCard label="Team Photos" value={photos.hasTeam ? "✓ Yes" : "✗ No"} color={photos.hasTeam ? C.green : C.red} delta={!photos.hasTeam ? "Add — E-E-A-T" : undefined} />
      </div>

      {/* Alerts */}
      {(!photos.hasTeam || lastUploadDays > 60 || total < 10) && (
        <Card style={{ marginBottom: 14, border: `1px solid ${C.yellow}33` }}>
          {!photos.hasTeam && <div style={{ display: "flex", gap: 10, padding: "6px 0" }}><span style={{ color: C.yellow }}>⚠</span><span style={{ fontSize: 13, color: C.text }}>No team photos — Google uses this to validate the human entity of the business (E-E-A-T)</span></div>}
          {!photos.hasCoverPhoto && <div style={{ display: "flex", gap: 10, padding: "6px 0" }}><span style={{ color: C.yellow }}>⚠</span><span style={{ fontSize: 13, color: C.text }}>No cover photo — first impression on Google Maps compromised</span></div>}
          {lastUploadDays > 60 && <div style={{ display: "flex", gap: 10, padding: "6px 0" }}><span style={{ color: C.orange }}>⚠</span><span style={{ fontSize: 13, color: C.text }}>Last photo was {lastUploadDays} days ago — profile looks inactive to the algorithm (freshness signal)</span></div>}
          {total < 10 && <div style={{ display: "flex", gap: 10, padding: "6px 0" }}><span style={{ color: C.red }}>✗</span><span style={{ fontSize: 13, color: C.text }}>Only {total} photos — well below the recommended minimum (20+)</span></div>}
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Breakdown by Category</div>
          {types.map(t => {
            const pct = Math.min(100, Math.round((t.count / t.rec) * 100));
            const col = pct >= 100 ? C.green : pct >= 60 ? C.yellow : C.red;
            return (
              <div key={t.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: C.textDim }}>{t.label}</span>
                  <span style={{ color: col, fontWeight: 700 }}>{t.count}/{t.rec}</span>
                </div>
                <ProgressBar value={pct} color={col} />
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{t.tip}</div>
              </div>
            );
          })}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Recomendações para {client.category.split(" ")[0]}</div>
            {recs.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: i < recs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ color: C.cyan, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Geo-tag in Photos</div>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.6, marginBottom: 8 }}>Adding GPS coordinates (EXIF) to photos reinforces the territorial presence signal in <span style={{ color: C.cyan }}>location_score</span>.</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, background: `${C.green}15`, border: `1px solid ${C.green}33`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.green, textAlign: "center" }}>✓ Geo-tag</div>
              <div style={{ flex: 1, background: `${C.red}15`, border: `1px solid ${C.red}33`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: C.red, textAlign: "center" }}>✗ Sem tag</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: C.textMuted }}>Use Google Photos, CamtaGPS or Geotag Photos Pro to tag before uploading.</div>
          </Card>
        </div>
      </div>

      <Card>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Google AI + Photos in 2026</div>
        {[
          "Google Vision AI analyzes the content of each photo to validate whether it is consistent with the business category",
          "Photos with correct context increase location_score — generic stock images do NOT score",
          "Adding at least 1 new photo per month keeps the freshness signal active",
          "Photos with human faces (team, clients with permission) increase engagement by 35%",
          "Videos in GBP are ranked above photos — priority for visual niches (renovation, detailing, etc.)",
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ color: C.cyan, flexShrink: 0, fontWeight: 700 }}>—</span>
            <span style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </Card>

      {client.scoresData && client.semanticData && (
        <AIAnalysisPanel data={client} scores={client.scoresData} semantic={client.semanticData} analysisType="photos" />
      )}
    </div>
  );
}
