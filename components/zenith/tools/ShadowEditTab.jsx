"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, ProgressBar, Btn } from "../shared";

export default function ShadowEditTab({ client }) {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [edits, setEdits] = useState([]);
  const [revertedFields, setRevertedFields] = useState([]);

  const MOCK_EDITS = [
    { field: "Business Hours", original: "Mon-Fri 8:00 AM - 6:00 PM", current: "Mon-Sat 8:00 AM - 6:00 PM", date: "2 days ago", risk: "medium", source: "User suggestion accepted by Google" },
    { field: "Phone Number", original: client.phone || "+1 203-555-0100", current: "+1 203-555-0199", date: "5 days ago", risk: "high", source: "Unknown edit — possible competitor" },
    { field: "Primary Category", original: client.category, current: client.category + " Contractor", date: "12 days ago", risk: "high", source: "Google auto-suggestion" },
  ];

  const scan = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 1800));
    setScanning(false);
    setScanned(true);
    setEdits(MOCK_EDITS);
    setSnapshots([
      { date: "Today", fields: 12, changes: 3, status: "alert" },
      { date: "7 days ago", fields: 12, changes: 0, status: "clean" },
      { date: "14 days ago", fields: 12, changes: 1, status: "warning" },
      { date: "21 days ago", fields: 12, changes: 0, status: "clean" },
    ]);
  };

  const riskColor = r => r === "high" ? C.red : r === "medium" ? C.yellow : C.green;

  return (
    <div>
      <SectionTitle>Shadow Edit Detector — {client.name}</SectionTitle>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Profile Integrity Monitor</div>
            <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, maxWidth: 520 }}>
              Google accepts edits from third-party users and applies them automatically — including changes by competitors.
              This tool takes a daily snapshot and alerts when any field changes without your authorization.
            </div>
          </div>
          <Btn onClick={scan} disabled={scanning}>
            {scanning ? "Scanning..." : scanned ? "Re-Scan Profile" : "Scan for Changes"}
          </Btn>
        </div>
      </Card>

      {scanning && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 14, color: C.textDim, marginBottom: 12 }}>Comparing current profile against last snapshot...</div>
          <ProgressBar value={65} color={C.cyan} />
        </Card>
      )}

      {scanned && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Fields Monitored", value: 12, color: C.blue },
              { label: "Changes Detected", value: edits.length, color: edits.length > 0 ? C.red : C.green },
              { label: "High Risk", value: edits.filter(e => e.risk === "high").length, color: C.red },
              { label: "Snapshots Saved", value: snapshots.length, color: C.cyan },
            ].map(m => (
              <Card key={m.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{m.label}</div>
              </Card>
            ))}
          </div>

          {edits.length > 0 && (
            <Card style={{ marginBottom: 16, border: `1px solid ${C.red}44` }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.red, marginBottom: 16 }}>
                ⚠ Unauthorized Changes Detected
              </div>
              {edits.map((e) => (
                <div key={e.field} style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Badge label={e.risk === "high" ? "High Risk" : "Medium Risk"} color={riskColor(e.risk)} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{e.field}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: C.textMuted }}>{e.date}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div style={{ padding: "8px 12px", background: `${C.green}10`, borderRadius: 8, border: `1px solid ${C.green}33` }}>
                      <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 4 }}>ORIGINAL</div>
                      <div style={{ fontSize: 13, color: C.text }}>{e.original}</div>
                    </div>
                    <div style={{ padding: "8px 12px", background: `${C.red}10`, borderRadius: 8, border: `1px solid ${C.red}33` }}>
                      <div style={{ fontSize: 10, color: C.red, fontWeight: 700, marginBottom: 4 }}>CHANGED TO</div>
                      <div style={{ fontSize: 13, color: C.text }}>{e.current}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                    <strong>Source:</strong> {e.source}
                  </div>
                  <Btn variant="danger" onClick={() => setRevertedFields(prev => [...prev, e.field])}>
                    {revertedFields.includes(e.field) ? "✓ Revertido" : "Reverter para Original"}
                  </Btn>
                </div>
              ))}
            </Card>
          )}

          <Card>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Snapshot History</div>
            {snapshots.map((s) => (
              <div key={s.date} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.status === "alert" ? C.red : s.status === "warning" ? C.yellow : C.green, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.date}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{s.fields} fields monitored</div>
                </div>
                <Badge
                  label={s.changes > 0 ? `${s.changes} change${s.changes > 1 ? "s" : ""}` : "Clean"}
                  color={s.status === "alert" ? C.red : s.status === "warning" ? C.yellow : C.green}
                />
              </div>
            ))}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, color: C.cyan, marginBottom: 12 }}>Why This Matters</div>
            {[
              "Google accepts suggestions from any logged-in user — including competitors — and applies them without notifying you",
              "A changed phone number or wrong hours can cost dozens of lost leads per week before you notice",
              "Shadow edits are one of the most common causes of unexplained ranking drops in local SEO",
              "The Zenith Shadow Edit Detector runs a daily comparison and alerts you the moment anything changes",
            ].map((t) => (
              <div key={t.slice(0, 30)} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.cyan, flexShrink: 0, fontWeight: 700 }}>→</span>
                <span style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
