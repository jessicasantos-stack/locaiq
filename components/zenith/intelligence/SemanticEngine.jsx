"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { AIMode, Triangulation, SemanticGapAnalyzer, EntropyScoreAnalyzer, GEOScore } from "../analysis";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "aimode", label: t.aimode },
  { id: "geo", label: "GEO Score" },
  { id: "triangulation", label: t.triangulation },
  { id: "semanticgap", label: t.semanticgap },
  { id: "entropy", label: t.entropy },
];

export default function SemanticEngine({ client, onNavigate, t: tProp, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("aimode");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "aimode" && <AIMode {...props} />}
      {sub === "geo" && <GEOScore {...props} />}
      {sub === "triangulation" && <Triangulation {...props} />}
      {sub === "semanticgap" && <SemanticGapAnalyzer {...props} />}
      {sub === "entropy" && <EntropyScoreAnalyzer {...props} />}
    </div>
  );
}
