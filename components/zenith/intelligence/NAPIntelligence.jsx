"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { NAPCheck } from "../analysis";
import { NAPMaster, EcosystemIntel } from "../tools";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "napcheck", label: t.napSuite },
  { id: "napmaster", label: t.napmaster },
  { id: "ecosystem", label: t.ecosystem },
];

export default function NAPIntelligence({ client, onNavigate, t: tProp, allClients, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("napcheck");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "napcheck" && <NAPCheck {...props} />}
      {sub === "napmaster" && <NAPMaster {...props} allClients={allClients} />}
      {sub === "ecosystem" && <EcosystemIntel {...props} />}
    </div>
  );
}
