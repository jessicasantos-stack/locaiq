"use client";
import { C, sc } from "../constants/colors";

export default function ScoreDonut({ score, size = 56 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ, c = sc(score);
  return (<div style={{ position: "relative", width: size, height: size }}><svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="5"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s" }}/></svg><div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize: size*0.24, fontWeight: 900, color: c }}>{score}</span></div></div>);
}
