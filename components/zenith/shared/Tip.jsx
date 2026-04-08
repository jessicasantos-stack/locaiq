"use client";
import { useState } from "react";
import { C } from "../constants/colors";

export default function Tip({ term, children }) {
  const [show, setShow] = useState(false);
  const DEFS = {
    "location_score": "Internal Google attribute that measures how well validated the business's geographic presence is.",
    "navboost": "Behavioral signal: clicks, time on page, bounce rate. Weighs more than domain authority in 2026.",
    "entity_rating_score": "Google's NLP analyzing review quality and sentiment — not just the star rating.",
    "place_mention_score": "Mentions of the business on other pages, even without a link, count toward reputation.",
    "NAP_consistency_score": "Consistency of Name, Address, and Phone across all web sources.",
    "AI Mode": "Google feature that uses Generative AI to answer queries with content extracted directly from GBP.",
    "chunk": "Standalone sentence that works on its own — AI Mode extracts individual chunks, not entire pages.",
    "triangulation": "Semantic alignment between description, reviews, posts, and photos. When all tell the same story, Google validates the entity.",
    "ontology": "4-layer structure (Entity, Action, Problem, Scenario) that defines how Google understands the business.",
    "semantic chunk": "Standalone sentence that works on its own — AI Mode extracts individual chunks, not entire pages.",
  };
  const def = DEFS[term] || children;
  return (
    <span style={{ position: "relative", display: "inline" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ color: C.cyan, borderBottom: `1px dashed ${C.cyan}`, cursor: "help", fontSize: "inherit" }}>{term}</span>
      {show && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 999, background: C.bgCard, border: `1px solid ${C.cyan}44`, borderRadius: 8, padding: "8px 12px", width: 260, fontSize: 11, color: C.textDim, lineHeight: 1.6, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", marginBottom: 6 }}>
          <div style={{ fontWeight: 700, color: C.cyan, marginBottom: 3 }}>{term}</div>
          {def}
        </div>
      )}
    </span>
  );
}
