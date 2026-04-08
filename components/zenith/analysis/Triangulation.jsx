"use client";
import { C, sc } from "../constants/colors";
import { Card, Badge, ProgressBar, ScoreCircle, Rec } from "../shared";

export default function Triangulation({ client, onNavigate }) {
  const sem = client.semanticData || {};
  const desc = (client.description || "").toLowerCase();
  const reviewsData = client.reviewsData || {};
  const samples = reviewsData.samples || [];
  const posts = client.posts || [];
  const photos = client.photos || {};

  // Service terms to look for across all channels
  const svcTerms = (client.services || [])
    .flatMap(s => s.toLowerCase().split(/\s+/))
    .filter(w => w.length > 4);
  const uniqueSvcTerms = [...new Set(svcTerms)];

  const allReviewText = samples.map(r => r.text.toLowerCase()).join(" ");
  const allPostText = posts.map(p => p.text.toLowerCase()).join(" ");

  // Per-channel coverage
  const descHits = uniqueSvcTerms.filter(t => desc.includes(t));
  const reviewHits = uniqueSvcTerms.filter(t => allReviewText.includes(t));
  const postHits = uniqueSvcTerms.filter(t => allPostText.includes(t));

  // Niche channel weights — which channels matter most per niche
  const CHANNEL_WEIGHTS = {
    "Home Renovation Contractor": { desc: 35, reviews: 30, posts: 20, photos: 15 },
    "Dentist":                    { desc: 25, reviews: 40, posts: 20, photos: 15 },
    "HVAC Contractor":            { desc: 30, reviews: 30, posts: 25, photos: 15 },
    "Plumber":                    { desc: 28, reviews: 32, posts: 25, photos: 15 },
    "Family Law Attorney":        { desc: 40, reviews: 35, posts: 15, photos: 10 },
    "Digital Marketing Agency":   { desc: 35, reviews: 30, posts: 25, photos: 10 },
    "Car Detailing Service":      { desc: 20, reviews: 30, posts: 20, photos: 30 },
    "Landscaping Company":        { desc: 22, reviews: 28, posts: 20, photos: 30 },
  };
  const cw = CHANNEL_WEIGHTS[client.category] || { desc: 30, reviews: 30, posts: 25, photos: 15 };

  // Score each channel
  const totalTerms = Math.max(uniqueSvcTerms.length, 1);

  const descScore = Math.round(
    (descHits.length / totalTerms) * 50 +
    (sem.layers >= 4 ? 30 : sem.layers * 7) +
    (sem.geoTerms >= 2 ? 20 : sem.geoTerms * 10)
  );
  const reviewScore = Math.round(
    (reviewHits.length / totalTerms) * 50 +
    ((reviewsData.average || 0) >= 4.5 ? 25 : (reviewsData.average || 0) * 5) +
    ((reviewsData.withResponse || 0) / Math.max(reviewsData.total || 1, 1)) * 25
  );
  const postScore = posts.length === 0 ? 0 : Math.round(
    (postHits.length / totalTerms) * 40 +
    (posts.length >= 4 ? 30 : posts.length * 7) +
    (Math.floor((new Date() - new Date(posts[0]?.date)) / 86400000) <= 14 ? 30 : 10)
  );
  const photoScore = Math.round(
    (photos.total >= 20 ? 40 : (photos.total / 20) * 40) +
    (photos.hasTeam ? 20 : 0) +
    (photos.hasCoverPhoto ? 20 : 0) +
    (Math.floor((new Date() - new Date(photos.lastUpload)) / 86400000) <= 30 ? 20 : 5)
  );

  const cappedDesc = Math.min(100, descScore);
  const cappedReview = Math.min(100, reviewScore);
  const cappedPost = Math.min(100, postScore);
  const cappedPhoto = Math.min(100, photoScore);

  // Weighted triangulation score
  const triScore = Math.round(
    cappedDesc * (cw.desc / 100) +
    cappedReview * (cw.reviews / 100) +
    cappedPost * (cw.posts / 100) +
    cappedPhoto * (cw.photos / 100)
  );

  const pillars = [
    {
      id: "description", title: "Descrição", score: cappedDesc, color: C.blue, weight: cw.desc,
      items: [
        { label: `${descHits.length}/${totalTerms} termos de serviço presentes`, ok: descHits.length >= 3 },
        { label: `${sem.layers}/4 camadas da ontologia`, ok: sem.layers >= 3 },
        { label: `${sem.geoTerms} sinais geográficos`, ok: (sem.geoTerms || 0) >= 2 },
        { label: `${sem.chunks} chunks autônomos`, ok: (sem.chunks || 0) >= 2 },
        { label: `${client.descriptionLength || 0} chars (meta: 700+)`, ok: (client.descriptionLength || 0) >= 700 },
      ],
      terms: descHits,
      gap: descHits.length < uniqueSvcTerms.length ? uniqueSvcTerms.filter(t => !desc.includes(t)).slice(0, 3) : [],
    },
    {
      id: "reviews", title: "Reviews", score: cappedReview, color: C.cyan, weight: cw.reviews,
      items: [
        { label: `${reviewHits.length}/${totalTerms} termos confirmados em reviews`, ok: reviewHits.length >= 3 },
        { label: `Rating: ${reviewsData.average || 0} ★ (meta: 4.5+)`, ok: (reviewsData.average || 0) >= 4.5 },
        { label: `Taxa de resposta: ${Math.round((reviewsData.withResponse || 0) / Math.max(reviewsData.total || 1, 1) * 100)}%`, ok: (reviewsData.withResponse || 0) / Math.max(reviewsData.total || 1, 1) >= 0.8 },
        { label: `${reviewsData.last30days || 0} reviews últimos 30 dias`, ok: (reviewsData.last30days || 0) >= 3 },
        { label: `${reviewsData.negativeUnanswered || 0} negativos sem resposta`, ok: (reviewsData.negativeUnanswered || 0) === 0 },
      ],
      terms: reviewHits,
      gap: reviewHits.length < uniqueSvcTerms.length ? uniqueSvcTerms.filter(t => !allReviewText.includes(t)).slice(0, 3) : [],
    },
    {
      id: "posts", title: "Posts", score: cappedPost, color: C.yellow, weight: cw.posts,
      items: [
        { label: `${postHits.length}/${totalTerms} termos de serviço em posts`, ok: postHits.length >= 2 },
        { label: `${posts.length} posts publicados`, ok: posts.length >= 4 },
        { label: posts[0] ? `Último post: ${Math.floor((new Date() - new Date(posts[0].date)) / 86400000)}d atrás` : "Nenhum post", ok: posts[0] ? Math.floor((new Date() - new Date(posts[0].date)) / 86400000) <= 14 : false },
        { label: `Mix de tipos: ${[...new Set(posts.map(p => p.type))].join(", ") || "—"}`, ok: posts.length >= 2 },
        { label: "CTA com cidade + serviço", ok: posts.some(p => p.text?.toLowerCase().includes(client.city?.toLowerCase() || "")) },
      ],
      terms: postHits,
      gap: postHits.length < uniqueSvcTerms.length ? uniqueSvcTerms.filter(t => !allPostText.includes(t)).slice(0, 3) : [],
    },
    {
      id: "photos", title: "Fotos", score: cappedPhoto, color: C.green, weight: cw.photos,
      items: [
        { label: `${photos.total || 0} fotos (meta: 20+)`, ok: (photos.total || 0) >= 20 },
        { label: "Foto de capa definida", ok: !!photos.hasCoverPhoto },
        { label: "Fotos de equipe presentes", ok: !!photos.hasTeam },
        { label: `Upload recente: ${photos.lastUpload ? Math.floor((new Date() - new Date(photos.lastUpload)) / 86400000) + "d" : "nunca"}`, ok: photos.lastUpload ? Math.floor((new Date() - new Date(photos.lastUpload)) / 86400000) <= 30 : false },
        { label: `Mix: ${photos.work || 0} trabalho · ${photos.interior || 0} interior · ${photos.team || 0} equipe`, ok: (photos.work || 0) >= 5 && (photos.team || 0) >= 2 },
      ],
      terms: [],
      gap: [],
    },
  ];

  // Alignment matrix — which service terms are covered where
  const matrixTerms = uniqueSvcTerms.slice(0, 8);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Triangulação Semântica — {client.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onNavigate && onNavigate("response")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.yellow + "44", background: C.yellow + "15", color: C.yellow, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⭐ Solicitar Reviews</button>
          <button onClick={() => onNavigate && onNavigate("optimize")} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid " + C.blue + "44", background: C.blue + "15", color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✨ Otimizar Descrição</button>
        </div>
      </div>

      {/* Overall tri score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ textAlign: "center", border: `1px solid ${sc(triScore)}44` }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TRIANGULAÇÃO SCORE</div>
          <ScoreCircle score={triScore} size={100} />
          <div style={{ marginTop: 12, fontSize: 12, color: C.textDim, lineHeight: 1.6 }}>
            {triScore >= 70 ? "Entidade forte — Google valida a consistência semântica." : triScore >= 45 ? "Alinhamento parcial — alguns canais precisam de atenção." : "Triangulação fraca — os canais contam histórias diferentes."}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>
            Peso por nicho:<br/>{cw.desc}% desc · {cw.reviews}% rev · {cw.posts}% posts · {cw.photos}% fotos
          </div>
        </Card>

        {/* Channel weight bars */}
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>Score por Canal — Pesos Calibrados para {client.category?.split(" ")[0]}</div>
          {pillars.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.title}</span>
                  <Badge label={`peso ${p.weight}%`} color={p.color} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: p.score >= 70 ? C.green : p.score >= 45 ? C.yellow : C.red }}>{p.score}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>contribui {Math.round(p.score * p.weight / 100)} pts</span>
                </div>
              </div>
              <ProgressBar value={p.score} color={p.score >= 70 ? C.green : p.score >= 45 ? C.yellow : C.red} />
            </div>
          ))}
        </Card>
      </div>

      {/* Detailed pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16 }}>
        {pillars.map(p => (
          <Card key={p.id} style={{ border: `1px solid ${p.color}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.title}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: p.score >= 70 ? C.green : p.score >= 45 ? C.yellow : C.red }}>{p.score}</span>
                {onNavigate && <button onClick={() => onNavigate(p.id)} style={{ fontSize: 10, color: C.cyan, background: "transparent", border: `1px solid ${C.cyan}44`, borderRadius: 5, padding: "2px 7px", cursor: "pointer" }}>Ir →</button>}
              </div>
            </div>
            <ProgressBar value={p.score} color={p.color} />
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {p.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12 }}>
                  <span style={{ color: item.ok ? C.green : C.red, fontWeight: 700, flexShrink: 0 }}>{item.ok ? "✓" : "✗"}</span>
                  <span style={{ color: item.ok ? C.textDim : C.textMuted, lineHeight: 1.4 }}>{item.label}</span>
                </div>
              ))}
            </div>
            {p.terms.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {p.terms.slice(0, 5).map(t => <Badge key={t} label={t} color={C.green} />)}
              </div>
            )}
            {p.gap.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10, color: C.red, marginBottom: 4 }}>Termos ausentes neste canal:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.gap.map(t => <Badge key={t} label={t} color={C.red} />)}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Service term alignment matrix */}
      {matrixTerms.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Matriz de Cobertura por Termo de Serviço</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Quais termos aparecem em cada canal — o ideal é verde em todos.</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: "6px 10px", textAlign: "left", color: C.textMuted, fontWeight: 700 }}>Termo</th>
                  {["Descrição", "Reviews", "Posts", "Fotos*"].map(h => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: "center", color: C.textMuted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixTerms.map(term => {
                  const inDesc = desc.includes(term);
                  const inRev = allReviewText.includes(term);
                  const inPost = allPostText.includes(term);
                  const covered = [inDesc, inRev, inPost].filter(Boolean).length;
                  return (
                    <tr key={term} style={{ borderTop: `1px solid ${C.border}`, background: covered >= 3 ? `${C.green}08` : covered === 0 ? `${C.red}08` : "transparent" }}>
                      <td style={{ padding: "7px 10px", fontFamily: "monospace", fontSize: 11, color: C.text }}>{term}</td>
                      {[inDesc, inRev, inPost, false].map((ok, i) => (
                        <td key={i} style={{ padding: "7px 10px", textAlign: "center" }}>
                          <span style={{ color: ok ? C.green : C.red, fontWeight: 700 }}>{ok ? "✓" : "—"}</span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8 }}>* Fotos não têm texto analisável — validação via visão computacional do Google.</div>
          </div>
        </Card>
      )}

      {/* Recommendation */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>💡 Como Fortalecer a Triangulação</div>
        {[
          { type: triScore >= 70 ? "ok" : "error", text: `Score atual: ${triScore}/100. ${triScore >= 70 ? "Triangulação forte — mantenha a consistência entre os canais." : "Triangulação fraca — o Google vê inconsistência entre o que você descreve e o que os clientes confirmam."}` },
          { type: "tip", text: `Canal mais fraco: ${pillars.sort((a, b) => a.score - b.score)[0].title} (${pillars.sort((a, b) => a.score - b.score)[0].score}/100). Priorize melhorias aqui.` },
          { type: "tip", text: "Oriente clientes a mencionar serviços específicos nas avaliações — 'kitchen remodeling' vale mais que 'great work'." },
          { type: "tip", text: `${uniqueSvcTerms.length - reviewHits.length} termos de serviço ainda não foram mencionados em reviews. Use o template de solicitação na aba Reviews.` },
        ].map((r, i) => <Rec key={i} type={r.type} text={r.text} />)}
      </Card>
    </div>
  );
}

