/**
 * Report PDF Generator
 * Generates clean HTML from report data → opens print dialog (Save as PDF)
 * Respects visible sections filter.
 */

const sc = (v) => v >= 80 ? "#10b981" : v >= 50 ? "#f59e0b" : "#ef4444";

export function generateReportPDF(data, visibleSections, periodLabel) {
  const show = (id) => visibleSections.includes(id);
  const scoreColor = sc(data.overall);

  const sections = [];

  // ── Cover (always shown) ──
  sections.push(`
    <div class="cover">
      <div class="cover-label">${data.periodDays <= 15 ? "Biweekly Report" : "Monthly Report"} — ${data.periodDays} days</div>
      <div class="cover-name">${data.name}</div>
      <div class="cover-meta">${data.category} &middot; ${data.city}</div>
      <div class="cover-period">${periodLabel}</div>
    </div>
  `);

  // ── Profile Score ──
  if (show("score")) {
    const deltaColor = data.scoreDelta >= 0 ? "#10b981" : "#ef4444";
    const deltaSign = data.scoreDelta >= 0 ? "+" : "";
    sections.push(`
      <div class="section">
        <div class="section-title">Profile Health</div>
        <div class="score-hero">
          <div class="score-before">
            <div class="score-label-sm">Before</div>
            <div class="score-num muted">${data.prevScore}</div>
          </div>
          <div class="score-arrow">→</div>
          <div class="score-after">
            <div class="score-label-sm" style="color:${scoreColor}">Now</div>
            <div class="score-num" style="color:${scoreColor}">${data.overall}</div>
          </div>
          <div class="score-delta" style="color:${deltaColor};background:${deltaColor}15">${deltaSign}${data.scoreDelta}</div>
        </div>
      </div>
    `);
  }

  // ── Score Breakdown ──
  if (show("breakdown")) {
    const bars = data.sections.map(s => {
      const delta = s.score - s.prev;
      const col = sc(s.score);
      return `
        <div class="bar-row">
          <div class="bar-header">
            <span>${s.name}</span>
            <span><span class="muted">was ${s.prev}</span> &nbsp; <strong style="color:${col}">${s.score}</strong> &nbsp; <span style="color:${delta >= 0 ? '#10b981' : '#ef4444'}">${delta >= 0 ? '+' : ''}${delta}</span></span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${s.score}%;background:${col}"></div></div>
        </div>
      `;
    }).join("");
    sections.push(`<div class="section"><div class="section-title">Score Breakdown</div>${bars}</div>`);
  }

  // ── Profile Interactions ──
  if (show("interactions")) {
    const items = [
      { label: "Phone Calls", value: data.interactions.calls, delta: data.interactions.callsDelta },
      { label: "Direction Requests", value: data.interactions.routes, delta: data.interactions.routesDelta },
      { label: "Website Clicks", value: data.interactions.clicks, delta: data.interactions.clicksDelta },
    ];
    const grid = items.map(m => `
      <div class="metric-card">
        <div class="metric-value">${m.value}</div>
        <div class="metric-label">${m.label}</div>
        <div class="metric-delta" style="color:${m.delta >= 0 ? '#10b981' : '#ef4444'}">${m.delta >= 0 ? '+' : ''}${m.delta} vs last period</div>
      </div>
    `).join("");
    sections.push(`<div class="section"><div class="section-title">Profile Interactions</div><div class="metric-grid">${grid}</div></div>`);
  }

  // ── Reviews ──
  if (show("reviews")) {
    const items = [
      { label: "Total Reviews", value: data.reviews.total },
      { label: "Rating", value: data.reviews.average + "★" },
      { label: "Reply Rate", value: data.reviews.responseRate + "%" },
      { label: "New This Period", value: data.reviews.last30days },
    ];
    const grid = items.map(m => `<div class="metric-card"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div></div>`).join("");
    sections.push(`<div class="section"><div class="section-title">Customer Reviews</div><div class="metric-grid-4">${grid}</div></div>`);
  }

  // ── Photos ──
  if (show("photos")) {
    const delta = data.photos.total - data.photos.prevTotal;
    sections.push(`
      <div class="section">
        <div class="section-title">Photos</div>
        <div class="photos-row">
          <div class="photos-num" style="color:${sc(data.photos.total >= 20 ? 80 : data.photos.total >= 10 ? 55 : 30)}">${data.photos.total}</div>
          <div>
            <div>photos on profile</div>
            <div style="color:${delta > 0 ? '#10b981' : '#94a3b8'}">${delta > 0 ? `+${delta} added this period` : 'No new photos'}</div>
          </div>
        </div>
      </div>
    `);
  }

  // ── Competitors ──
  if (show("competitors")) {
    const bars = data.competitors.map(c => {
      const isClient = c.isClient;
      const col = isClient ? "#06b6d4" : "#94a3b8";
      return `
        <div class="bar-row">
          <div class="bar-header">
            <span style="color:${col};font-weight:${isClient ? 700 : 400}">${isClient ? '★ ' + data.name : c.name}</span>
            <strong style="color:${col}">${c.score}</strong>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${c.score}%;background:${col}${isClient ? '' : '66'}"></div></div>
        </div>
      `;
    }).join("");
    sections.push(`<div class="section"><div class="section-title">Competitors</div>${bars}<div class="muted" style="margin-top:8px">Estimated position: <strong>${data.estPosition}</strong> in Google Maps</div></div>`);
  }

  // ── 6-Month Journey ──
  if (show("timeline") && data.monthHistory) {
    const maxScore = Math.max(...data.monthHistory.map(m => m.score), 1);
    const barChart = data.monthHistory.map((m, i) => {
      const h = Math.max(8, Math.round((m.score / 100) * 80));
      const isLast = i === data.monthHistory.length - 1;
      const col = sc(m.score);
      return `
        <div class="timeline-col">
          <div class="timeline-val" style="color:${isLast ? col : '#94a3b8'}">${m.score}</div>
          <div class="timeline-bar" style="height:${h}px;background:${isLast ? col + '88' : '#3b82f644'};${isLast ? 'border:2px solid ' + col : ''}"></div>
          <div class="timeline-label" style="${isLast ? 'color:#06b6d4;font-weight:700' : ''}">${m.month}</div>
          <div class="timeline-sub">${m.reviews} rev</div>
        </div>
      `;
    }).join("");
    sections.push(`<div class="section"><div class="section-title">6-Month Journey</div><div class="timeline-chart">${barChart}</div></div>`);
  }

  // ── Actions ──
  if (show("actions") && data.quickWins.length > 0) {
    const items = data.quickWins.map((qw, i) => `
      <div class="action-item">
        <div class="action-num" style="background:${qw.impact === 'high' ? '#f9731622' : '#3b82f622'};color:${qw.impact === 'high' ? '#f97316' : '#3b82f6'}">${qw.priority}</div>
        <div class="action-body">
          <div class="action-title">${qw.action}</div>
          <div class="action-why"><strong>Why:</strong> ${qw.why}</div>
          <div class="action-how"><strong>How:</strong> ${qw.how}</div>
          <div class="action-tags"><span class="tag">${qw.effort}</span><span class="tag ${qw.impact}">${qw.impact === 'high' ? 'High Impact' : 'Medium Impact'}</span></div>
        </div>
      </div>
    `).join("");
    sections.push(`<div class="section"><div class="section-title">Actions Needed</div>${items}</div>`);
  }

  // ── Next Period Plan ──
  if (show("plan") && data.monthPriorities.length > 0) {
    const items = data.monthPriorities.map((p, i) => `
      <div class="action-item">
        <div class="action-num" style="background:#3b82f622;color:#3b82f6">${i + 1}</div>
        <div class="action-body">
          <div class="action-title">${p.title}</div>
          <div class="action-why">${p.description}</div>
          <div class="action-kpi">${p.kpi}</div>
        </div>
      </div>
    `).join("");
    sections.push(`<div class="section"><div class="section-title">Plan for Next Period</div>${items}</div>`);
  }

  // ── Footer ──
  sections.push(`
    <div class="footer">
      <p>${data.name} &middot; ${periodLabel}</p>
      <p>Generated by <strong>Zenith</strong> &middot; ${data.dateStr}</p>
    </div>
  `);

  // ── Full HTML ──
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Report — ${data.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; }
  .page { max-width: 780px; margin: 0 auto; padding: 32px 40px; }

  .cover { background: linear-gradient(135deg, #0f1729, #1a2236); color: #e2e8f0; padding: 36px; border-radius: 16px; margin-bottom: 24px; }
  .cover-label { font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .cover-name { font-size: 26px; font-weight: 900; margin-bottom: 4px; }
  .cover-meta { font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
  .cover-period { font-size: 12px; color: #06b6d4; font-weight: 600; }

  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section-title { font-size: 15px; font-weight: 800; color: #1a1a2e; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 14px; }

  .score-hero { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 16px 0; }
  .score-num { font-size: 36px; font-weight: 900; }
  .score-num.muted { color: #94a3b8; font-size: 28px; }
  .score-label-sm { font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; margin-bottom: 4px; }
  .score-arrow { font-size: 22px; font-weight: 900; color: #94a3b8; }
  .score-delta { font-size: 14px; font-weight: 700; padding: 6px 12px; border-radius: 8px; }
  .score-before, .score-after { text-align: center; }

  .bar-row { margin-bottom: 12px; }
  .bar-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #475569; }
  .bar-track { background: #f1f5f9; border-radius: 99px; height: 8px; overflow: hidden; }
  .bar-fill { height: 8px; border-radius: 99px; }

  .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .metric-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .metric-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
  .metric-value { font-size: 24px; font-weight: 900; color: #06b6d4; }
  .metric-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .metric-delta { font-size: 11px; margin-top: 4px; font-weight: 600; }

  .photos-row { display: flex; align-items: center; gap: 14px; }
  .photos-num { font-size: 32px; font-weight: 900; }

  .timeline-chart { display: flex; align-items: flex-end; gap: 8px; }
  .timeline-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .timeline-val { font-size: 12px; font-weight: 700; }
  .timeline-bar { width: 100%; border-radius: 4px 4px 0 0; }
  .timeline-label { font-size: 10px; color: #94a3b8; }
  .timeline-sub { font-size: 9px; color: #94a3b8; }

  .action-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .action-num { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; flex-shrink: 0; }
  .action-body { flex: 1; }
  .action-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .action-why { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 3px; }
  .action-how { font-size: 12px; color: #06b6d4; line-height: 1.5; margin-bottom: 4px; }
  .action-kpi { font-size: 11px; color: #06b6d4; font-weight: 600; }
  .action-tags { display: flex; gap: 6px; }
  .tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; color: #64748b; }
  .tag.high { background: #f9731618; color: #f97316; font-weight: 600; }
  .tag.medium { background: #f59e0b18; color: #f59e0b; font-weight: 600; }

  .muted { font-size: 12px; color: #94a3b8; }
  .footer { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-top: 24px; }
  .footer p { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
  .footer strong { color: #06b6d4; }

  @media print {
    body { padding: 0; }
    .page { padding: 16px; }
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { page-break-inside: avoid; }
    .bar-fill, .timeline-bar, .metric-card, .tag, .action-num, .score-delta {
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
  }
</style>
</head><body><div class="page">${sections.join("")}</div></body></html>`;
}

/**
 * Open PDF in new tab and trigger print dialog
 */
export function downloadReportPDF(data, visibleSections, periodLabel) {
  const html = generateReportPDF(data, visibleSections, periodLabel);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 600);
    };
  }
}
