import { useState, useEffect, useRef } from "react";

const CEILING_TYPES = [
  { value: 500,  label: "Матовый",         hint: "от 500 ₽/м²" },
  { value: 600,  label: "Глянцевый",       hint: "от 600 ₽/м²" },
  { value: 1300, label: "Теневой",         hint: "от 1 300 ₽/м²" },
  { value: 1800, label: "Световые линии",  hint: "от 1 800 ₽/м²" },
];

function NumInput({ label, hint, value, onChange, placeholder, min = 0, optional = false }: {
  label: string; hint?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  min?: number; optional?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(232,234,242,0.4)" }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: "rgba(232,234,242,0.25)" }}>{hint}</span>}
        {optional && <span style={{ fontSize: 10, color: "rgba(0,255,224,0.4)", letterSpacing: "0.08em" }}>необязательно</span>}
      </div>
      <input
        type="number" min={min} placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "12px 16px", fontFamily: "inherit", fontSize: 15, color: "#e8eaf2", outline: "none", transition: "border-color 0.2s,box-shadow 0.2s", appearance: "none" as const }}
        onFocus={e => { e.target.style.borderColor = "rgba(0,255,224,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,224,0.08)"; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function CheckRow({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, border: `1px solid ${checked ? "rgba(0,255,224,0.5)" : "rgba(255,255,255,0.15)"}`, background: checked ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", marginTop: 1 }}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L3.8 7.5L10 1" stroke="#00ffe0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 14, color: "rgba(232,234,242,0.8)", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 12, color: "rgba(232,234,242,0.35)" }}>{sub}</div>
      </div>
    </label>
  );
}

export default function Calculator() {
  const [area, setArea] = useState("");
  const [type, setType] = useState(500);
  const [spots, setSpots] = useState(false);
  const [spotsCount, setSpotsCount] = useState("");
  const [chandCount, setChandCount] = useState("1");
  const [hasChand, setHasChand] = useState(false);
  const [hasPerimeter, setHasPerimeter] = useState(false);
  const [perimeterM, setPerimeterM] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [sent, setSent] = useState(false);

  const [displayPrice, setDisplayPrice] = useState(0);
  const priceRef = useRef(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const price = (() => {
    const a = parseFloat(area) || 0;
    const sp = spots ? (parseInt(spotsCount) || 0) * 300 : 0;
    const ch = hasChand ? (parseInt(chandCount) || 1) * 800 : 0;
    const per = hasPerimeter ? (parseFloat(perimeterM) || 0) * 450 : 0;
    return Math.round(a * type + sp + ch + per);
  })();

  useEffect(() => {
    if (animRef.current) clearTimeout(animRef.current);
    const target = price;
    const start = priceRef.current;
    const diff = target - start;
    const steps = 12;
    let step = 0;
    const tick = () => {
      step++;
      priceRef.current = Math.round(start + diff * (step / steps));
      setDisplayPrice(priceRef.current);
      if (step < steps) animRef.current = setTimeout(tick, 18);
      else priceRef.current = target;
    };
    tick();
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [price]);

  function formatPhone(raw: string) {
    let v = raw.replace(/\D/g, "");
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (v.length > 0 && !v.startsWith("7")) v = "7" + v;
    v = v.slice(0, 11);
    let out = "";
    if (v.length > 0) out = "+7";
    if (v.length > 1) out += " (" + v.slice(1, 4);
    if (v.length >= 4) out += ") " + v.slice(4, 7);
    if (v.length >= 7) out += "-" + v.slice(7, 9);
    if (v.length >= 9) out += "-" + v.slice(9, 11);
    return out;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = phone.replace(/\D/g, "");
    if (raw.length < 11) { setPhoneError(true); return; }
    setPhoneError(false);
    setSent(true);
  }

  const selectedType = CEILING_TYPES.find(t => t.value === type)!;

  return (
    <section style={{ position: "relative", background: "#04050d", color: "#e8eaf2", padding: "100px 24px", overflow: "hidden", fontFamily: "'Golos Text', system-ui, sans-serif" }} id="form">
      {/* BG */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 55% at 5% 40%,rgba(0,255,224,0.07) 0%,transparent 55%),radial-gradient(ellipse 55% 50% at 95% 20%,rgba(123,92,255,0.09) 0%,transparent 55%),radial-gradient(ellipse 45% 40% at 50% 100%,rgba(255,107,157,0.05) 0%,transparent 50%),linear-gradient(180deg,#04050d 0%,#060912 50%,#04050d 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 450, height: 350, borderRadius: "50%", filter: "blur(90px)", background: "radial-gradient(circle,rgba(0,255,224,0.10),transparent 65%)", top: -80, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", filter: "blur(90px)", background: "radial-gradient(circle,rgba(123,92,255,0.10),transparent 65%)", bottom: -80, right: -80, pointerEvents: "none" }} />
      <svg style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none", width: "100%", height: "100%" }}>
        <defs><pattern id="calcGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0L0 0 0 80" fill="none" stroke="#7b5cff" strokeWidth="0.6" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#calcGrid)" />
      </svg>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid rgba(0,255,224,0.2)", background: "rgba(0,255,224,0.05)", backdropFilter: "blur(16px)", borderRadius: 100, padding: "7px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#00ffe0", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ffe0", display: "inline-block", boxShadow: "0 0 0 0 rgba(0,255,224,0.6)", animation: "ripple 2s ease-out infinite" }} />
            Онлайн-калькулятор
          </div>
          <h2 style={{ fontWeight: 900, fontSize: "clamp(24px,3.8vw,48px)", lineHeight: 1.08, letterSpacing: "-0.025em", color: "#fff", marginBottom: 16 }}>
            Рассчитайте стоимость<br />
            <span style={{ background: "linear-gradient(100deg,#00ffe0 0%,#7b5cff 55%,#ff6b9d 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", backgroundSize: "200% auto", animation: "gradShift 6s ease infinite" }}>
              натяжного потолка в Геленджике
            </span>
          </h2>
          <p style={{ fontSize: 16, fontWeight: 300, color: "rgba(232,234,242,0.5)", lineHeight: 1.6 }}>
            Получите примерную цену за 1 минуту — без звонков и обязательств
          </p>
        </div>

        {/* Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24, alignItems: "start" }}>

          {/* Left: image + pills */}
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 560, border: "1px solid rgba(255,255,255,0.07)" }}>
            <img
              src="https://images.unsplash.com/photo-1616137466211-f939a420be84?w=800&q=80&auto=format&fit=crop"
              alt="натяжные потолки в Геленджике интерьер"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.65) saturate(0.85)", position: "absolute", inset: 0 }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(4,5,13,0.2) 0%,transparent 30%,transparent 60%,rgba(4,5,13,0.9) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 28, left: 28, right: 28, zIndex: 2 }}>
              <h3 style={{ fontWeight: 800, fontSize: 20, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>Бесплатный замер<br />уже сегодня</h3>
              <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,234,242,0.6)", lineHeight: 1.5, marginBottom: 16 }}>Выезжаем в день обращения<br />по Геленджику и округу</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["от 1 дня", "без пыли", "гарантия 15 лет"].map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 500, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "rgba(232,234,242,0.85)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ffe0", boxShadow: "0 0 5px rgba(0,255,224,0.7)", display: "inline-block" }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: card */}
          <div style={{ position: "relative", borderRadius: 16, border: "1px solid rgba(0,255,224,0.15)", background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", padding: "36px 36px 32px", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(0,255,224,0.04),transparent 55%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", filter: "blur(60px)", top: -80, right: -60, opacity: 0.4, background: "rgba(0,255,224,0.15)", pointerEvents: "none" }} />

            {!sent ? (
              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 20 }}>

                  <NumInput label="Площадь помещения" hint="м²" value={area} onChange={setArea} placeholder="Например: 20" min={1} />

                  {/* Type selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(232,234,242,0.4)" }}>Тип потолка</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {CEILING_TYPES.map(ct => (
                        <button key={ct.value} onClick={() => setType(ct.value)} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${type === ct.value ? "rgba(0,255,224,0.4)" : "rgba(255,255,255,0.08)"}`, background: type === ct.value ? "rgba(0,255,224,0.08)" : "rgba(255,255,255,0.03)", color: type === ct.value ? "#00ffe0" : "rgba(232,234,242,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, textAlign: "left" as const, lineHeight: 1.3, transition: "all 0.2s" }}>
                          <div>{ct.label}</div>
                          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{ct.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lighting */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(232,234,242,0.4)" }}>Освещение</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <CheckRow checked={spots} onChange={setSpots} label="Точечные светильники" sub="+300 ₽ за штуку" />
                      {spots && (
                        <div style={{ paddingLeft: 32 }}>
                          <NumInput label="Количество светильников" value={spotsCount} onChange={setSpotsCount} placeholder="Например: 6" min={1} />
                        </div>
                      )}
                      <CheckRow checked={hasChand} onChange={setHasChand} label="Люстра" sub="+800 ₽ за штуку" />
                      {hasChand && (
                        <div style={{ paddingLeft: 32 }}>
                          <NumInput label="Количество люстр" value={chandCount} onChange={setChandCount} placeholder="Например: 1" min={1} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Perimeter */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(232,234,242,0.4)" }}>Вставка по периметру</span>
                    <CheckRow checked={hasPerimeter} onChange={setHasPerimeter} label="Световая вставка по периметру" sub="+450 ₽ за погонный метр" />
                    {hasPerimeter && (
                      <div style={{ paddingLeft: 32 }}>
                        <NumInput label="Длина периметра" hint="пог. м" value={perimeterM} onChange={setPerimeterM} placeholder="Например: 18" min={1} optional />
                      </div>
                    )}
                  </div>

                </div>

                {/* Result */}
                <div style={{ background: "rgba(0,255,224,0.05)", border: "1px solid rgba(0,255,224,0.18)", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(0,255,224,0.6)", marginBottom: 4 }}>Примерная стоимость</div>
                    <div style={{ fontWeight: 900, fontSize: "clamp(26px,3.5vw,38px)", color: "#fff", lineHeight: 1, transition: "opacity 0.15s" }}>
                      {displayPrice > 0 ? displayPrice.toLocaleString("ru-RU") + " ₽" : "0 ₽"}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(232,234,242,0.4)", marginTop: 4 }}>Точная цена — после замера</div>
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,255,224,0.08)", border: "1px solid rgba(0,255,224,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#00ffe0" strokeWidth="1.5" strokeLinejoin="round" />
                      <circle cx="12" cy="9" r="2.5" stroke="#00ffe0" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)", margin: "0 0 20px" }} />

                {/* Lead form */}
                <form onSubmit={handleSubmit}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>Получите точный расчёт</div>
                  <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(232,234,242,0.45)", marginBottom: 16 }}>Перезвоним в течение 10 минут — бесплатно</div>

                  {/* hidden data */}
                  <input type="hidden" name="Итоговая стоимость" value={displayPrice > 0 ? displayPrice.toLocaleString("ru-RU") + " ₽" : "—"} />
                  <input type="hidden" name="Площадь м²" value={area ? area + " м²" : "—"} />
                  <input type="hidden" name="Тип потолка" value={selectedType.label} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "12px 16px", fontFamily: "inherit", fontSize: 15, color: "#e8eaf2", outline: "none" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,224,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,224,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
                    />
                    <input
                      type="tel" placeholder="+7 (___) ___-__-__" value={phone}
                      onChange={e => { setPhone(formatPhone(e.target.value)); setPhoneError(false); }}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${phoneError ? "rgba(255,107,157,0.6)" : "rgba(255,255,255,0.10)"}`, borderRadius: 10, padding: "12px 16px", fontFamily: "inherit", fontSize: 15, color: "#e8eaf2", outline: "none", boxShadow: phoneError ? "0 0 0 3px rgba(255,107,157,0.12)" : "none", transition: "all 0.2s" }}
                      onFocus={e => { if (!phoneError) { e.target.style.borderColor = "rgba(0,255,224,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,224,0.08)"; } }}
                      onBlur={e => { if (!phoneError) { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; } }}
                    />
                    <button type="submit" className="calc-submit-btn" style={{ width: "100%", height: 54, borderRadius: 100, border: "none", cursor: "pointer", position: "relative", overflow: "hidden", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: "#04050d", transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,#00ffe0 0%,#00d4b8 40%,#5ba0ff 100%)", backgroundSize: "200% auto" }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: 100, boxShadow: "0 0 28px rgba(0,255,224,0.38),0 0 60px rgba(0,255,224,0.12)" }} />
                      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        Получить точный расчёт
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M3 9h12M10 5l4 4-4 4" stroke="#04050d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  </div>
                </form>

                <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
                  {["Расчёт бесплатный", "Без обязательств", "Ответ за 10 минут"].map(t => (
                    <span key={t} style={{ fontSize: 12, color: "rgba(232,234,242,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ffe0", opacity: 0.6, display: "inline-block" }} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 0 20px", animation: "riseIn 0.5s ease both" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,255,224,0.08)", border: "1px solid rgba(0,255,224,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <circle cx="15" cy="15" r="13.5" stroke="#00ffe0" strokeWidth="1.2" />
                    <path d="M9 15.5l4 4 8-8" stroke="#00ffe0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h4 style={{ fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 10 }}>Заявка отправлена!</h4>
                <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(232,234,242,0.5)", lineHeight: 1.7 }}>
                  Перезвоним в течение 10 минут.<br />Геленджик и Геленджикский округ.
                </p>
                {displayPrice > 0 && (
                  <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(0,255,224,0.05)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 12 }}>
                    <div style={{ fontSize: 11, color: "rgba(0,255,224,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6 }}>Ваш расчёт</div>
                    <div style={{ fontWeight: 900, fontSize: 28, color: "#fff" }}>{displayPrice.toLocaleString("ru-RU")} ₽</div>
                  </div>
                )}
              </div>
            )}

            <style>{`
              .calc-submit-btn:hover { transform: translateY(-2px) scale(1.02) !important; box-shadow: 0 16px 50px rgba(0,255,224,0.3) !important; }
              .calc-submit-btn:active { transform: scale(0.98) !important; }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
}
