import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function ExplorePage() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [plants, setPlants] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState("");
  const [search, setSearch] = useState("");
  const [issue, setIssue] = useState("");
  const [usage, setUsage] = useState("");
  const [matches, setMatches] = useState([]);
  const [randomPlant, setRandomPlant] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [recent, setRecent] = useState([]);
  const [heroTabs, setHeroTabs] = useState([]);
  const [tabOffset, setTabOffset] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const rotateRef = useRef(null);

  const safe = (v) => (v || "").toLowerCase();
  const getProblem = (h) => h?.problem || h?.Problem || "";
  const getRemedy = (h) => h?.remedy || h?.Remedy || "";
  const getTips = (h) => h?.tips || h?.Tips || [];
  const firstRemedyLine = (h) => getRemedy(h)?.split("\n")[0] || "";

  const extractMethod = (remedyText, usageKeyword) => {
    if (!remedyText || !usageKeyword) return null;
    const lines = remedyText.split("\n").filter(Boolean);
    const matched = lines.find((l) => safe(l).includes(usageKeyword));
    if (matched) return matched.replace(/^[^:]+:\s*/, "").split(".")[0].trim();
    return null;
  };

  const scoreAgainstNeed = (plant, needKey) => {
    if (!needKey) return 0;
    let score = 0;
    plant.helps?.forEach((h) => {
      if (safe(getProblem(h)).includes(needKey)) score += 5;
    });
    (plant.properties || []).forEach((p) => {
      if (safe(p).includes(needKey)) score += 2;
    });
    return score;
  };

  const getBestHelp = (plant, needKey) =>
    plant.helps?.find((h) => safe(getProblem(h)).includes(needKey)) || plant.helps?.[0];

  const getRecommendedSnippet = (plant, needKey) => {
    const h = getBestHelp(plant, needKey);
    if (!h) return { problem: "", tip: "" };
    const tips = getTips(h);
    const tip = Array.isArray(tips) && tips.length ? tips[0] : firstRemedyLine(h);
    return { problem: getProblem(h), tip: (tip || "").trim() };
  };

  const getSearchSnippet = (plant) => {
    const h = plant.helps?.[0];
    const lines = getRemedy(h)?.split("\n").filter(Boolean) || [];
    const line = lines[1] || lines[0] || "";
    return line.replace(/^[^:]+:\s*/, "").split(".")[0].trim();
  };

  const getDiscoverSnippet = (plant) => {
    const desc = plant.description || plant.Description || "";
    const sentences = desc.split(/\.\s+/).filter(Boolean);
    return sentences[1] || sentences[0] || firstRemedyLine(plant.helps?.[0]);
  };

  useEffect(() => {
    fetch(`${API}/plants`)
      .then((res) => res.json())
      .then((data) => {
        const list = data || [];
        setPlants(list);
        if (list.length) setRandomPlant(list[Math.floor(Math.random() * list.length)]);
      });
  }, []);

  useEffect(() => {
    if (!plants.length) return;
    const allProbs = [
      ...new Set(plants.flatMap((p) => (p.helps || []).map((h) => getProblem(h)).filter(Boolean))),
    ];
    const labelMap = {
      "burns and wounds": { label: "Burns & Wounds", key: "burn" },
      "acne and skin care": { label: "Acne & Skin", key: "acne" },
      "digestive issues": { label: "Digestion", key: "digestive" },
      "cold and cough": { label: "Cold & Cough", key: "cold" },
      "stress and anxiety": { label: "Stress", key: "stress" },
      "hair loss": { label: "Hair", key: "hair" },
      "joint pain": { label: "Joint Pain", key: "joint" },
      "blood sugar": { label: "Blood Sugar", key: "blood sugar" },
      "skin care": { label: "Skin Care", key: "skin" },
      immunity: { label: "Immunity", key: "immun" },
    };
    const tabs = allProbs.map((prob) => {
      const lower = safe(prob);
      const found = Object.entries(labelMap).find(([k]) => lower.includes(k));
      if (found) return { label: found[1].label, key: found[1].key, prob };
      const label = prob.split(" ").slice(0, 2).join(" ");
      return { label, key: lower.split(" ")[0], prob };
    });
    const unique = [];
    const seen = new Set();
    tabs.forEach((t) => { if (!seen.has(t.key)) { seen.add(t.key); unique.push(t); } });
    setHeroTabs(unique);
    if (unique.length) setSelectedNeed(unique[0].key);
    rotateRef.current = setInterval(() => {
      setTabOffset((prev) => (prev + 1) % Math.max(unique.length, 1));
    }, 30000);
    return () => clearInterval(rotateRef.current);
  }, [plants]);

  const visibleTabs = (() => {
    if (!heroTabs.length) return [];
    const size = Math.min(6, heroTabs.length);
    return Array.from({ length: size }, (_, i) => heroTabs[(tabOffset + i) % heroTabs.length]);
  })();

  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem("recent")) || []);
  }, []);

  const openPlant = (p) => {
    const updated = [p, ...recent.filter((r) => r.id !== p.id)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem("recent", JSON.stringify(updated));
    navigate(`/app/plant/${p.id}`);
  };

  const recommendedPlants = plants
    .map((p) => ({ ...p, score: scoreAgainstNeed(p, selectedNeed) }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  const filtered =
    search.trim() === ""
      ? []
      : plants.filter(
          (p) =>
            safe(p.name).includes(search) ||
            safe(p.description || "").includes(search) ||
            p.helps?.some((h) => safe(getProblem(h)).includes(search)) ||
            (p.properties || []).some((prop) => safe(prop).includes(search))
        );

  const allProblems = [
    ...new Set(plants.flatMap((p) => (p.helps || []).map((h) => getProblem(h)).filter(Boolean))),
  ];

  const handleMatch = () => {
    if (!issue) return;
    const results = plants
      .map((p) => {
        let score = 0;
        const reasons = new Set();
        (p.helps || []).forEach((h) => {
          const prob = getProblem(h);
          const remedy = getRemedy(h);
          if (safe(prob).includes(issue)) {
            score += 3;
            const firstStep = firstRemedyLine(h);
            if (firstStep) reasons.add(`For ${prob}: ${firstStep.split(".")[0]}`);
          }
          if (usage) {
            const usageKey = usage === "apply" ? "appli" : usage;
            const extracted = extractMethod(remedy, usageKey);
            if (extracted) { score += 2; reasons.add(extracted); }
            else if (safe(remedy).includes(usageKey)) {
              score += 1;
              const line = remedy.split("\n").find((l) => safe(l).includes(usageKey));
              if (line) reasons.add(line.replace(/^[^:]+:\s*/, "").split(".")[0].trim());
            }
          }
          const tips = getTips(h);
          if (Array.isArray(tips) && tips.length && score > 0) {
            const tip = tips[0].trim();
            if (tip) reasons.add(`${tip}`);
          }
        });
        return { ...p, score, reasons: [...reasons].slice(0, 3) };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);
    setMatches(results.slice(0, 5));
  };

  return (
    <div style={{ 
  minHeight: "100vh", 
  fontFamily: "'Georgia', serif",
  background: "linear-gradient(135deg, #0f2e1f 0%, #1a3f2b 50%, #0f2e1f 100%)", // subtle dark green gradient base
  position: "relative",
  overflow: "hidden"
}}>
  {/* Glass overlay for the whole page */}
  <div style={{
    position: "fixed",
    inset: 0,
    background: "rgba(255, 255, 255, 0.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: -1,
    pointerEvents: "none"
  }} />

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; }

    .ep-root {
      font-family: 'DM Sans', sans-serif;
      background: transparent;           /* Important: transparent */
      min-height: 100vh;
      padding: 28px 32px;
      color: #ffffff;                    /* White text for glass effect */
      position: relative;
      z-index: 1;
    }

    /* HERO - Keep it elegant but not fully glass (better contrast) */
    .hero-card {
      background: rgba(255, 255, 255, 0.09);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 28px;
      padding: 48px;
      position: relative;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    }

    /* Other cards - Light with slight glass feel for readability */
    .card {
      background: rgba(255, 255, 255, 0.92);
      border-radius: 24px;
      padding: 28px;
      border: 1px solid rgba(255,255,255,0.5);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      color: #1a2e1a;
    }
        .hero-leaf-1 {
          position: absolute;
          top: -30px; right: -20px;
          width: 260px; height: 260px;
          background: radial-gradient(circle at 40% 40%, rgba(134,239,172,0.18), transparent 70%);
          border-radius: 50%;
          animation: floatLeaf 8s ease-in-out infinite;
        }
        .hero-leaf-2 {
          position: absolute;
          bottom: -40px; left: 60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle at 60% 60%, rgba(74,222,128,0.12), transparent 70%);
          border-radius: 50%;
          animation: floatLeaf 10s ease-in-out infinite reverse;
        }
        @keyframes floatLeaf {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-16px) scale(1.04); }
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          color: #a7f3d0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 18px;
          backdrop-filter: blur(8px);
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 10px;
          letter-spacing: -0.5px;
        }
        .hero-sub {
          color: rgba(255,255,255,0.62);
          font-size: 16px;
          font-weight: 400;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        .tab-strip {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .tab-pill {
          padding: 10px 22px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
          letter-spacing: 0.02em;
          font-family: 'DM Sans', sans-serif;
        }
        .tab-active {
          background: #fff;
          color: #1a4a2e;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
        .tab-inactive {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.82);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(4px);
        }
        .tab-inactive:hover {
          background: rgba(255,255,255,0.2);
          color: #fff;
          transform: translateY(-1px);
        }
        .refresh-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
          width: 36px; height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          font-size: 14px;
        }
        .refresh-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

        /* ── CARDS ── */
        .card {
          background: #fff;
          border-radius: 24px;
          padding: 28px;
          border: 1px solid rgba(26,74,46,0.08);
          box-shadow: 0 2px 8px rgba(26,74,46,0.06), 0 12px 40px rgba(26,74,46,0.04);
          transition: box-shadow 0.3s;
        }
        .card:hover { box-shadow: 0 4px 16px rgba(26,74,46,0.1), 0 20px 60px rgba(26,74,46,0.06); }
        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a2e1a;
          margin: 0 0 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.3px;
        }
        .card-title-icon {
          width: 32px; height: 32px;
          background: #f0fdf4;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        /* ── PLANT ROWS ── */
        .plant-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 12px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          animation: rowIn 0.4s ease both;
        }
        .plant-row:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
          transform: translateX(4px);
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .plant-img {
          width: 60px; height: 60px;
          border-radius: 16px;
          object-fit: cover;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .plant-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #1a2e1a;
          margin: 0 0 4px;
          letter-spacing: -0.2px;
        }
        .plant-problem {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 4px;
          font-weight: 400;
        }
        .plant-problem strong { color: #16a34a; font-weight: 600; }
        .plant-tip {
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
          display: flex;
          gap: 5px;
          align-items: flex-start;
        }
        .arrow-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          color: #16a34a;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .plant-row:hover .arrow-btn {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
          transform: translateX(2px);
        }

        /* ── SEARCH ── */
        .search-wrap {
          position: relative;
          margin-bottom: 16px;
        }
        .search-icon {
          position: absolute;
          left: 18px; top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #9ca3af;
          pointer-events: none;
          transition: color 0.2s;
        }
        .search-focused .search-icon { color: #16a34a; }
        .search-input {
          width: 100%;
          padding: 14px 18px 14px 46px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          background: #fafafa;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s;
          color: #1a2e1a;
        }
        .search-input:focus {
          border-color: #16a34a;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.08);
        }
        .search-result-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 10px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.18s;
          border: 1px solid transparent;
        }
        .search-result-row:hover { background: #f0fdf4; border-color: #bbf7d0; }

        /* ── MATCH FINDER ── */
        .select-field {
          width: 100%;
          margin-bottom: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: #fafafa;
          color: #1a2e1a;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border 0.2s;
          appearance: none;
          cursor: pointer;
        }
        .select-field:focus { border-color: #16a34a; background: #fff; }
        .find-btn {
          width: 100%;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%);
          color: white;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 15px;
          border: none;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: all 0.25s;
          box-shadow: 0 4px 16px rgba(22,163,74,0.35);
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 16px;
        }
        .find-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22,163,74,0.4);
        }
        .find-btn:active { transform: translateY(0); }

        /* ── MATCH CARDS ── */
        .match-card {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          padding: 16px;
          border-radius: 18px;
          margin-bottom: 12px;
          border: 1px solid #bbf7d0;
          cursor: pointer;
          transition: all 0.2s;
          animation: matchIn 0.4s cubic-bezier(.34,1.56,.64,1) both;
        }
        .match-card:hover {
          border-color: #4ade80;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22,163,74,0.15);
        }
        @keyframes matchIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .match-plant-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          color: #14532d;
          margin-bottom: 8px;
        }
        .progress-track {
          height: 7px;
          background: #d1fae5;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        .progress-fill {
          background: linear-gradient(90deg, #16a34a, #4ade80);
          height: 100%;
          border-radius: 999px;
          transition: width 1s cubic-bezier(.34,1.56,.64,1);
        }
        .match-pct {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .match-reason {
          font-size: 12.5px;
          color: #15803d;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 5px;
          line-height: 1.5;
        }

        /* ── DISCOVER ── */
        .discover-card {
          background: linear-gradient(170deg, #1a4a2e 0%, #2d6a42 50%, #1e5535 100%);
          border-radius: 24px;
          padding: 0;
          overflow: hidden;
          border: 1px solid rgba(26,74,46,0.12);
          box-shadow: 0 4px 20px rgba(26,74,46,0.15);
        }
        .discover-img-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .discover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .discover-card:hover .discover-img { transform: scale(1.04); }
        .discover-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(26,74,46,0.85) 100%);
        }
        .discover-plant-name {
          position: absolute;
          bottom: 14px; left: 18px; right: 18px;
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .discover-body {
          padding: 20px 22px 22px;
        }
        .discover-latin {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-style: italic;
          margin: 0 0 14px;
          font-family: 'DM Sans', sans-serif;
        }
        .whats-special-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: #a7f3d0;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          width: 100%;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .whats-special-btn:hover {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }
        .discover-info {
          margin-top: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 14px;
          color: rgba(255,255,255,0.82);
          line-height: 1.65;
          animation: fadeUp 0.3s ease;
          font-family: 'DM Sans', sans-serif;
          border: 1px solid rgba(255,255,255,0.1);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── RECENT ── */
        .recent-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.18s;
          border: 1px solid transparent;
        }
        .recent-row:hover { background: #f0fdf4; border-color: #d1fae5; }
        .recent-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px;
          font-weight: 600;
          color: #1a2e1a;
        }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 6px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── INSIGHT CHIPS ── */
        .insight-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 11px;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
        }
        .chip-green { background: #dcfce7; color: #166534; }
        .chip-amber { background: #fef3c7; color: #92400e; }
        .chip-blue  { background: #dbeafe; color: #1e40af; }

        /* ── DIVIDER ── */
        .plant-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 4px 0;
        }

        /* ── EMPTY STATES ── */
        .empty-state {
          text-align: center;
          padding: 32px 20px;
          color: #9ca3af;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
        }
        .empty-icon { font-size: 32px; margin-bottom: 10px; display: block; }
      `}</style>

      <div className="ep-root">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>

          {/* ── LEFT (2 cols) ── */}
          <div style={{ gridColumn: "span 2" }}>

            {/* HERO */}
            <div className="hero-card">
              <div className="hero-leaf-1" />
              <div className="hero-leaf-2" />
              <div style={{ position: "relative" }}>
                <div className="hero-eyebrow">
                  <span>✦</span> Nature's Intelligence
                </div>
                <h1 className="hero-title">
                  How can nature<br />help you today?
                </h1>
                <p className="hero-sub">
                  Discover ancient Ayurvedic wisdom for your health concerns
                </p>
                <div className="tab-strip">
                  {visibleTabs.map((tab) => (
                    <div
                      key={tab.key}
                      onClick={() => setSelectedNeed(tab.key)}
                      className={`tab-pill ${selectedNeed === tab.key ? "tab-active" : "tab-inactive"}`}
                    >
                      {tab.label}
                    </div>
                  ))}
                  {heroTabs.length > 6 && (
                    <button
                      className="refresh-btn"
                      title="More topics"
                      onClick={() => setTabOffset((prev) => (prev + 6) % Math.max(heroTabs.length, 1))}
                    >
                      ↻
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RECOMMENDED */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">
                <div className="card-title-icon">✦</div>
                Recommended for You
                {selectedNeed && (
                  <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400, fontFamily: "'DM Sans', sans-serif", marginLeft: 4 }}>
                    · {heroTabs.find((t) => t.key === selectedNeed)?.label || selectedNeed}
                  </span>
                )}
              </div>

              {recommendedPlants.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🌿</span>
                  No plants matched — try another topic above
                </div>
              ) : (
                recommendedPlants.map((p, idx) => {
                  const { problem, tip } = getRecommendedSnippet(p, selectedNeed);
                  return (
                    <React.Fragment key={p.id}>
                      {idx > 0 && <div className="plant-divider" />}
                      <div
                        className="plant-row"
                        style={{ animationDelay: `${idx * 0.07}s` }}
                        onClick={() => openPlant(p)}
                      >
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                          <img src={p.images?.[0]} className="plant-img" alt={p.name} />
                          <div style={{ flex: 1 }}>
                            <p className="plant-name">{p.name}</p>
                            <p className="plant-problem">
                              Helps with <strong>{problem}</strong>
                            </p>
                            {tip && (
                              <p className="plant-tip">
                                <span style={{ color: "#16a34a", flexShrink: 0 }}>●</span>
                                {tip}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
  className="arrow-btn"
  onClick={(e) => {
    e.stopPropagation(); // prevents triggering parent click twice
    navigate(`/app/plant/${p.id}`);
  }}
>
  →
</div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* SEARCH */}
            <div className="card">
              <div className="card-title">
                <div className="card-title-icon">⌕</div>
                Search Plants & Remedies
              </div>
              <div className={`search-wrap ${searchFocused ? "search-focused" : ""}`}>
                <span className="search-icon">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value.toLowerCase())}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Try 'acne', 'tulsi', 'digestion'…"
                  className="search-input"
                />
              </div>

              {search && filtered.length === 0 && (
                <div className="empty-state" style={{ padding: "20px" }}>
                  No results for <em>"{search}"</em>
                </div>
              )}

              {search &&
                filtered.map((p, idx) => {
                  const snippet = getSearchSnippet(p);
                  const props = (p.properties || []).slice(0, 3);
                  return (
                    <div
                      key={p.id}
                      className="search-result-row"
                      style={{ animationDelay: `${idx * 0.06}s` }}
                      onClick={() => openPlant(p)}
                    >
                      <img
                        src={p.images?.[0]}
                        style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0, boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
                        alt={p.name}
                      />
                      <div style={{ flex: 1 }}>
                        <p className="plant-name" style={{ fontSize: 16, marginBottom: 3 }}>{p.name}</p>
                        {snippet && (
                          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 5, lineHeight: 1.45 }}>{snippet}</p>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {props.map((pr, i) => (
                            <span key={i} className="insight-chip chip-green">{pr}</span>
                          ))}
                        </div>
                      </div>
                      <div
  className="arrow-btn"
  onClick={(e) => {
    e.stopPropagation(); // prevents triggering parent click twice
    navigate(`/app/plant/${p.id}`);
  }}
>
  →
</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* ── RIGHT (1 col) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* MATCH FINDER */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 18 }}>
                <div className="card-title-icon">◎</div>
                Find Your Remedy
              </div>

              <div className="section-label">Your concern</div>
              <select onChange={(e) => setIssue(e.target.value.toLowerCase())} className="select-field">
                <option value="">Select a condition…</option>
                {allProblems.map((prob, i) => (
                  <option key={i} value={safe(prob)}>{prob}</option>
                ))}
              </select>

              <div className="section-label">How you'd like to use it</div>
              <select onChange={(e) => setUsage(e.target.value)} className="select-field">
                <option value="">Any method</option>
                <option value="drink">Drink / Infusion</option>
                <option value="appli">Apply topically</option>
                <option value="eat">Eat / Raw</option>
                <option value="boil">Boiled / Decoction</option>
              </select>

              <button onClick={handleMatch} className="find-btn">
                ✦ Find My Match
              </button>

              {matches.length === 0 && issue && (
                <div className="empty-state" style={{ padding: "12px 0" }}>
                  <span className="empty-icon">🔍</span>
                  No matches — try a broader concern
                </div>
              )}

              {matches.map((m, index) => {
                const percent = Math.min(Math.round((m.score / 7) * 100), 100);
                return (
                  <div
                    key={m.id}
                    className="match-card"
                    style={{ animationDelay: `${index * 0.09}s` }}
                    onClick={() => openPlant(m)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <img
                        src={m.images?.[0]}
                        style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                        alt={m.name}
                      />
                      <div className="match-plant-name">{m.name}</div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <p className="match-pct">{percent}% match</p>
                    {m.reasons.map((r, i) => (
                      <div key={i} className="match-reason">
                        <span style={{ flexShrink: 0, color: "#4ade80" }}>✔</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* RECENTLY VIEWED */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>
                <div className="card-title-icon">◷</div>
                Recently Viewed
              </div>
              {recent.length === 0 ? (
                <div className="empty-state" style={{ padding: "16px 0" }}>
                  <span className="empty-icon">🌱</span>
                  Start exploring to see your history
                </div>
              ) : (
                recent.map((p) => (
                  <div key={p.id} className="recent-row" onClick={() => openPlant(p)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={p.images?.[0]}
                        style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }}
                        alt={p.name}
                      />
                      <span className="recent-name">{p.name}</span>
                    </div>
                    <span style={{ color: "#9ca3af", fontSize: 16 }}>→</span>
                  </div>
                ))
              )}
            </div>

            {/* DISCOVER */}
            {randomPlant && (
              <div className="discover-card">
                <div className="discover-img-wrap">
                  <img src={randomPlant.images?.[0]} className="discover-img" alt={randomPlant.name} />
                  <div className="discover-img-overlay" />
                  <div className="discover-plant-name">{randomPlant.name}</div>
                </div>
                <div className="discover-body">
                  {(randomPlant.scientific_name || randomPlant.scientificName) && (
                    <p className="discover-latin">
                      {randomPlant.scientific_name || randomPlant.scientificName}
                    </p>
                  )}

                  <button
                    className="whats-special-btn"
                    onClick={() => setShowInfo(!showInfo)}
                  >
                    <span>{showInfo ? "▲" : "▼"}</span>
                    What's special?
                  </button>

                  {showInfo && (
                    <div className="discover-info">
                      {getDiscoverSnippet(randomPlant)}.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}