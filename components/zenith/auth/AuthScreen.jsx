"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { useLang } from "../contexts/LangContext";
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from "@/lib/auth";

const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({ onLogin }) {
  const { lang, setLang, t } = useLang();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleGoogle = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800));
        onLogin({ name: "Agency User", email: "demo@agency.com", via: "google", demo: true });
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      setError(err.message || t.auth_errGoogle);
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    setError(""); setSuccess("");
    if (!form.email || !emailRegex.test(form.email)) { setError(t.auth_errEmail); return; }
    if (mode !== "forgot" && form.password.length < 8) { setError(t.auth_errPass); return; }
    if (mode === "register" && !form.name.trim()) { setError(t.auth_errName); return; }
    if (mode === "register" && form.name.trim().length < 2) { setError(t.auth_errNameLen); return; }

    setLoading(true);
    try {
      if (mode === "forgot") {
        if (!isDemo) await resetPassword(form.email);
        else await new Promise(r => setTimeout(r, 600));
        setForgotSent(true);
        return;
      }

      if (isDemo) {
        await new Promise(r => setTimeout(r, 800));
        onLogin({ name: form.name || form.email.split("@")[0], email: form.email, via: "email", demo: true });
      } else if (mode === "login") {
        const user = await signInWithEmail(form.email, form.password);
        onLogin({ name: user.user_metadata?.full_name || form.email.split("@")[0], email: form.email, via: "email", id: user.id });
      } else {
        await signUpWithEmail(form.email, form.password, form.name);
        setSuccess(t.auth_successCreate);
        setLoading(false);
        setTimeout(async () => {
          try {
            const user = await signInWithEmail(form.email, form.password);
            onLogin({ name: form.name, email: form.email, via: "email", id: user.id });
          } catch {
            setSuccess("");
            setMode("login");
            setError(t.auth_successLogin);
          }
        }, 1500);
        return;
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError(t.auth_errDup);
      } else if (msg.includes("Invalid login")) {
        setError(t.auth_errCred);
      } else if (msg.includes("rate") || msg.includes("security")) {
        setError(t.auth_errRate);
      } else {
        setError(msg || t.auth_errGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "12px 16px", background: C.bgCard,
    border: `1px solid ${C.border}`, borderRadius: 8, color: C.text,
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 38, fontWeight: 900, fontFamily: "var(--font-zenith), 'Orbitron', sans-serif", letterSpacing: 6, background: `linear-gradient(135deg,${C.blue},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>ZENITH</div>
          <div style={{ color: C.textMuted, fontSize: 13 }}>{t.auth_subtitle}</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32 }}>
          {mode !== "forgot" && (
            <div style={{ display: "flex", marginBottom: 24, background: C.bg, borderRadius: 8, padding: 4 }}>
              {[["login", t.auth_signIn], ["register", t.auth_createAccount]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setForgotSent(false); }} style={{
                  flex: 1, padding: "9px 0", borderRadius: 6, border: "none",
                  background: mode === m ? C.blue : "transparent",
                  color: mode === m ? "#fff" : C.textMuted,
                  fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                }}>{l}</button>
              ))}
            </div>
          )}
          {mode === "forgot" && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => { setMode("login"); setForgotSent(false); setError(""); }} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 13, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>{t.auth_backLogin}</button>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 6 }}>{t.auth_resetTitle}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{t.auth_resetDesc}</div>
            </div>
          )}
          {forgotSent ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <div style={{ fontWeight: 700, color: C.green, fontSize: 16, marginBottom: 8 }}>{t.auth_checkInbox}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>{t.auth_resetSent}<br /><strong style={{ color: C.text }}>{form.email}</strong></div>
              <button onClick={() => { setMode("login"); setForgotSent(false); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: C.blue, color: "#fff", fontWeight: 700, cursor: "pointer" }}>{t.auth_backLogin}</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "register" && (
                <input style={inp} placeholder={t.auth_name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              )}
              <input style={inp} placeholder={t.auth_email} type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
              {mode !== "forgot" && (
                <div>
                  <div style={{ position: "relative" }}>
                    <input style={inp} placeholder={t.auth_password} type={showPass ? "text" : "password"} value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      onKeyDown={e => e.key === "Enter" && !loading && handleEmail()} />
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                  {mode === "login" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                      <button onClick={() => { setMode("forgot"); setError(""); }} style={{ background: "none", border: "none", color: C.cyan, cursor: "pointer", fontSize: 11, padding: 0 }}>{t.auth_forgot}</button>
                    </div>
                  )}
                </div>
              )}
              <div style={{ minHeight: 40, display: "flex", alignItems: "center" }}>
                {error && <div style={{ color: C.red, fontSize: 13, padding: "8px 12px", background: C.red + "12", borderRadius: 6, width: "100%" }}>{error}</div>}
                {success && <div style={{ color: C.green, fontSize: 13, padding: "8px 12px", background: C.green + "12", borderRadius: 6, width: "100%" }}>{success}</div>}
              </div>
              <button onClick={handleEmail} disabled={loading || !!success} style={{
                width: "100%", padding: "13px 0", borderRadius: 8, border: "none", marginTop: 4,
                background: (loading || success) ? C.border : `linear-gradient(135deg,${C.blue},${C.cyan})`,
                color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: (loading || success) ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}>
                {loading ? t.auth_wait : success ? t.auth_redirect : mode === "login" ? t.auth_signIn : mode === "register" ? t.auth_createAccount : t.auth_sendLink}
              </button>
              {mode !== "forgot" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 1, background: C.border }}/>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{t.auth_or}</span>
                    <div style={{ flex: 1, height: 1, background: C.border }}/>
                  </div>
                  <button onClick={handleGoogle} disabled={loading} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
                    background: "transparent", color: C.text,
                    fontWeight: 600, fontSize: 13, cursor: loading ? "wait" : "pointer",
                    transition: "all 0.2s",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    {loading ? t.auth_connecting : t.auth_google}
                  </button>
                </>
              )}
              {mode === "register" && (
                <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center", lineHeight: 1.6 }}>
                  {t.auth_terms}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ marginTop: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: 1.2 }}>ZENITH PRO — {t.auth_news}</div>
          {t.auth_features.map(f => (
            <div key={f} style={{ fontSize: 11, color: C.textDim, padding: "2px 0" }}>✓ {f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
