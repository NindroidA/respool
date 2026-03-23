import { useState, useCallback, useRef } from "react";

const FILAMENT_DIAMETER = 1.75;
const PLA_DENSITY = 1.24;

function parseGcode(text, density) {
  const lines = text.split("\n");
  let layers = [];
  let currentLayer = -1;
  let lastE = 0;
  let layerExtrusion = 0;
  let isRelative = false;
  let headerGrams = null;
  const filamentArea = Math.PI * (FILAMENT_DIAMETER / 2) ** 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Try to grab slicer-reported weight from header comments
    const weightMatch = line.match(/^;Filament weight:\s*([\d.]+)\s*g/i) ||
                        line.match(/^;\s*filament\s*used\s*\[g\]\s*=\s*([\d.]+)/i);
    if (weightMatch) headerGrams = parseFloat(weightMatch[1]);

    if (/^M83\b/.test(line)) isRelative = true;
    if (/^M82\b/.test(line)) isRelative = false;

    // Layer detection — only trust explicit slicer layer number comments
    // ;LAYER:N is used by Cura-based slicers (AnkerMake, EufyMake, etc.)
    // ; layer N is used by some other slicers
    // Deliberately skip ;LAYER_CHANGE as AnkerMake outputs it alongside ;LAYER:N
    const isLayerChange =
      /^;LAYER:\d+/i.test(line) ||
      /^; layer \d+/i.test(line);

    if (isLayerChange && currentLayer >= 0) {
      layers.push({ layer: currentLayer, grams: layerExtrusion });
      layerExtrusion = 0;
    }
    if (isLayerChange) currentLayer++;

    // Only count extrusion on moves that have X or Y (actual printing)
    // This filters out retraction (E-only) and unretraction (E-only) moves
    if (/^G[01]\s/.test(line) && /[XY]/.test(line)) {
      const eMatch = line.match(/E([-\d.]+)/);
      if (eMatch) {
        const eVal = parseFloat(eMatch[1]);
        if (isRelative) {
          if (eVal > 0) layerExtrusion += eVal;
        } else {
          if (eVal > lastE) layerExtrusion += eVal - lastE;
          lastE = eVal;
        }
      }
    }

    if (/^G92\s/.test(line) && /E0/.test(line)) lastE = 0;
  }

  if (currentLayer >= 0 && layerExtrusion > 0) {
    layers.push({ layer: currentLayer, grams: layerExtrusion });
  }

  layers = layers.map((l) => ({
    ...l,
    grams: (l.grams * filamentArea * density) / 1000,
  }));

  const parsedGrams = layers.reduce((s, l) => s + l.grams, 0);
  // Prefer slicer-reported weight if available; scale per-layer values to match
  const totalGrams = headerGrams || parsedGrams;
  const scale = parsedGrams > 0 ? totalGrams / parsedGrams : 1;

  let cum = 0;
  const cumulative = layers.map((l) => {
    const g = l.grams * scale;
    cum += g;
    return { ...l, grams: g, cumGrams: cum };
  });

  return { layers: cumulative, totalGrams, totalLayers: layers.length, headerGrams, parsedGrams: Math.round(parsedGrams * 10) / 10 };
}

const DENSITIES = [
  { label: "PLA", d: 1.24 },
  { label: "PETG", d: 1.27 },
  { label: "ABS", d: 1.04 },
  { label: "TPU", d: 1.21 },
];

export default function SpoolSwapCalc() {
  const [mode, setMode] = useState("gcode");
  const [printInfo, setPrintInfo] = useState({ totalGrams: "", totalLayers: "" });
  const [spools, setSpools] = useState([{ id: 1, grams: "" }]);
  const [results, setResults] = useState(null);
  const [nextId, setNextId] = useState(2);
  const [gcodeData, setGcodeData] = useState(null);
  const [gcodeRaw, setGcodeRaw] = useState(null);
  const [gcodeName, setGcodeName] = useState("");
  const [gcodeLoading, setGcodeLoading] = useState(false);
  const [density, setDensity] = useState(1.24);
  const [purgeLength, setPurgeLength] = useState("100");
  const fileRef = useRef();

  const mmToGrams = (mm, d) => (mm * Math.PI * (FILAMENT_DIAMETER / 2) ** 2 * d) / 1000;

  const addSpool = () => {
    setSpools((s) => [...s, { id: nextId, grams: "" }]);
    setNextId((n) => n + 1);
  };
  const removeSpool = (id) => setSpools((s) => s.filter((sp) => sp.id !== id));
  const updateSpool = (id, val) =>
    setSpools((s) => s.map((sp) => (sp.id === id ? { ...sp, grams: val } : sp)));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGcodeLoading(true);
    setGcodeName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target.result;
      setGcodeRaw(raw);
      const parsed = parseGcode(raw, density);
      setGcodeData(parsed);
      setPrintInfo({
        totalGrams: parsed.totalGrams.toFixed(1),
        totalLayers: String(parsed.totalLayers),
      });
      setGcodeLoading(false);
    };
    reader.readAsText(file);
  };

  const changeDensity = (d) => {
    setDensity(d);
    if (gcodeRaw) {
      const parsed = parseGcode(gcodeRaw, d);
      setGcodeData(parsed);
      setPrintInfo({
        totalGrams: parsed.totalGrams.toFixed(1),
        totalLayers: String(parsed.totalLayers),
      });
    }
  };

  const clearGcode = () => {
    setGcodeData(null);
    setGcodeRaw(null);
    setGcodeName("");
    setPrintInfo({ totalGrams: "", totalLayers: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const calculate = useCallback(() => {
    const total = parseFloat(printInfo.totalGrams);
    const layers = parseInt(printInfo.totalLayers);
    const spoolWeights = spools
      .map((s) => parseFloat(s.grams))
      .filter((g) => !isNaN(g) && g > 0);

    if (isNaN(total) || total <= 0 || isNaN(layers) || layers <= 0) return;
    if (spoolWeights.length === 0) return;

    const purgeGrams = mmToGrams(parseFloat(purgeLength) || 0, density);
    const totalAvailable = spoolWeights.reduce((a, b) => a + b, 0);
    let schedule = [];

    if (gcodeData && mode === "gcode") {
      let spoolIdx = 0;
      // First spool: subtract purge for initial load
      let spoolRemaining = spoolWeights[0] - purgeGrams;
      let spoolStartLayer = 1;
      let spoolGramsUsed = 0;
      let totalPurgeWaste = purgeGrams; // initial load purge

      for (let i = 0; i < gcodeData.layers.length; i++) {
        const layerG = gcodeData.layers[i].grams;

        if (layerG > spoolRemaining) {
          const pauseLayer = i + 1;
          schedule.push({
            spool: spoolIdx + 1,
            gramsAvailable: spoolWeights[spoolIdx],
            gramsUsed: Math.round(spoolGramsUsed * 10) / 10,
            purgeGrams: Math.round(purgeGrams * 10) / 10,
            startLayer: spoolStartLayer,
            endLayer: pauseLayer - 1,
            pauseAfterLayer: pauseLayer - 1,
          });
          spoolIdx++;
          if (spoolIdx >= spoolWeights.length) break;
          // Each new spool also loses purge amount
          spoolRemaining = spoolWeights[spoolIdx] - purgeGrams;
          totalPurgeWaste += purgeGrams;
          spoolStartLayer = pauseLayer;
          spoolGramsUsed = 0;
        }

        spoolRemaining -= layerG;
        spoolGramsUsed += layerG;
      }

      if (spoolIdx < spoolWeights.length) {
        schedule.push({
          spool: spoolIdx + 1,
          gramsAvailable: spoolWeights[spoolIdx],
          gramsUsed: Math.round(spoolGramsUsed * 10) / 10,
          purgeGrams: Math.round(purgeGrams * 10) / 10,
          startLayer: spoolStartLayer,
          endLayer: layers,
          pauseAfterLayer: null,
        });
      }

      const totalNeeded = total + totalPurgeWaste;
      const enough = totalAvailable >= totalNeeded;
      const layersCovered =
        schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

      setResults({
        mode: "gcode",
        gramsPerLayer: null,
        totalAvailable: Math.round(totalAvailable * 10) / 10,
        totalNeeded: Math.round(total * 10) / 10,
        totalWithPurge: Math.round(totalNeeded * 10) / 10,
        totalPurgeWaste: Math.round(totalPurgeWaste * 10) / 10,
        purgePerSwap: Math.round(purgeGrams * 10) / 10,
        numSwaps: schedule.filter((s) => s.pauseAfterLayer).length,
        enough,
        layersCovered,
        totalLayers: layers,
        schedule,
      });
    } else {
      const gramsPerLayer = total / layers;
      let cumLayers = 0;
      let totalPurgeWaste = purgeGrams; // initial load

      for (let i = 0; i < spoolWeights.length; i++) {
        const effectiveG = spoolWeights[i] - purgeGrams;
        const layersThisSpool = Math.floor(Math.max(0, effectiveG) / gramsPerLayer);
        const startLayer = cumLayers + 1;
        const endLayer = Math.min(cumLayers + layersThisSpool, layers);
        const actualGrams = (endLayer - cumLayers) * gramsPerLayer;

        schedule.push({
          spool: i + 1,
          gramsAvailable: spoolWeights[i],
          gramsUsed: Math.round(actualGrams * 10) / 10,
          purgeGrams: Math.round(purgeGrams * 10) / 10,
          startLayer,
          endLayer,
          pauseAfterLayer: endLayer < layers ? endLayer : null,
        });

        cumLayers = endLayer;
        if (cumLayers >= layers) break;
        if (i < spoolWeights.length - 1) totalPurgeWaste += purgeGrams;
      }

      const totalNeeded = total + totalPurgeWaste;
      const enough = totalAvailable >= totalNeeded;
      const layersCovered =
        schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

      setResults({
        mode: "linear",
        gramsPerLayer: Math.round(gramsPerLayer * 100) / 100,
        totalAvailable: Math.round(totalAvailable * 10) / 10,
        totalNeeded: Math.round(total * 10) / 10,
        totalWithPurge: Math.round(totalNeeded * 10) / 10,
        totalPurgeWaste: Math.round(totalPurgeWaste * 10) / 10,
        purgePerSwap: Math.round(purgeGrams * 10) / 10,
        numSwaps: schedule.filter((s) => s.pauseAfterLayer).length,
        enough,
        layersCovered,
        totalLayers: layers,
        schedule,
      });
    }
  }, [printInfo, spools, gcodeData, mode, purgeLength, density]);

  const reset = () => {
    setPrintInfo({ totalGrams: "", totalLayers: "" });
    setSpools([{ id: 1, grams: "" }]);
    setResults(null);
    clearGcode();
    setMode("gcode");
    setPurgeLength("100");
  };

  return (
    <div style={S.wrap}>
      <div style={S.container}>
        <div style={S.header}>
          <div style={S.headerIcon}>⬡</div>
          <div>
            <h1 style={S.title}>Spool Swap Calculator</h1>
            <p style={S.subtitle}>Figure out where to pause & swap partial spools</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={S.section}>
          <div style={S.modeToggle}>
            <button
              style={mode === "gcode" ? S.modeActive : S.modeBtn}
              onClick={() => setMode("gcode")}
            >
              Upload G-code (accurate)
            </button>
            <button
              style={mode === "manual" ? S.modeActive : S.modeBtn}
              onClick={() => setMode("manual")}
            >
              Manual entry (estimate)
            </button>
          </div>
        </div>

        {/* G-code upload */}
        {mode === "gcode" && (
          <div style={S.section}>
            <div style={S.sectionLabel}>G-CODE FILE</div>
            {!gcodeData ? (
              <label style={S.dropZone}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".gcode,.gco,.g"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
                {gcodeLoading ? (
                  <div style={S.dropText}>
                    <span style={{ fontSize: 20, color: "#22d3ee" }}>◌</span>
                    Parsing G-code...
                  </div>
                ) : (
                  <div style={S.dropText}>
                    <span style={{ fontSize: 24, marginBottom: 4 }}>📄</span>
                    <span>Click to select <strong>.gcode</strong> file</span>
                    <span style={{ fontSize: 11, color: "#52525b" }}>
                      Parses per-layer extrusion for accurate swap points
                    </span>
                  </div>
                )}
              </label>
            ) : (
              <div style={S.gcodeInfo}>
                <div style={S.gcodeFile}>
                  <span style={{ color: "#22d3ee" }}>📄</span>
                  <span style={{ color: "#e4e4e7", fontWeight: 500 }}>{gcodeName}</span>
                  <button style={S.removeBtn} onClick={clearGcode}>✕</button>
                </div>
                <div style={S.gcodeStats}>
                  {gcodeData.totalLayers} layers • {gcodeData.totalGrams.toFixed(1)}g total
                  {gcodeData.headerGrams && (
                    <span style={{ color: "#4ade80", marginLeft: 8 }}>
                      ✓ matched slicer header
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={S.label}>Filament type</label>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {DENSITIES.map((f) => (
                      <button
                        key={f.label}
                        style={density === f.d ? S.densityActive : S.densityBtn}
                        onClick={() => changeDensity(f.d)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <span style={S.hint}>Density: {density} g/cm³</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual print info */}
        {mode === "manual" && (
          <div style={S.section}>
            <div style={S.sectionLabel}>PRINT INFO</div>
            <div style={S.row}>
              <div style={S.field}>
                <label style={S.label}>Total filament (g)</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="e.g. 245"
                  value={printInfo.totalGrams}
                  onChange={(e) =>
                    setPrintInfo((p) => ({ ...p, totalGrams: e.target.value }))
                  }
                />
                <span style={S.hint}>From your slicer estimate</span>
              </div>
              <div style={S.field}>
                <label style={S.label}>Total layers</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="e.g. 380"
                  value={printInfo.totalLayers}
                  onChange={(e) =>
                    setPrintInfo((p) => ({ ...p, totalLayers: e.target.value }))
                  }
                />
                <span style={S.hint}>From your slicer preview</span>
              </div>
            </div>
          </div>
        )}

        {/* Parsed info read-only */}
        {mode === "gcode" && gcodeData && (
          <div style={S.section}>
            <div style={S.sectionLabel}>PARSED PRINT INFO</div>
            <div style={S.row}>
              <div style={S.field}>
                <label style={S.label}>Total filament (g)</label>
                <div style={S.readOnly}>{printInfo.totalGrams}</div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Total layers</label>
                <div style={S.readOnly}>{printInfo.totalLayers}</div>
              </div>
            </div>
          </div>
        )}

        {/* Spools */}
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={S.sectionLabel}>YOUR SPOOLS (in print order)</div>
            <button style={S.addBtn} onClick={addSpool}>+ Add Spool</button>
          </div>
          <div style={S.spoolGrid}>
            {spools.map((sp, i) => (
              <div key={sp.id} style={S.spoolCard}>
                <div style={S.spoolHeader}>
                  <span style={S.spoolNum}>Spool {i + 1}</span>
                  {spools.length > 1 && (
                    <button style={S.removeBtn} onClick={() => removeSpool(sp.id)}>✕</button>
                  )}
                </div>
                <input
                  style={S.input}
                  type="number"
                  placeholder="grams remaining"
                  value={sp.grams}
                  onChange={(e) => updateSpool(sp.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Purge / prime extrusion */}
        <div style={S.section}>
          <div style={S.sectionLabel}>PURGE PER SWAP</div>
          <div style={{ ...S.row, alignItems: "flex-end" }}>
            <div style={{ ...S.field, flex: "0 1 200px" }}>
              <label style={S.label}>Extrusion length (mm)</label>
              <input
                style={S.input}
                type="number"
                placeholder="100"
                value={purgeLength}
                onChange={(e) => setPurgeLength(e.target.value)}
              />
            </div>
            <div style={{ ...S.field, flex: "1 1 200px", justifyContent: "flex-end" }}>
              <span style={S.hint}>
                ≈ {mmToGrams(parseFloat(purgeLength) || 0, density).toFixed(1)}g per spool load — filament extruded each time you load/swap a spool
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={S.actions}>
          <button style={S.calcBtn} onClick={calculate}>Calculate Stop Points</button>
          <button style={S.resetBtn} onClick={reset}>Reset</button>
        </div>

        {/* Results */}
        {results && (
          <div style={S.results}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={S.sectionLabel}>RESULTS</div>
              <div
                style={{
                  fontSize: 10,
                  color: results.mode === "gcode" ? "#22d3ee" : "#a1a1aa",
                  background: results.mode === "gcode" ? "rgba(34,211,238,0.1)" : "rgba(161,161,170,0.1)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {results.mode === "gcode" ? "G-CODE ACCURATE" : "LINEAR ESTIMATE"}
              </div>
            </div>

            <div style={S.statsRow}>
              {results.gramsPerLayer && (
                <div style={S.stat}>
                  <div style={S.statVal}>{results.gramsPerLayer} g</div>
                  <div style={S.statLabel}>avg per layer</div>
                </div>
              )}
              <div style={S.stat}>
                <div style={S.statVal}>{results.totalAvailable} g</div>
                <div style={S.statLabel}>available</div>
              </div>
              <div style={S.stat}>
                <div style={S.statVal}>{results.totalNeeded} g</div>
                <div style={S.statLabel}>print needs</div>
              </div>
              {results.totalPurgeWaste > 0 && (
                <div style={S.stat}>
                  <div style={{ ...S.statVal, color: "#f59e0b" }}>+{results.totalPurgeWaste} g</div>
                  <div style={S.statLabel}>purge waste ({results.numSwaps + 1} loads × {results.purgePerSwap}g)</div>
                </div>
              )}
              <div style={{ ...S.stat, borderColor: results.enough ? "#4ade80" : "#f87171" }}>
                <div style={{ ...S.statVal, color: results.enough ? "#4ade80" : "#f87171" }}>
                  {results.enough ? "✓ Enough" : "✗ Short"}
                </div>
                <div style={S.statLabel}>
                  {results.enough
                    ? `${Math.round(results.totalAvailable - results.totalWithPurge)}g spare`
                    : `need ${Math.round(results.totalWithPurge - results.totalAvailable)}g more`}
                </div>
              </div>
            </div>

            <div style={S.scheduleWrap}>
              <div style={S.sectionLabel}>PAUSE SCHEDULE</div>
              {results.schedule.map((s, i) => (
                <div key={i} style={S.scheduleRow}>
                  <div style={S.scheduleLeft}>
                    <div style={S.scheduleSpoolTag}>Spool {s.spool}</div>
                    <div style={S.scheduleMeta}>
                      {s.gramsAvailable}g available → {s.gramsUsed}g print{s.purgeGrams > 0 ? ` + ${s.purgeGrams}g purge` : ""}
                    </div>
                  </div>
                  <div style={S.scheduleCenter}>
                    <span style={S.layerRange}>Layer {s.startLayer} – {s.endLayer}</span>
                  </div>
                  <div style={S.scheduleRight}>
                    {s.pauseAfterLayer ? (
                      <div style={S.pauseBadge}>⏸ PAUSE before layer {s.pauseAfterLayer + 1}</div>
                    ) : (
                      <div style={S.doneBadge}>✓ DONE</div>
                    )}
                  </div>
                </div>
              ))}
              {results.layersCovered < results.totalLayers && (
                <div style={S.warning}>
                  ⚠ Only covers {results.layersCovered} of {results.totalLayers} layers. You need
                  more filament for layers {results.layersCovered + 1}–{results.totalLayers}.
                </div>
              )}
            </div>

            <div style={S.quickRef}>
              <div style={S.sectionLabel}>QUICK REF — set these markers in EufyMake Studio</div>
              <div style={S.quickRefBody}>
                {results.schedule
                  .filter((s) => s.pauseAfterLayer)
                  .map((s, i) => (
                    <div key={i} style={S.quickRefLine}>
                      <span style={S.qrLabel}>Set marker on</span>
                      <span style={S.qrLayer}>layer {s.pauseAfterLayer + 1}</span>
                      <span style={S.qrArrow}>→</span>
                      <span style={S.qrAction}>Swap Spool {s.spool} → Spool {s.spool + 1}</span>
                    </div>
                  ))}
                {results.schedule.filter((s) => s.pauseAfterLayer).length === 0 && (
                  <div style={S.quickRefLine}>
                    No pauses needed — single spool covers the whole print.
                  </div>
                )}
              </div>
              {results.schedule.filter((s) => s.pauseAfterLayer).length > 0 && (
                <div style={{ fontSize: 11, color: "#52525b", marginTop: 10 }}>
                  EufyMake pauses <em>before</em> printing the marked layer — set the marker on the first layer of the next spool.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: "100vh",
    background: "#111113",
    color: "#e4e4e7",
    fontFamily: "'IBM Plex Mono','SF Mono','Fira Code','Cascadia Code',monospace",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 720, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 32 },
  headerIcon: { fontSize: 36, color: "#22d3ee", lineHeight: 1 },
  title: { margin: 0, fontSize: 22, fontWeight: 600, color: "#f4f4f5", letterSpacing: "-0.02em" },
  subtitle: { margin: "2px 0 0", fontSize: 13, color: "#71717a", fontWeight: 400 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#52525b", marginBottom: 10, textTransform: "uppercase" },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  field: { flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, color: "#a1a1aa", fontWeight: 500 },
  input: { background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 6, padding: "10px 12px", fontSize: 15, color: "#f4f4f5", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  readOnly: { background: "#18181b", border: "1px solid #2e2e33", borderRadius: 6, padding: "10px 12px", fontSize: 15, color: "#22d3ee", fontWeight: 600, fontFamily: "inherit" },
  hint: { fontSize: 11, color: "#52525b" },
  modeToggle: { display: "flex", gap: 4, background: "#1c1c1f", borderRadius: 8, padding: 3, border: "1px solid #2e2e33" },
  modeBtn: { flex: 1, background: "none", border: "none", color: "#71717a", padding: "8px 14px", fontSize: 12, fontFamily: "inherit", fontWeight: 500, borderRadius: 6, cursor: "pointer" },
  modeActive: { flex: 1, background: "#22d3ee", color: "#111113", border: "none", padding: "8px 14px", fontSize: 12, fontFamily: "inherit", fontWeight: 700, borderRadius: 6, cursor: "pointer" },
  dropZone: { display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #2e2e33", borderRadius: 10, padding: "32px 16px", cursor: "pointer" },
  dropText: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 13, color: "#71717a" },
  gcodeInfo: { background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 8, padding: 14 },
  gcodeFile: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  gcodeStats: { fontSize: 12, color: "#22d3ee", marginTop: 6, fontWeight: 500 },
  densityBtn: { background: "#1c1c1f", border: "1px solid #2e2e33", color: "#71717a", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontFamily: "inherit", cursor: "pointer" },
  densityActive: { background: "rgba(34,211,238,0.15)", border: "1px solid #22d3ee", color: "#22d3ee", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontFamily: "inherit", fontWeight: 600, cursor: "pointer" },
  spoolGrid: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 },
  spoolCard: { flex: "1 1 160px", background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 8, padding: 12 },
  spoolHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  spoolNum: { fontSize: 12, fontWeight: 600, color: "#a1a1aa" },
  removeBtn: { background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 14, padding: "2px 6px", borderRadius: 4, lineHeight: 1 },
  addBtn: { background: "none", border: "1px dashed #3f3f46", color: "#71717a", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontFamily: "inherit", cursor: "pointer" },
  actions: { display: "flex", gap: 10, marginBottom: 28 },
  calcBtn: { background: "#22d3ee", color: "#111113", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: "0.02em" },
  resetBtn: { background: "none", border: "1px solid #2e2e33", color: "#71717a", borderRadius: 6, padding: "10px 16px", fontSize: 13, fontFamily: "inherit", cursor: "pointer" },
  results: { borderTop: "1px solid #2e2e33", paddingTop: 24 },
  statsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 },
  stat: { flex: "1 1 120px", background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 8, padding: "12px 14px", textAlign: "center" },
  statVal: { fontSize: 18, fontWeight: 700, color: "#f4f4f5" },
  statLabel: { fontSize: 11, color: "#52525b", marginTop: 2 },
  scheduleWrap: { marginBottom: 24 },
  scheduleRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, background: "#1c1c1f", border: "1px solid #2e2e33", borderRadius: 8, padding: "12px 14px", marginBottom: 8 },
  scheduleLeft: { flex: "1 1 180px" },
  scheduleSpoolTag: { fontSize: 13, fontWeight: 600, color: "#22d3ee" },
  scheduleMeta: { fontSize: 11, color: "#52525b", marginTop: 2 },
  scheduleCenter: { flex: "0 0 auto" },
  layerRange: { fontSize: 13, color: "#a1a1aa", fontWeight: 500 },
  scheduleRight: { flex: "0 0 auto", marginLeft: "auto" },
  pauseBadge: { background: "#422006", color: "#fbbf24", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4, whiteSpace: "nowrap" },
  doneBadge: { background: "#052e16", color: "#4ade80", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 4 },
  warning: { background: "#2a1215", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, marginTop: 8 },
  quickRef: { background: "#18181b", border: "1px solid #2e2e33", borderRadius: 8, padding: 16 },
  quickRefBody: { display: "flex", flexDirection: "column", gap: 8 },
  quickRefLine: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#d4d4d8" },
  qrLabel: { color: "#71717a" },
  qrLayer: { fontWeight: 700, color: "#fbbf24" },
  qrArrow: { color: "#52525b" },
  qrAction: { color: "#a1a1aa" },
};
