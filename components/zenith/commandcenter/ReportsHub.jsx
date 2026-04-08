"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { ClientReports, PresentationMode } from "../reports";
import { PortfolioComparison } from "../overview";
import { BulkActions } from "../tools";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "reports", label: t.clientReports },
  { id: "portfolio", label: t.portfolio },
  { id: "presentation", label: t.presentation },
];

export default function ReportsHub({ client, onNavigate, t: tProp, allClients, onSelectClient, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("reports");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "reports" && <ClientReports {...props} allClients={allClients} />}
      {sub === "portfolio" && <PortfolioComparison {...props} allClients={allClients} onSelectClient={onSelectClient} />}
      {sub === "presentation" && <PresentationMode {...props} onNavigate={onNavigate} />}
    </div>
  );
}
