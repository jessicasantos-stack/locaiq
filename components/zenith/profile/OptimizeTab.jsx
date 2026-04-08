"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, ProgressBar, Btn, TabBar } from "../shared";
import { callClaude } from "../utils/ai";

export default function OptimizeTab({ client }) {
  const [activeTool, setActiveTool] = useState("description");
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [copied, setCopied] = useState({});

  const city = client.city || client.address?.split(",")[0]?.trim() || "";
  const state = client.address?.split(",")[1]?.trim()?.split(" ")[0] || "";
  const services = (client.services || []).slice(0, 4).join(", ");
  const topService = (client.services || [client.category])[0] || client.category;
  const reviews = client.reviewsData?.total || client.reviews || 0;
  const topReview = client.reviewsData?.samples?.[0]?.text?.substring(0, 80) || "Excellent quality and professional service";

  // Niche-specific problem terms
  const nicheProblems = {
    "Home Renovation Contractor": "outdated kitchens, storm-damaged exteriors, aging siding",
    "Dentist": "dental anxiety, cosmetic issues, tooth pain, insurance concerns",
    "HVAC Contractor": "broken AC in summer heat, high energy bills, heating failures",
    "Plumber": "burst pipes, slow drains, water heater failures, emergency leaks",
    "Family Law Attorney": "divorce uncertainty, custody disputes, financial vulnerability",
    "Digital Marketing Agency": "low Google visibility, zero leads from Maps, poor GBP ranking",
  };
  const problems = nicheProblems[client.category] || "service problems, quality concerns, reliability issues";

  const TOOLS = [
    { id: "description", label: "4-Layer Description" },
    { id: "posts", label: "Semantic Posts" },
    { id: "services", label: "Service Descriptions" },
    { id: "entities", label: "Strong/Weak Entities" },
  ];

  const generate = async (tool) => {
    setLoading(l => ({ ...l, [tool]: true }));

    let prompt = "";
    if (tool === "description") {
      prompt = `Generate an optimized Google Business Profile description for:\nBusiness: ${client.name}\nCategory: ${client.category}\nCity: ${city}, ${state}\nServices: ${services}\nCredentials: ${client.description?.includes("licensed") ? "Licensed, Insured" : "Professional service"}\nProblems solved: ${problems}\nUse the 4-layer ontology (Entity + Action + Problem + Scenario). Each sentence must be a self-contained semantic chunk. Maximum 750 characters. Output ONLY the description text.`;
    } else if (tool === "posts") {
      prompt = `Generate 3 Google Business Profile posts for ${client.name} (${client.category}) in ${city}, ${state}:\n\nPOST 1 — What's New (service highlight):\nHighlight: ${topService}\nInclude city + service + credential. Under 1500 chars.\n\nPOST 2 — Social Proof:\nUse this real review snippet: "${topReview}"\nInclude response and CTA to call. Under 1500 chars.\n\nPOST 3 — Educational/Seasonal tip:\nProblem: ${problems.split(",")[0].trim()}\nGive a practical tip and soft CTA. Under 1500 chars.\n\nFormat each post clearly with POST 1, POST 2, POST 3 headers.`;
    } else {
      // Local generators for services/entities (no API needed)
      await new Promise(r => setTimeout(r, 600));
      if (tool === "services") {
        const serviceDescriptions = (client.services || []).map(s =>
          `${s} — ${city}, ${state}\n${client.name} delivers expert ${s.toLowerCase()} for residential and commercial clients in ${city}. ${client.verified ? "Licensed, insured, and Google Guaranteed." : "Professional and reliable."} Free estimates available.`
        ).join("\n\n");
        setResults(r => ({ ...r, [tool]: serviceDescriptions }));
      } else {
        const strong = [
          `licensed ${client.category.toLowerCase()} in ${city}, ${state}`,
          `${(client.services || []).slice(0, 2).join(" and ").toLowerCase()} specialist`,
          `${reviews}+ satisfied clients in ${city}`,
          `serving ${client.city} and surrounding area`,
          client.description?.includes("insured") ? "fully insured with liability coverage" : "professional and reliable",
          client.description?.includes("certified") ? "certified and background-checked" : "experienced team",
        ];
        const weak = ["quality service", "best in the area", "experienced team", "great results", "call us today", "we are the best", "top-rated company", "number one choice"];
        setResults(r => ({ ...r, [tool]: `STRONG ENTITIES — use in description, posts and responses:\n${strong.map(s => `+ ${s}`).join("\n")}\n\nWEAK ENTITIES — avoid (no semantic weight):\n${weak.map(s => `- "${s}"`).join("\n")}\n\nRULE: Specific and measurable entities create denser embeddings in Google's index. "Licensed general contractor in Danbury, CT" is worth 10x more than "quality service".` }));
      }
      setLoading(l => ({ ...l, [tool]: false }));
      return;
    }

    const result = await callClaude(prompt, tool === "posts" ? 1000 : 600);
    setResults(r => ({ ...r, [tool]: result }));
    setLoading(l => ({ ...l, [tool]: false }));
  };

  const copy = (tool) => {
    navigator.clipboard?.writeText(results[tool] || "");
    setCopied(c => ({ ...c, [tool]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [tool]: false })), 2000);
  };

  const cur = activeTool;
  const descriptions = {
    "description": "Generates description with the 4 ontology layers using AI (Claude API)",
    "posts": "Generates 3 ready-to-publish posts — What's New, Social Proof, Educational",
    "services": "Semantic descriptions for each service listed in GBP",
    "entities": "Mapping of strong vs weak entities for your niche",
  };

  return (
    <div>
      <SectionTitle>Optimize — SEO Content Generators</SectionTitle>
      <TabBar tabs={TOOLS} active={activeTool} onChange={t => { setActiveTool(t); }} />

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
              {TOOLS.find(t => t.id === cur)?.label} — {client.name}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{descriptions[cur]}</div>
            {(cur === "description" || cur === "posts") && (
              <div style={{ fontSize: 11, color: C.cyan, marginTop: 4 }}>🤖 Powered by Claude AI · Anderson Melo Framework</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {results[cur] && <Btn variant="ghost" onClick={() => copy(cur)}>{copied[cur] ? "✓ Copied!" : "Copy"}</Btn>}
            <Btn onClick={() => generate(cur)} disabled={loading[cur]}>
              {loading[cur] ? "Generating..." : results[cur] ? "Generate New" : "Generate"}
            </Btn>
          </div>
        </div>

        {loading[cur] && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 13, color: C.cyan, marginBottom: 12 }}>
              {cur === "description" || cur === "posts" ? "🤖 Consulting Claude AI..." : "Generating semantic content..."}
            </div>
            <ProgressBar value={50} color={C.cyan} />
          </div>
        )}

        {!results[cur] && !loading[cur] && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 14, lineHeight: 1.8 }}>
            Click <strong style={{ color: C.text }}>"Generate"</strong> to create optimized content for{" "}
            <strong style={{ color: C.cyan }}>{client.name}</strong>.<br/>
            <span style={{ fontSize: 12 }}>Uses real profile data: category, city, services, reviews.</span>
          </div>
        )}

        {results[cur] && !loading[cur] && (
          <div>
            <textarea readOnly value={results[cur]} style={{ width: "100%", minHeight: cur === "posts" ? 420 : 240, padding: 16, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, fontSize: 13, lineHeight: 1.75, fontFamily: "'JetBrains Mono', monospace", outline: "none", resize: "none" }} />
            {cur === "description" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
                <span style={{ color: results[cur].length > 750 ? C.red : results[cur].length > 600 ? C.yellow : C.green, fontWeight: 700 }}>{results[cur].length}/750 characters</span>
                <span style={{ color: C.textMuted }}>Goal: 700–750 for maximum score</span>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Data used to generate content</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { l: "Business", v: client.name },
            { l: "Category", v: client.category },
            { l: "City", v: `${city}, ${state}` },
            { l: "Services", v: services || "—" },
            { l: "Reviews", v: `${reviews} (${client.rating}★)` },
            { l: "Verified", v: client.verified ? "✓ Yes" : "✗ No" },
          ].map(f => (
            <div key={f.l} style={{ background: C.bg, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700, marginBottom: 3 }}>{f.l.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

