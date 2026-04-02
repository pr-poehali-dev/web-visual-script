import { useEffect, useRef, useState } from "react";

const PALETTE = [
  { r: 255, g: 190, b: 61 },
  { r: 0, g: 255, b: 224 },
  { r: 123, g: 92, b: 255 },
  { r: 255, g: 107, b: 157 },
  { r: 0, g: 212, b: 255 },
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  baseAlpha: number; alpha: number;
  color: { r: number; g: number; b: number };
  phase: number; pulseSpeed: number;
}

interface Nebula {
  x: number; y: number; r: number;
  vx: number; vy: number;
  color: { r: number; g: number; b: number };
  alpha: number; phase: number; speed: number;
}

function useTimer(deadline: Date) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, ended: false });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      if (diff === 0) { setTime({ d: 0, h: 0, m: 0, s: 0, ended: true }); return; }
      setTime({ d: Math.floor(diff / 86400), h: Math.floor((diff % 86400) / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60, ended: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return time;
}

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const deadline = new Date(Date.UTC(2026, 3, 15, 20, 59, 59));
  const timer = useTimer(deadline);

  useEffect(() => {
    const cvs = canvasRef.current;
    const hero = heroRef.current;
    if (!cvs || !hero) return;
    const ctx = cvs.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let particles: Particle[] = [];
    let nebulae: Nebula[] = [];
    let rafId: number;

    function initNebulae() {
      nebulae = Array.from({ length: 5 }, () => {
        const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        return { x: Math.random() * W, y: Math.random() * H, r: 150 + Math.random() * 250, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2, color: c, alpha: 0.03 + Math.random() * 0.04, phase: Math.random() * Math.PI * 2, speed: 0.002 + Math.random() * 0.003 };
      });
    }

    function newParticle(): Particle {
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3, r: 1 + Math.random() * 2, baseAlpha: 0.3 + Math.random() * 0.5, alpha: 0.5, color: c, phase: Math.random() * Math.PI * 2, pulseSpeed: 0.01 + Math.random() * 0.02 };
    }

    function init() {
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = W * DPR; cvs.height = H * DPR;
      cvs.style.width = W + "px"; cvs.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = W * H < 400000 ? 60 : W * H < 1000000 ? 100 : 150;
      particles = Array.from({ length: count }, newParticle);
      initNebulae();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const mouse = mouseRef.current;

      for (const nb of nebulae) {
        nb.phase += nb.speed; nb.x += nb.vx; nb.y += nb.vy;
        if (nb.x < -nb.r) nb.x = W + nb.r; if (nb.x > W + nb.r) nb.x = -nb.r;
        if (nb.y < -nb.r) nb.y = H + nb.r; if (nb.y > H + nb.r) nb.y = -nb.r;
        const a = nb.alpha * (0.7 + 0.3 * Math.sin(nb.phase));
        const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r);
        g.addColorStop(0, `rgba(${nb.color.r},${nb.color.g},${nb.color.b},${a})`);
        g.addColorStop(0.5, `rgba(${nb.color.r},${nb.color.g},${nb.color.b},${a * 0.3})`);
        g.addColorStop(1, `rgba(${nb.color.r},${nb.color.g},${nb.color.b},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nb.x, nb.y, nb.r, 0, Math.PI * 2); ctx.fill();
      }

      if (mouse.active) {
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        mg.addColorStop(0, "rgba(255,190,61,0.12)"); mg.addColorStop(0.4, "rgba(0,255,224,0.06)"); mg.addColorStop(1, "rgba(123,92,255,0)");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2); ctx.fill();
      }

      for (const p of particles) {
        p.phase += p.pulseSpeed;
        p.alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.phase));
        if (mouse.active) {
          const dmx = mouse.x - p.x, dmy = mouse.y - p.y;
          const d = Math.sqrt(dmx * dmx + dmy * dmy);
          if (d < 200 && d > 1) { const f = (1 - d / 200) * 0.02; p.vx += (dmx / d) * f; p.vy += (dmy / d) * f; }
        }
        p.vx *= 0.995; p.vy *= 0.995; p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`; ctx.fill();
        if (p.r > 1.5) {
          const gw = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          gw.addColorStop(0, `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha * 0.3})`);
          gw.addColorStop(1, `rgba(${p.color.r},${p.color.g},${p.color.b},0)`);
          ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const la = (1 - dist / 120) * 0.18;
            const cr = Math.round((particles[i].color.r + particles[j].color.r) / 2);
            const cg = Math.round((particles[i].color.g + particles[j].color.g) / 2);
            const cb = Math.round((particles[i].color.b + particles[j].color.b) / 2);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${la})`; ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
          }
        }
      }

      if (mouse.active) {
        for (const p of particles) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200) { ctx.strokeStyle = `rgba(255,190,61,${(1 - d / 200) * 0.3})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        }
      }

      if (Math.random() < 0.004) {
        const sx = Math.random() * W, sy = Math.random() * H * 0.5;
        const sLen = 50 + Math.random() * 100, ang = Math.PI * 0.2 + Math.random() * 0.4;
        const sg = ctx.createLinearGradient(sx, sy, sx + Math.cos(ang) * sLen, sy + Math.sin(ang) * sLen);
        sg.addColorStop(0, "rgba(255,255,220,0.9)"); sg.addColorStop(0.3, "rgba(255,190,61,0.6)"); sg.addColorStop(1, "rgba(0,255,224,0)");
        ctx.strokeStyle = sg; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(ang) * sLen, sy + Math.sin(ang) * sLen); ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    init(); draw();

    const onMove = (e: MouseEvent) => { const r = cvs.getBoundingClientRect(); mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true }; };
    const onLeave = () => { mouseRef.current.active = false; };
    const onTouch = (e: TouchEvent) => { const r = cvs.getBoundingClientRect(); mouseRef.current = { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top, active: true }; };
    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", onLeave, { passive: true });
    hero.addEventListener("touchmove", onTouch, { passive: true });
    hero.addEventListener("touchend", onLeave, { passive: true });

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(init, 150); };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseleave", onLeave);
      hero.removeEventListener("touchmove", onTouch);
      hero.removeEventListener("touchend", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const rings = ringsRef.current;
    if (!hero || !rings) return;
    let raf: number | null = null;
    let mx = 0, my = 0;
    const apply = () => { rings.style.transform = `translate(${mx}px,${my}px)`; raf = null; };
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * -20;
      my = ((e.clientY - r.top) / r.height - 0.5) * -14;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => { mx = 0; my = 0; if (!raf) raf = requestAnimationFrame(apply); };
    hero.addEventListener("mousemove", onMove, { passive: true });
    hero.addEventListener("mouseleave", onLeave, { passive: true });
    return () => { hero.removeEventListener("mousemove", onMove); hero.removeEventListener("mouseleave", onLeave); };
  }, []);

  const BULLETS = ["Фиксируем цену в договоре — без доплат", "Установим потолок уже завтра", "Чистый монтаж без пыли и мусора", "Подберём решение под ваш бюджет"];
  const PILLS = [
    { dot: "linear-gradient(135deg,#ffbe3d,#ff5050)", text: "Скидка 10% до 15 апреля 2026" },
    { dot: "#00ffe0", text: "Замер в день обращения" },
    { dot: "#7b5cff", text: "Работаем по Геленджику и округу" },
  ];
  const AVATARS = [
    { bg: "linear-gradient(135deg,#ffbe3d,#ff9d3d)", label: "АК" },
    { bg: "linear-gradient(135deg,#00ffe0,#00c8b0)", label: "МВ" },
    { bg: "linear-gradient(135deg,#7b5cff,#9b7cff)", label: "ОС" },
    { bg: "linear-gradient(135deg,#ff6b9d,#ff9b7d)", label: "ИП" },
    { bg: "linear-gradient(135deg,#ff9d3d,#ffbe3d)", label: "ДЛ" },
  ];

  return (
    <div style={{ fontFamily: "'Golos Text', system-ui, sans-serif", background: "#04050d", color: "#e8eaf2", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Golos+Text:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        a{color:inherit;text-decoration:none}
        @keyframes ripple{0%{box-shadow:0 0 0 0 rgba(255,190,61,0.6)}70%{box-shadow:0 0 0 8px rgba(255,190,61,0)}100%{box-shadow:0 0 0 0 rgba(255,190,61,0)}}
        @keyframes gradShift{0%{background-position:0% center}50%{background-position:100% center}100%{background-position:0% center}}
        @keyframes riseIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .grad-text{background:linear-gradient(100deg,#ffbe3d 0%,#ff6b9d 35%,#7b5cff 65%,#00ffe0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:300% auto;animation:gradShift 6s ease infinite}
        .a1{animation:riseIn 0.9s 0.1s cubic-bezier(0.16,1,0.3,1) both}
        .a2{animation:riseIn 0.9s 0.25s cubic-bezier(0.16,1,0.3,1) both}
        .a3{animation:riseIn 0.9s 0.4s cubic-bezier(0.16,1,0.3,1) both}
        .a4{animation:riseIn 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) both}
        .a5{animation:riseIn 0.9s 0.65s cubic-bezier(0.16,1,0.3,1) both}
        .a6{animation:riseIn 0.9s 0.8s cubic-bezier(0.16,1,0.3,1) both}
        .a7{animation:riseIn 0.9s 0.95s cubic-bezier(0.16,1,0.3,1) both}
        .cta-btn:hover{transform:translateY(-3px) scale(1.03)!important;box-shadow:0 20px 60px rgba(255,190,61,0.35),0 4px 20px rgba(0,0,0,0.5)!important}
        .cta-btn:active{transform:scale(0.98)!important}
        .pulse-dot{animation:ripple 2s ease-out infinite}
      `}</style>

      <section ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0 60px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 80% at 50% -20%,rgba(0,153,255,0.12) 0%,transparent 60%),radial-gradient(ellipse 80% 60% at -10% 80%,rgba(0,200,255,0.06) 0%,transparent 50%),linear-gradient(180deg,#04050d 0%,#060a16 50%,#04050d 100%)", zIndex: 0 }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

        <svg style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", opacity: 0.04, width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="heroGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0L0 0 0 80" fill="none" stroke="#ffbe3d" strokeWidth="0.6" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" />
        </svg>

        <div ref={ringsRef} style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", willChange: "transform" }}>
          <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(0,153,255,0.08)", top: -320, right: -280 }} />
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(0,153,255,0.06)", bottom: -200, left: -200 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(0,120,220,0.06)", top: "30%", right: "8%" }} />
        </div>

        <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

          <div className="a1" style={{ display: "inline-flex", alignItems: "center", gap: 10, border: "1px solid rgba(255,190,61,0.25)", background: "rgba(255,190,61,0.06)", backdropFilter: "blur(16px)", borderRadius: 100, padding: "7px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#ffbe3d", marginBottom: 32 }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffbe3d", display: "inline-block", boxShadow: "0 0 0 0 rgba(255,190,61,0.6)" }} />
            Геленджик и Геленджикский округ
          </div>

          <h1 className="a2" style={{ fontWeight: 900, fontSize: "clamp(30px,5.5vw,64px)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#fff", marginBottom: 24 }}>
            Натяжные потолки<br />
            <span className="grad-text">от 1 дня без пыли</span><br />
            и переплат
          </h1>

          <p className="a3" style={{ fontSize: "clamp(15px,2vw,19px)", fontWeight: 300, lineHeight: 1.7, color: "rgba(232,234,242,0.6)", maxWidth: 640, marginBottom: 36 }}>
            <strong style={{ fontWeight: 600, background: "linear-gradient(135deg,#ffbe3d,#ff6b9d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Бесплатный замер сегодня.</strong>{" "}
            Точный расчёт в день замера. Гарантия до 15 лет.
          </p>

          <div className="a4" style={{ width: 60, height: 1, background: "linear-gradient(90deg,#ffbe3d,transparent)", marginBottom: 28 }} />

          <ul className="a4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px 32px", marginBottom: 40, listStyle: "none", padding: 0 }}>
            {BULLETS.map(text => (
              <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "rgba(232,234,242,0.65)", lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9.25" stroke="rgba(255,190,61,0.25)" strokeWidth="0.5" />
                    <circle cx="10" cy="10" r="9.25" fill="rgba(255,190,61,0.06)" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#ffbe3d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="a5" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 36 }}>
            <a href="#form" className="cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 12, position: "relative", padding: "0 36px", height: 58, borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 16, color: "#fff", overflow: "hidden", cursor: "pointer", border: "none", textDecoration: "none", transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg,#ff9d3d 0%,#ffbe3d 40%,#ff6b9d 100%)", borderRadius: 10 }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 10, boxShadow: "0 0 30px rgba(255,190,61,0.4),0 0 60px rgba(255,190,61,0.15)" }} />
              <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                Рассчитать стоимость
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", fontSize: 16 }}>→</span>
              </span>
            </a>
            <div style={{ fontSize: 13, color: "rgba(232,234,242,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#ffbe3d", opacity: 0.7, display: "inline-block" }} />
              Ответим в течение 10 минут
            </div>
          </div>

          <div className="a6" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 40 }}>
            {PILLS.map(({ dot, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", fontSize: 13, color: "rgba(232,234,242,0.6)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0, display: "inline-block" }} />
                {text}
              </div>
            ))}
          </div>

          <div className="a7" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {/* Timer */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,190,61,0.15)", borderRadius: 10, padding: "20px 22px", backdropFilter: "blur(20px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,190,61,0.08),transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#ffbe3d", marginBottom: 16, opacity: 0.8 }}>
                Скидка 10% действует до 15 апреля 2026
              </div>
              {timer.ended ? (
                <span style={{ fontSize: 15, fontWeight: 600, color: "#ffbe3d" }}>Акция завершена</span>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center", position: "relative" }}>
                  {[{ val: timer.d, cap: "дней" }, { val: timer.h, cap: "часов" }, { val: timer.m, cap: "минут" }, { val: timer.s, cap: "секунд" }].map(({ val, cap }, i) => (
                    <div key={cap} style={{ display: "flex", alignItems: "center", gap: 6, flex: i < 3 ? "1 1 auto" : "1 1 auto" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                        <div style={{ width: "100%", textAlign: "center", fontWeight: 800, fontSize: "clamp(20px,3vw,32px)", color: "#fff", background: "rgba(255,190,61,0.08)", border: "1px solid rgba(255,190,61,0.15)", borderRadius: 10, padding: "8px 4px", lineHeight: 1 }}>
                          {pad(val)}
                        </div>
                        <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(232,234,242,0.3)" }}>{cap}</div>
                      </div>
                      {i < 3 && <span style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,190,61,0.4)", marginBottom: 16, lineHeight: 1 }}>:</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trust */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(0,255,224,0.15)", borderRadius: 10, padding: "20px 22px", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(0,255,224,0.08),transparent 60%)", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontWeight: 900, fontSize: "clamp(36px,5vw,52px)", lineHeight: 1, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#00ffe0,#ffbe3d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 4 }}>500+</div>
                <div style={{ fontSize: 13, color: "rgba(232,234,242,0.5)", lineHeight: 1.4, marginBottom: 16 }}>клиентов доверили нам<br />свои потолки</div>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", marginBottom: 12 }}>
                  {AVATARS.map(({ bg, label }, i) => (
                    <div key={label} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #04050d", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.85)", background: bg, flexShrink: 0 }}>
                      {label}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#ffbe3d"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
