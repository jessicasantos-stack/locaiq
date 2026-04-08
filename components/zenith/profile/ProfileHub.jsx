"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import DescriptionTab from "./DescriptionTab";
import PhotosTab from "./PhotosTab";
import PostsTab from "./PostsTab";
import ReviewsTab from "./ReviewsTab";
import InfoTab from "./InfoTab";
import OptimizeTab from "./OptimizeTab";

export default function ProfileHub({ client, onNavigate, t, initialTab }) {
  const tabs = [
    { id: "description", label: t?.description || "Description",     icon: "▤" },
    { id: "photos",      label: t?.photos      || "Photos",          icon: "◻" },
    { id: "posts",       label: t?.posts       || "Posts",           icon: "▦" },
    { id: "reviews",     label: t?.reviews     || "Reviews",         icon: "◈" },
    { id: "info",        label: t?.info        || "Info & Attributes",icon: "ℹ" },
    { id: "optimize",    label: t?.optimize    || "Optimize (AI)",   icon: "◆" },
  ];

  const [active, setActive] = useState(initialTab || "description");
  const props = { client, onNavigate, t };

  const renderSub = () => {
    switch (active) {
      case "description": return <DescriptionTab {...props} />;
      case "photos":      return <PhotosTab {...props} />;
      case "posts":       return <PostsTab {...props} />;
      case "reviews":     return <ReviewsTab {...props} />;
      case "info":        return <InfoTab {...props} />;
      case "optimize":    return <OptimizeTab {...props} />;
      default:            return <DescriptionTab {...props} />;
    }
  };

  return (
    <div>
      {/* Horizontal sub-tab bar */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 20,
        background: C.bgCard, border: "1px solid " + C.border,
        borderRadius: 10, padding: 4, overflowX: "auto",
      }}>
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 7,
                border: "none", cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? C.blue : "transparent",
                color: isActive ? "#fff" : C.textDim,
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = C.bgHover; e.currentTarget.style.color = C.text; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textDim; }}}
            >
              <span style={{ fontSize: 11, opacity: 0.8 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active sub-tab content */}
      {renderSub()}
    </div>
  );
}


