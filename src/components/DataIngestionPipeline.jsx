import React, { useState, useEffect } from 'react';
import {
  Satellite,
  CloudRain,
  Waves,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Code2,
  Key,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  FileJson
} from 'lucide-react';

export default function DataIngestionPipeline({ onSelectStationForAi = () => {} }) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedData, setIngestedData] = useState(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState('STN-DIMA-01');
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline' | 'geojson' | 'architecture'
  const [statusMessage, setStatusMessage] = useState('');
  const [secretToken, setSecretToken] = useState('');

  const triggerIngestion = async () => {
    setIsIngesting(true);
    setStatusMessage('');
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (secretToken.trim()) {
        headers['X-Ingestion-Token'] = secretToken.trim();
      }

      const res = await fetch('/api/ingest-data', {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch ingestion pipeline`);
      }

      const data = await res.json();
      setIngestedData(data);
      if (data.features?.length > 0 && !selectedFeatureId) {
        setSelectedFeatureId(data.features[0].id);
      }
      setStatusMessage('Ingestion and harmonization completed successfully.');
    } catch (err) {
      console.error('Ingestion error:', err);
      setStatusMessage(`Ingestion Error: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Run initial ingestion on mount
  useEffect(() => {
    triggerIngestion();
  }, []);

  const selectedFeature = ingestedData?.features?.find((f) => f.id === selectedFeatureId) || ingestedData?.features?.[0];

  const handlePipeToAiSimulator = (feat) => {
    if (!feat) return;
    const p = feat.properties;
    const stationPayload = {
      id: feat.id,
      name: p.name,
      district: p.district,
      state: p.state,
      rainfall: p.meteorology.rainfall_rate_mm_hr,
      terrainSlope: p.terrainSlope_deg,
      riverGaugeLevel: p.hydrology.currentStage_m,
      soilSaturation: p.earthObservation.soilMoisture_pct,
      historicalIndex: p.state === 'Assam' || p.state === 'Meghalaya' ? 8.8 : 7.2,
      basin: p.hydrology.riverName
    };
    onSelectStationForAi(stationPayload);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Satellite className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Multi-Source Telemetry Ingestion Pipeline
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-mono">
                /netlify/functions/ingest-data
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Numerical Met APIs • CWC River Gauges • Copernicus Sentinel-1 SAR & INSAT-3DR
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex bg-slate-900/80 border border-white/10 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSubTab === 'pipeline' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline Monitor
            </button>
            <button
              onClick={() => setActiveSubTab('geojson')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSubTab === 'geojson' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              GeoJSON Output
            </button>
            <button
              onClick={() => setActiveSubTab('architecture')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeSubTab === 'architecture' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Netlify Architecture & Secrets
            </button>
          </div>

          <button
            onClick={triggerIngestion}
            disabled={isIngesting}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
            {isIngesting ? 'Ingesting...' : 'Trigger Pipeline'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
            statusMessage.includes('Error')
              ? 'bg-red-950/60 border border-red-500/80 text-red-200'
              : 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
          }`}
        >
          {statusMessage.includes('Error') ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Tab View: Pipeline Monitor */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <CloudRain className="w-4 h-4 text-sky-400" />
                <span>Weather Provider</span>
              </div>
              <div className="text-xs font-bold text-white mt-1.5 truncate">
                {ingestedData?.metadata?.providers?.weather || 'OpenWeatherMap / IMD'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Precipitation standardized to mm/hr</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Waves className="w-4 h-4 text-blue-400" />
                <span>Hydrology Network</span>
              </div>
              <div className="text-xs font-bold text-white mt-1.5 truncate">
                {ingestedData?.metadata?.providers?.hydrology || 'CWC River Gauge Telemetry'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Stages in Meters AMSL</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Satellite className="w-4 h-4 text-purple-400" />
                <span>Earth Observation (EO)</span>
              </div>
              <div className="text-xs font-bold text-white mt-1.5 truncate">
                {ingestedData?.metadata?.providers?.satellite || 'Sentinel-1 SAR / INSAT-3DR'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">SAR Backscatter (dB) & TIR Temp</div>
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>WebGIS Envelope</span>
              </div>
              <div className="text-xs font-bold text-white mt-1.5 truncate">
                {ingestedData?.features?.length || 0} Standardized Hotspots
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">RFC 7946 GeoJSON FeatureCollection</div>
            </div>
          </div>

          {/* Hotspot Ingestion Selector and Detail Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Hotspots List */}
            <div className="lg:col-span-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">
                Ingested Catchments & Stations
              </div>
              {ingestedData?.features?.map((f) => {
                const isSelected = f.id === selectedFeatureId;
                const p = f.properties;
                const isCritical = p.aiInferenceFeatures?.compositeHazardLevel === 'CRITICAL';
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFeatureId(f.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950/60 border-red-500 text-white shadow-lg shadow-red-950/50'
                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{p.name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-orange-950 text-orange-300 border border-orange-800'
                        }`}
                      >
                        {p.aiInferenceFeatures?.compositeHazardLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                      <span>{p.district}, {p.state}</span>
                      <span className="text-sky-400 font-bold">{p.meteorology.rainfall_rate_mm_hr} mm/hr</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Hotspot Deep Telemetry Breakdown */}
            {selectedFeature && (
              <div className="lg:col-span-8 bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedFeature.properties.name}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-white/10">
                        {selectedFeature.id}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Coordinates: {selectedFeature.geometry.coordinates[1].toFixed(4)}°N,{' '}
                      {selectedFeature.geometry.coordinates[0].toFixed(4)}°E • Elevation: {selectedFeature.properties.elevation_m}m AMSL
                    </p>
                  </div>

                  <button
                    onClick={() => handlePipeToAiSimulator(selectedFeature)}
                    className="py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Load into Gemini 2.0 AI Simulator
                  </button>
                </div>

                {/* Telemetry Harmonization Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Weather Standardization */}
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <CloudRain className="w-3.5 h-3.5" /> Meteorology (SI Units)
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Precipitation:</span>
                        <span className="text-white font-bold">{selectedFeature.properties.meteorology.rainfall_rate_mm_hr} mm/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Temperature:</span>
                        <span className="text-slate-200">{selectedFeature.properties.meteorology.temperature_celsius}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Barometric:</span>
                        <span className="text-slate-200">{selectedFeature.properties.meteorology.pressure_hpa} hPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wind Velocity:</span>
                        <span className="text-slate-200">{selectedFeature.properties.meteorology.wind_speed_kmh} km/h</span>
                      </div>
                    </div>
                  </div>

                  {/* Hydrology Standardization */}
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Waves className="w-3.5 h-3.5" /> Hydrology (CWC Benchmark)
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Stage:</span>
                        <span className="text-white font-bold">{selectedFeature.properties.hydrology.currentStage_m} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Danger Mark:</span>
                        <span className="text-red-400">{selectedFeature.properties.hydrology.dangerLevel_m} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">River Status:</span>
                        <span className="text-orange-300">{selectedFeature.properties.hydrology.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Discharge:</span>
                        <span className="text-slate-200">{selectedFeature.properties.hydrology.discharge_cumecs} cumecs</span>
                      </div>
                    </div>
                  </div>

                  {/* Satellite Earth Observation */}
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Satellite className="w-3.5 h-3.5" /> EO Satellite Telemetry
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">SAR Soil Moisture:</span>
                        <span className="text-emerald-400 font-bold">{selectedFeature.properties.earthObservation.soilMoisture_pct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SAR Backscatter:</span>
                        <span className="text-slate-200">{selectedFeature.properties.earthObservation.sarWaterBackscatter_db} dB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inundation Extent:</span>
                        <span className="text-blue-300">{selectedFeature.properties.earthObservation.floodExtent_sq_km} sq km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">IR Cloud-Top:</span>
                        <span className="text-slate-200">{selectedFeature.properties.earthObservation.cloudTopTemp_c}°C</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-Processed AI Feature Vector for Gemini */}
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Gemini AI Feature Tensors (Pre-Processed by Ingestion Pipeline)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Zero-Overhead Model Payload</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-slate-400 text-[10px]">Norm Rainfall</div>
                      <div className="text-white font-bold mt-0.5">{selectedFeature.properties.aiInferenceFeatures.normalizedRainfall} / 1.0</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-slate-400 text-[10px]">Slope Angle Factor</div>
                      <div className="text-white font-bold mt-0.5">{selectedFeature.properties.aiInferenceFeatures.normalizedSlope} / 1.0</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-slate-400 text-[10px]">River Crest Ratio</div>
                      <div className="text-white font-bold mt-0.5">{selectedFeature.properties.aiInferenceFeatures.riverCrestRatio}x DL</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-slate-400 text-[10px]">Landslide Hazard Idx</div>
                      <div className="text-orange-400 font-bold mt-0.5">{selectedFeature.properties.aiInferenceFeatures.landslideIndex} / 10</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtab: GeoJSON Raw Output */}
      {activeSubTab === 'geojson' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>RFC 7946 Standard GeoJSON FeatureCollection (EPSG:4326)</span>
            <span>Bytes: {JSON.stringify(ingestedData || {}).length} bytes</span>
          </div>
          <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[380px] leading-relaxed">
            {JSON.stringify(ingestedData, null, 2)}
          </pre>
        </div>
      )}

      {/* Subtab: Netlify Architecture & Secret Management Strategy */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
          {/* Authentication Token Tester */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-xs">
              <Key className="w-4 h-4 text-red-500" />
              Ingestion Webhook Token Authentication
            </div>
            <p className="text-slate-400">
              When <code className="text-red-400">INGESTION_SECRET_TOKEN</code> is set in Netlify environment variables, triggers must supply either an <code className="text-sky-300">X-Ingestion-Token</code> or <code className="text-sky-300">Authorization: Bearer &lt;token&gt;</code> header.
            </p>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="password"
                value={secretToken}
                onChange={(e) => setSecretToken(e.target.value)}
                placeholder="Optional INGESTION_SECRET_TOKEN tester"
                className="flex-1 bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
              />
              <button
                onClick={triggerIngestion}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs cursor-pointer"
              >
                Test Auth
              </button>
            </div>
          </div>

          {/* Architectural Briefing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="font-bold text-red-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                1. Netlify Environment Variables & Scope Isolation
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>
                  <strong>Scope Separation:</strong> Mark all API keys (<code className="text-slate-200">OPENWEATHER_API_KEY</code>, <code className="text-slate-200">COPERNICUS_SENTINEL_API_KEY</code>, <code className="text-slate-200">GEMINI_API_KEY</code>) with the <strong>Functions</strong> scope ONLY. Never expose them to build-time or client-side bundles.
                </li>
                <li>
                  <strong>Context Overrides:</strong> Configure distinct credentials for <em>Production</em> (live quota keys) vs <em>Deploy Previews / Branches</em> (sandbox/calibrated simulator) via Netlify UI or <code className="text-slate-200">netlify.toml</code>.
                </li>
                <li>
                  <strong>Secret Masking:</strong> Sensitive credentials are wiped from function stdout logs and wrapped in serverless error boundaries.
                </li>
              </ul>
            </div>

            <div className="bg-black/50 p-3.5 rounded-xl border border-white/10 space-y-2">
              <div className="font-bold text-sky-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-500" />
                2. Automated Cron Ingestion & Edge Caching
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>
                  <strong>Netlify Scheduled Functions:</strong> Schedule runs every 15 minutes using cron syntax <code className="text-slate-200">@netlify/functions schedule('*/15 * * * *', handler)</code> to pull Doppler radar and river levels.
                </li>
                <li>
                  <strong>Cache-Control & ETag:</strong> Responses serve <code className="text-slate-200">Cache-Control: public, max-age=180, s-maxage=300</code> with conditional <code className="text-slate-200">If-None-Match</code> (HTTP 304) reducing edge computation and third-party API rate quotas.
                </li>
                <li>
                  <strong>Spatial Storage:</strong> Ingested GeoJSON partitions can be persisted to Netlify Blobs or AWS S3 / Cloudflare R2 as Cloud-Optimized GeoTIFFs (COG) and FlatGeobufs for millisecond spatial queries.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
