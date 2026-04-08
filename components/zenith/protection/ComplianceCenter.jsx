"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { ComplianceGuard, SpamDetector, IPMonitor } from "../analysis";
import { ShadowEditTab } from "../tools";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "guard", label: t.complianceGuard },
  { id: "spam", label: t.spamdetect },
  { id: "ip", label: "IP Monitor" },
  { id: "shadow", label: t.shadowedit },
];

export default function ComplianceCenter({ client, onNavigate, t: tProp, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("guard");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "guard" && <ComplianceGuard {...props} />}
      {sub === "spam" && <SpamDetector {...props} />}
      {sub === "ip" && <IPMonitor {...props} />}
      {sub === "shadow" && <ShadowEditTab {...props} />}
    </div>
  );
}
