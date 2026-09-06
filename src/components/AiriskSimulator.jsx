import React, { useState } from 'react';
import { Cpu, ShieldAlert, Sparkles, Send, RefreshCw, Languages, Info, CheckCircle2 } from 'lucide-react';
import { NE_TELEMETRIC_STATIONS } from '../data/neSpatialData';

export default function AiriskSimulator({
  selectedStation,
  onAiResponseReceived = () => {},
}) {
  const [rainfall, setRainfall] = useState(48);
  const [terrainSlope, setTerrainSlope] = useState(36);
  const [riverGaugeLevel, setRiverGaugeLevel] = useState(61.35);
  const [soilSaturation, setSoilSaturation] = useState(88);
  const [historicalIndex, setHistoricalIndex] = useState(8.5);
  const [locationName, setLocationName] = useState('Haflong - Jatinga Hill Corridor, Dima Hasao, Assam');
  const [riverName, setRiverName] = useState('Kopili / Jatinga Catchment');

  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [activeLang, setActiveLang] = useState('english');
  const [errorMessage, setErrorMessage] = useState('');

  // When a station is clicked on the map, populate the simulator
  React.useEffect(() => {
    if (selectedStation) {
      setRainfall(selectedStation.rainfall);
      setTerrainSlope(selectedStation.terrainSlope);
      setRiverGaugeLevel(selectedStation.riverGaugeLevel);
      setSoilSaturation(selectedStation.soilSaturation);
      setHistoricalIndex(selectedStation.historicalIndex);
      setLocationName(`${selectedStation.name}, ${selectedStation.district}, ${selectedStation.state}`);
      setRiverName(selectedStation.basin);
    }
  }, [selectedStation]);

  const runDisasterInference = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const payload = {
        rainfall: Number(rainfall),
        terrainSlope: Number(terrainSlope),
        riverGaugeLevel: Number(riverGaugeLevel),
        soilSaturation: Number(soilSaturation),
        historicalDisasterIndices: Number(historicalIndex),
        locationName,
        riverName,
      };

      const response = await fetch('/api/disaster-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);
      onAiResponseReceived(data);
    } catch (err) {
      console.error('Error invoking /api/disaster-ai:', err);
      setErrorMessage('Failed to query Gemini AI endpoint. Falling back to local physics calculation.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (stationId) => {
    const station = NE_TELEMETRIC_STATIONS.find((s) => s.id === stationId);
    if (station) {
      setRainfall(station.rainfall);
      setTerrainSlope(station.terrainSlope);
      setRiverGaugeLevel(station.riverGaugeLevel);
      setSoilSaturation(station.soilSaturation);
      setHistoricalIndex(station.historicalIndex);
      setLocationName(`${station.name}, ${station.district}, ${station.state}`);
      setRiverName(station.basin);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Gemini Hydro-Geological Intelligence Engine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-mono">
                gemini-2.0-flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-Hazard Machine Reasoning for Rainfall, Floods & Landslides in NE India
            </p>
          </div>
        </div>

        {/* Hotspot Presets */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 uppercase text-[10px] tracking-wider">Presets:</span>
          <button
            onClick={() => loadPreset('STN-DIMA-01')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Haflong (AS)
          </button>
          <button
            onClick={() => loadPreset('STN-SHIL-02')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Cherrapunji (ML)
          </button>
          <button
            onClick={() => loadPreset('STN-IMP-05')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Imphal (MN)
          </button>
          <button
            onClick={() => loadPreset('STN-GAN-07')}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            Teesta (SK)
          </button>
        </div>
      </div>

      {/* Interactive Telemetry Tuning Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Rainfall */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-slate-300">Precipitation Rate</span>
            <span className="font-mono font-bold text-sky-400">{rainfall} mm/hr</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="1"
            value={rainfall}
            onChange={(e) => setRainfall(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Drizzle (5)</span>
            <span>Downpour (40)</span>
            <span>Cloudburst (100+)</span>
          </div>
        </div>

        {/* Slope Angle */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-slate-300">Terrain Slope Angle</span>
            <span className="font-mono font-bold text-orange-400">{terrainSlope}° inclination</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={terrainSlope}
            onChange={(e) => setTerrainSlope(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Plains (0-15°)</span>
            <span>Hills (25-35°)</span>
            <span>Escarpment (45°+)</span>
          </div>
        </div>

        {/* River Gauge Level */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-slate-300">River Gauge Level</span>
            <span className="font-mono font-bold text-blue-400">{riverGaugeLevel} m</span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="0.1"
            value={riverGaugeLevel}
            onChange={(e) => setRiverGaugeLevel(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Baseline</span>
            <span>Warning Stage</span>
            <span>Severe Flood</span>
          </div>
        </div>

        {/* Soil Saturation */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-slate-300">Soil Moisture Saturation</span>
            <span className="font-mono font-bold text-emerald-400">{soilSaturation}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={soilSaturation}
            onChange={(e) => setSoilSaturation(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Dry (30%)</span>
            <span>Moist (60%)</span>
            <span>Saturated (85%+)</span>
          </div>
        </div>

        {/* Historical Vulnerability */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="font-semibold text-slate-300">Historical Hazard Index</span>
            <span className="font-mono font-bold text-red-400">{historicalIndex} / 10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={historicalIndex}
            onChange={(e) => setHistoricalIndex(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer h-1.5 bg-black/60 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Low Risk (1-3)</span>
            <span>Recurring (5-7)</span>
            <span>Chronic (8-10)</span>
          </div>
        </div>

        {/* Location & Basin Inputs */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sector / Catchment
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={runDisasterInference}
            disabled={isLoading}
            className="mt-2 w-full py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Querying Gemini 2.0 Flash...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Run AI Multi-Hazard Evaluation
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 font-mono">
          <Info className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* AI Inference Output Display */}
      {aiResult && (
        <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 space-y-4">
          {/* Top Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-2 font-mono ${
                  aiResult.overallRiskLevel === 'CRITICAL'
                    ? 'bg-red-950 text-red-300 border border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : aiResult.overallRiskLevel === 'HIGH'
                    ? 'bg-orange-950 text-orange-300 border border-orange-600'
                    : aiResult.overallRiskLevel === 'MODERATE'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>OVERALL RISK: {aiResult.overallRiskLevel}</span>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 text-xs font-semibold border border-white/10 font-mono">
                HAZARD: <strong className="text-white">{aiResult.hazardType}</strong>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Engine: <span className="text-red-400 font-semibold">{aiResult.source || 'Gemini 2.0 Flash'}</span>
            </div>
          </div>

          {/* Explainable AI (XAI) Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Explainable AI (XAI) Environmental Mechanics
            </h4>
            <p className="text-sm text-slate-200 bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed font-sans">
              {aiResult.xaiExplanation}
            </p>
          </div>

          {/* Recommended Actions: Citizen Safety vs Responder Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Citizen Safety */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Citizen Safety Directives
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aiResult.recommendedActions?.citizenSafety?.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Responder Operations */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Responder Operations (SDRF / NDRF)
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aiResult.recommendedActions?.responderOperations?.map((op, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0"></span>
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Multi-Lingual Alert Dispatch Previews */}
          {aiResult.multiLingualAlerts && (
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-purple-400" />
                  Regional Multi-Lingual Alert Dispatches
                </h5>

                {/* Language Switcher Tabs */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'english', label: 'English' },
                    { id: 'assamese', label: 'অসমীয়া' },
                    { id: 'manipuri', label: 'মৈতৈলোন্' },
                    { id: 'khasi', label: 'Khasi' },
                    { id: 'mizo', label: 'Mizo' },
                    { id: 'bengali', label: 'বাংলা' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setActiveLang(lang.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        activeLang === lang.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Content Box */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm font-sans text-slate-100 leading-relaxed font-medium">
                {aiResult.multiLingualAlerts[activeLang] || aiResult.multiLingualAlerts.english}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
