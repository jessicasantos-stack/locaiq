"use client";
import { C, sc } from "../constants/colors";

export default function MiniBar({ value }) {
  return (<div style={{ background: C.border, borderRadius: 99, height: 4, width: "100%", overflow: "hidden" }}><div style={{ width: `${value}%`, background: sc(value), height: 4, borderRadius: 99, transition: "width 0.6s" }}/></div>);
}
