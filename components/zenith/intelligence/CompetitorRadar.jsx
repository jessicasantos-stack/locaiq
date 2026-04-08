"use client";
import { useState } from "react";
import TabBar from "../shared/TabBar";
import { Competitors, MarketRadar, RankEstimator } from "../analysis";
import { useLang } from "../contexts/LangContext";

const TABS = (t) => [
  { id: "competitors", label: t.compete },
  { id: "cities", label: t.cities },
  { id: "rankestimator", label: t.rankestimator },
];

export default function CompetitorRadar({ client, onNavigate, t: tProp, ...rest }) {
  const { t: tCtx } = useLang();
  const t = tProp || tCtx;
  const [sub, setSub] = useState("competitors");
  const props = { client, onNavigate, t, ...rest };

  return (
    <div>
      <TabBar tabs={TABS(t)} active={sub} onChange={setSub} />
      {sub === "competitors" && <Competitors {...props} />}
      {sub === "cities" && <MarketRadar {...props} />}
      {sub === "rankestimator" && <RankEstimator {...props} />}
    </div>
  );
}
