"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { RescueMode } from "../rescue";
import { PredictiveAlerts } from "../intelligence";
import { AttentionRequired } from "../overview";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "rescue", label: t.rescueMode },
  { id: "predictive", label: t.predictive },
  { id: "attention", label: t.attentionRequired },
];

export default function RescueCenter({ client, onNavigate, t: tProp, allClients, onSelectClient, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("rescue");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "rescue" && <RescueMode {...props} />}
      {sub === "predictive" && <PredictiveAlerts {...props} allClients={allClients} />}
      {sub === "attention" && <AttentionRequired {...props} allClients={allClients} onSelectClient={onSelectClient} />}
    </div>
  );
}
