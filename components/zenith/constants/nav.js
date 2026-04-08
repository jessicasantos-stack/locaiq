import { T } from "./translations";

export function getNav(t) {
  return [
    { label: t.commandCenter, icon: "⚡", items: [
      { id: "brain",      label: t.brain,      icon: "🧠" },
      { id: "overview",   label: t.overview,   icon: "◎" },
      { id: "reports",    label: t.reports,     icon: "▤" },
    ]},
    { label: t.intelligence, icon: "◈", items: [
      { id: "semantic",   label: t.semanticEngine,    icon: "◆" },
      { id: "nap",        label: t.napIntelligence,   icon: "◍" },
      { id: "competitor",  label: t.competitorRadar,   icon: "◇" },
      { id: "reviewintel", label: t.reviewintel,       icon: "⭐" },
    ]},
    { label: t.protection, icon: "⚠", items: [
      { id: "rescue",     label: t.rescue,      icon: "🚨" },
      { id: "compliance", label: t.compliance,  icon: "◈" },
    ]},
    { label: t.profile, icon: "◉", items: [
      { id: "profilehub", label: t.profilehub,  icon: "◉" },
    ]},
    { label: t.action, icon: "✨", items: [
      { id: "contentstudio", label: t.contentStudio, icon: "✨" },
      { id: "lsa",            label: "LSA Ads",        icon: "📢" },
      { id: "bulkactions",   label: t.bulkactions,   icon: "◧" },
    ]},
  ];
}

export const NAV_GROUPS = getNav(T.en);
