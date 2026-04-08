"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, Badge, TabBar } from "../shared";
import { callClaude } from "../utils/ai";

export default function BulkActions({ client, allClients, t }) {
  const isPt = t?.seasonal === "Sazonalidade";
  const [selectedClients, setSelectedClients] = useState([]);
  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState("UPDATE");
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");

  const toggleClient = (id) => setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedClients((allClients || []).filter(c => c?.id).map(c => c.id));
  const clearAll = () => setSelectedClients([]);

  const generatePost = async () => {
    if (!selectedClients.length) return;
    setGenerating(true);
    const firstClient = allClients.find(c => c.id === selectedClients[0]) || client;
    const prompt = `Write a short Google Business Profile ${postType} post for a ${firstClient.category} in ${firstClient.city}. Services: ${(firstClient.services || []).slice(0,3).join(", ")}. Under 150 words. Include a call to action. Be specific, local, professional.`;
    const result = await callClaude(prompt, 200);
    setPostText(result);
    setGenerating(false);
  };

  const publishAll = async () => {
    if (!postText || !selectedClients.length) return;
    setPublishing(true);
    for (const id of selectedClients) {
      await new Promise(r => setTimeout(r, 300));
      setPublished(prev => [...prev, id]);
    }
    setPublishing(false);
  };

  const typeColor = { UPDATE: C.blue, OFFER: C.green, EVENT: C.purple };

  return (
    <div>
      <SectionTitle>Bulk Actions — {selectedClients.length} profiles selected</SectionTitle>
      <TabBar tabs={[{ id: "posts", label: "Bulk Post Publisher" }]} active={activeTab} onChange={setActiveTab} />

      {activeTab === "posts" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Client selector */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>1. Select Profiles ({selectedClients.length}/{allClients.length})</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={selectAll} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "1px solid " + C.border, background: "transparent", color: C.cyan, cursor: "pointer" }}>All</button>
                <button onClick={clearAll} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, border: "1px solid " + C.border, background: "transparent", color: C.textMuted, cursor: "pointer" }}>Clear</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
              {allClients.map(c => {
                const sel = selectedClients.includes(c.id);
                const done = published.includes(c.id);
                return (
                  <div key={c.id} onClick={() => !done && toggleClient(c.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: sel ? C.blue + "15" : C.bg, border: "1px solid " + (sel ? C.blue + "44" : C.border), borderRadius: 8, cursor: done ? "default" : "pointer", opacity: done ? 0.6 : 1 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid " + (done ? C.green : sel ? C.blue : C.border), background: done ? C.green : sel ? C.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {(sel || done) && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>{done ? "✓" : "✓"}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.businessName}</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>{c.category?.split(" ")[0]} · {c.city || c.address?.split(",")[0]}</div>
                    </div>
                    {done && <Badge label="Published" color={C.green} />}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Post editor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>2. Create Post</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[["UPDATE", "What's New"], ["OFFER", "Offer"], ["EVENT", "Event"]].map(([t, l]) => (
                  <button key={t} onClick={() => setPostType(t)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + (postType === t ? typeColor[t] : C.border), background: postType === t ? typeColor[t] + "22" : "transparent", color: postType === t ? typeColor[t] : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
              <textarea value={postText} onChange={e => setPostText(e.target.value)} rows={6}
                placeholder="Write the post here or click Generate with AI..."
                style={{ width: "100%", padding: "10px 14px", background: C.bg, border: "1px solid " + C.border, borderRadius: 8, color: C.text, fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: postText.length > 1500 ? C.red : C.textMuted }}>{postText.length}/1500 chars</span>
                <button onClick={generatePost} disabled={generating || !selectedClients.length} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: generating ? C.border : C.purple, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {generating ? "Generating..." : "🤖 Generate with AI"}
                </button>
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>3. Publish</div>
              {published.length > 0 && (
                <div style={{ marginBottom: 12, padding: "8px 12px", background: C.green + "10", borderRadius: 8, border: "1px solid " + C.green + "33", fontSize: 12, color: C.green }}>
                  ✓ Published to {published.length} profile(s)
                </div>
              )}
              <button onClick={publishAll} disabled={publishing || !postText || !selectedClients.length || published.length === selectedClients.length}
                style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: !postText || !selectedClients.length ? C.border : "linear-gradient(135deg," + C.blue + "," + C.cyan + ")", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {publishing ? "Publishing... " + published.length + "/" + selectedClients.length : published.length === selectedClients.length && published.length > 0 ? "✓ All published" : "Publish to " + selectedClients.length + " Profile(s)"}
              </button>
              <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                ⚠ In production, this uses the GBP API to publish automatically. In this demo, it simulates publishing.
              </div>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}

