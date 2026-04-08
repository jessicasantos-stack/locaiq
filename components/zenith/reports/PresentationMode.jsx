"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { PDFExportButton } from "../ai";

export default function PresentationMode({ client, onNavigate }) {
  const sc2 = client.scoresData || {};
  const sem = client.semanticData || {};
  const [slide, setSlide] = useState(0);

  const rr = Math.round(((client.reviewsData?.withResponse || 0) / Math.max(client.reviewsData?.total || 1, 1)) * 100);
  const lp = client.posts?.[0]?.date ? Math.floor((new Date() - new Date(client.posts[0].date)) / 86400000) : 999;

  const actions = [];
  if ((client.reviewsData?.negativeUnanswered || 0) > 0) actions.push({ icon: "🚨", text: "Respond to negative reviews", impact: "Critical", color: C.red });
  if (lp > 14) actions.push({ icon: "📢", text: "Publish a post", impact: "High", color: C.orange });

  const slides = [
    {
      title: "GBP Report",
      render: () => (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: C.text, marginBottom: 8 }}>{client.name}</div>
          <div style={{ fontSize: 18, color: C.textMuted, marginBottom: 16 }}>{client.category} · {client.city}</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: C.blue }}>{client.score}</div>
        </div>
      )
    },
    {
      title: "Score by Section",
      render: () => (
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>Score by Section</div>
          {[
            { l: "Description", v: sc2.desc || 0 },
            { l: "Photos", v: sc2.photo || 0 },
            { l: "Posts", v: sc2.post || 0 },
            { l: "Reviews", v: sc2.review || 0 },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e3a5f" }}>
              <span style={{ color: "#94a3b8" }}>{s.l}</span>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>{s.v}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Metrics",
      render: () => (
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>Profile Metrics</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { l: "Reviews", v: String(client.reviewsData?.total || 0) },
              { l: "Response Rate", v: rr + "%" },
              { l: "Photos", v: String(client.photos?.total || 0) },
              { l: "AI Mode", v: String(sem.score || 0) },
            ].map(m => (
              <div key={m.l} style={{ background: C.bg, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.blue }}>{m.v}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Priorities",
      render: () => (
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>Action Plan</div>
          {(actions.length > 0 ? actions : [{ icon: "✅", text: "Profile in good shape", impact: "OK", color: C.green }]).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #1e3a5f" }}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <div style={{ flex: 1, fontSize: 14, color: C.text }}>{a.text}</div>
              <span style={{ fontSize: 11, color: a.color, fontWeight: 700 }}>{a.impact}</span>
            </div>
          ))}
        </div>
      )
    },
  ];

  const cur = slides[slide];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>Presentation Mode</div>
        {client.scoresData && client.semanticData && (
          <PDFExportButton data={client} scores={client.scoresData} semantic={client.semanticData} />
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {slides.map((s, i) => (
          <button key={i} onClick={() => setSlide(i)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid " + (slide === i ? C.blue : C.border), background: slide === i ? C.blue + "22" : "transparent", color: slide === i ? C.blue : C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {i + 1}. {s.title}
          </button>
        ))}
      </div>
      <div style={{ background: C.bgCard, border: "1px solid " + C.border, borderRadius: 16, padding: "36px 40px", minHeight: 420 }}>
        {cur.render()}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>← Previous</button>
          <button onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1} style={{ padding: "7px 16px", borderRadius: 7, border: "1px solid " + C.blue, background: C.blue + "22", color: C.blue, fontSize: 12, cursor: "pointer" }}>Next →</button>
        </div>
      </div>
    </div>
  );
}



