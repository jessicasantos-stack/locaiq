"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { callClaude } from "../utils/ai";

export default function AIChatAgent({ data, scores, semantic }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    const context = `GBP Consultant. Profile: ${data.businessName} (${data.category}) in ${data.address}. Scores: Overall ${scores.overall}, AI Mode ${semantic.score}. Reviews: ${data.reviews.total} (${data.reviews.average}★). Answer in under 200 words. User question: ${userMsg}`;
    const result = await callClaude(context, 400);
    setMessages(prev => [...prev, { role: "ai", text: result }]);
    setLoading(false);
  };
  if (!isOpen) return (
    <div onClick={() => setIsOpen(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 4px 20px ${C.blue}44`, zIndex: 100, fontSize: 24 }}>🤖</div>
  );
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 380, height: 500, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: `0 8px 40px rgba(0,0,0,0.5)`, zIndex: 100, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>AI SEO Consultant</div><div style={{ fontSize: 10, color: C.cyan }}>Anderson Melo Framework</div></div>
        </div>
        <span onClick={() => setIsOpen(false)} style={{ fontSize: 18, color: C.muted, cursor: "pointer" }}>✕</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 4 }}>Ask me about your GBP</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
              {["How can I improve my AI Mode score?", "What should my next post be about?", "How do I get more reviews?"].map(q => (
                <div key={q} onClick={() => setInput(q)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.blue, cursor: "pointer", textAlign: "left" }}>💬 {q}</div>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.role + m.text.slice(0, 20)} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", background: m.role === "user" ? C.blue : C.bg, border: m.role === "ai" ? `1px solid ${C.border}` : "none", borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", padding: "10px 14px" }}>
              <div style={{ fontSize: 12, color: m.role === "user" ? "#fff" : C.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 4, padding: "10px 14px" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan }}/><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, opacity: 0.6 }}/><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, opacity: 0.3 }}/></div>}
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask about your GBP..." style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: C.text, outline: "none" }}/>
        <button onClick={sendMessage} disabled={loading} style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Send</button>
      </div>
    </div>
  );
}
