"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { ContentGenerator, CitationTracker } from "../tools";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "content", label: t.contentgen },
  { id: "citations", label: t.citations },
];

export default function ContentStudio({ client, onNavigate, t: tProp, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("content");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "content" && <ContentGenerator {...props} />}
      {sub === "citations" && <CitationTracker {...props} />}
    </div>
  );
}
