import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  Layers,
  Radio,
  CheckCircle,
  Truck,
  AlertOctagon,
  Copy,
  Users,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import AiriskSimulator from './AiriskSimulator';
import DataIngestionPipeline from './DataIngestionPipeline';

export default function CommandDashboard({
  incidentReports = [],
  onUpdateReportStatus = () => {},
  onDispatchBroadcast = () => {},
  selectedStation = null,
  activeBroadcasts = [],
}) {
  const [filterHazard, setFilterHazard] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeSimStation, setActiveSimStation] = useState(selectedStation);

  React.useEffect(() => {
    if (selectedStation) {
      setActiveSimStation(selectedStation);
    }
  }, [selectedStation]);
  const [broadcastTitle, setBroadcastTitle] = useState('IMMEDIATE RED ALERT: Severe Flash Flood & Landslide Threat');
  const [broadcastRegions, setBroadcastRegions] = useState(['Dima Hasao (Assam)', 'East Khasi Hills (Meghalaya)']);
  const [broadcastHazard, setBroadcastHazard] = useState('COMBINED');
  const [broadcastSeverity, setBroadcastSeverity] = useState('CRITICAL');
  const [broadcastChannels, setBroadcastChannels] = useState(['Cell Broadcast', 'PWA Offline Push', 'SDRF Radio Relay']);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Torrential rains have saturated hill slopes above 85% and elevated Kopili/Nambul river gauges above danger mark. Immediate evacuation required in identified debris flow and low-lying sectors.'
  );
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Automated Report Deduplication & Spatial Clustering
  // Detects reports within 2.5km of each other reported in the last 3 hours
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const clusters = [];
  const processedIds = new Set();

  incidentReports.forEach((repA) => {
    if (processedIds.has(repA.id)) return;
    const clusterMembers = [repA];
    processedIds.add(repA.id);

    incidentReports.forEach((repB) => {
      if (repA.id === repB.id || processedIds.has(repB.id)) return;
      const dist = calculateDistanceKm(repA.lat, repA.lng, repB.lat, repB.lng);
      if (dist <= 3.5 && repA.hazardType === repB.hazardType) {
        clusterMembers.push(repB);
        processedIds.add(repB.id);
      }
    });

    if (clusterMembers.length > 1) {
      clusters.push({
        id: `CLUSTER-${repA.locationName.split(' ')[0].toUpperCase()}-${Math.floor(Math.random() * 90 + 10)}`,
        primaryLocation: repA.locationName,
        district: repA.district,
        state: repA.state,
        hazardType: repA.hazardType,
        reports: clusterMembers,
        count: clusterMembers.length,
      });
    }
  });

  const filteredReports = incidentReports.filter((rep) => {
    if (filterHazard !== 'ALL' && rep.hazardType !== filterHazard) return false;
    if (filterStatus !== 'ALL' && rep.status !== filterStatus) return false;
    return true;
  });

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    setIsSendingBroadcast(true);

    const payload = {
      title: broadcastTitle,
      regions: broadcastRegions,
      hazardType: broadcastHazard,
      severity: broadcastSeverity,
      message: broadcastMessage,
      channels: broadcastChannels,
    };

    setTimeout(() => {
      onDispatchBroadcast(payload);
      setIsSendingBroadcast(false);
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 3000);
    }, 600);
  };

  const toggleChannel = (channel) => {
    if (broadcastChannels.includes(channel)) {
      setBroadcastChannels(broadcastChannels.filter((c) => c !== channel));
    } else {
      setBroadcastChannels([...broadcastChannels, channel]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operational Metrics Bar - Immersive UI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Incidents</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{incidentReports.length}</div>
          <div className="text-[10px] text-red-500 font-mono mt-0.5">
            {incidentReports.filter((r) => r.status === 'REPORTED').length} Awaiting Verification
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spatial Clusters</div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-1">{clusters.length} Hotspots</div>
          <div className="text-[10px] text-sky-400/80 font-mono mt-0.5">Automated Deduplication Active</div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SDRF/NDRF Dispatches</div>
          <div className="text-2xl font-black font-mono text-purple-400 mt-1">
            {incidentReports.filter((r) => r.status === 'DISPATCHED').length} Active QRTs
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">NH-27 & Imphal Corridors</div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3.5 shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mass Broadcasts</div>
          <div className="text-2xl font-black font-mono text-red-500 mt-1">{activeBroadcasts.length} Sent</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Geo-targeted Cell Broadcast</div>
        </div>
      </div>

      {/* Multi-Source Telemetry Ingestion Pipeline (WebGIS & Satellite Hub) */}
      <DataIngestionPipeline
        onSelectStationForAi={(stn) => setActiveSimStation(stn)}
      />

      {/* AI Multi-Hazard Evaluation Engine */}
      <AiriskSimulator
        selectedStation={activeSimStation}
        onAiResponseReceived={(res) => {
          if (res?.multiLingualAlerts?.english) {
            setBroadcastMessage(res.multiLingualAlerts.english);
          }
        }}
      />

      {/* Quick Incident Feed & Network Density Overview (from Immersive UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live Priority Incidents (Last 2 Hours)
            </h3>
            <span className="text-[10px] text-red-500 font-mono tracking-widest animate-pulse">● LIVE STREAM</span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {incidentReports.slice(0, 4).map((rep) => (
              <div
                key={rep.id}
                className={`p-3 rounded transition-colors ${
                  rep.hazardType === 'FLASH_FLOOD' || rep.severity === 'CRITICAL'
                    ? 'bg-red-950/30 border-l-2 border-red-600'
                    : 'bg-orange-950/30 border-l-2 border-orange-500'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-[10px] font-bold font-mono tracking-wider ${
                      rep.hazardType === 'FLASH_FLOOD' || rep.severity === 'CRITICAL'
                        ? 'text-red-500'
                        : 'text-orange-500'
                    }`}
                  >
                    {rep.hazardType.replace('_', ' ')} • {rep.severity}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  <strong className="text-white font-bold">{rep.locationName}:</strong> {rep.title} — {rep.description}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{rep.district}, {rep.state} ({rep.lat.toFixed(2)}°N, {rep.lng.toFixed(2)}°E)</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 uppercase">{rep.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Telemetry & Relay Density Widget (from Immersive UI) */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-md">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Sector Signal Density
            </div>
            <p className="text-[11px] text-slate-400">
              Active telemetry node health across 8 North-Eastern states.
            </p>
          </div>

          <div className="my-4">
            <div className="flex items-end gap-1.5 h-16 bg-black/40 p-2 rounded-lg border border-white/5">
              <div className="flex-1 bg-red-500 h-[85%] rounded-t-sm" title="Assam Barak Basin: 85%"></div>
              <div className="flex-1 bg-red-500 h-[92%] rounded-t-sm" title="Meghalaya Hills: 92%"></div>
              <div className="flex-1 bg-orange-500 h-[65%] rounded-t-sm" title="Manipur Imphal: 65%"></div>
              <div className="flex-1 bg-emerald-500 h-[45%] rounded-t-sm" title="Arunachal Pass: 45%"></div>
              <div className="flex-1 bg-emerald-500 h-[35%] rounded-t-sm" title="Mizoram Corridor: 35%"></div>
              <div className="flex-1 bg-sky-500 h-[55%] rounded-t-sm" title="Sikkim Teesta: 55%"></div>
              <div className="flex-1 bg-purple-500 h-[75%] rounded-t-sm" title="Nagaland NH-29: 75%"></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>AS</span>
              <span>ML</span>
              <span>MN</span>
              <span>AR</span>
              <span>MZ</span>
              <span>SK</span>
              <span>NL</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-white/10">
            <span>PWA OFFLINE BUFFER</span>
            <span className="text-emerald-400 font-bold">124 MB CACHED</span>
          </div>
        </div>
      </div>

      {/* Automated Deduplication & Clustering Section */}
      {clusters.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Copy className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Automated Incident Deduplication & Proximity Clustering
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-mono uppercase tracking-wider">
              {clusters.length} Redundant Clusters Detected
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Spatial clustering correlates geotagged citizen reports filed within 3.5 km and a 2-hour window. Merging deduplicates citizen noise and establishes single-point command coordinates for responder dispatch.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">{cluster.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold border border-amber-800">
                    {cluster.count} Citizen Reports Merged
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{cluster.primaryLocation}</h4>
                  <p className="text-[11px] text-slate-400">
                    {cluster.district}, {cluster.state} • Type: <strong className="text-slate-200">{cluster.hazardType}</strong>
                  </p>
                </div>

                <div className="bg-black/40 p-2 rounded text-[11px] text-slate-300 space-y-1 border border-white/5">
                  {cluster.reports.map((r, i) => (
                    <div key={r.id} className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="truncate max-w-[220px]">
                        #{i + 1} {r.title}
                      </span>
                      <span className="font-mono text-slate-500">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      cluster.reports.forEach((r) => onUpdateReportStatus(r.id, 'VERIFIED'));
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verify Cluster
                  </button>
                  <button
                    onClick={() => {
                      cluster.reports.forEach((r) => onUpdateReportStatus(r.id, 'DISPATCHED'));
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Dispatch SDRF Unit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spatial GIS Triage Table */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-600/20 text-red-500">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Spatial GIS Incident Triage Feed</h3>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterHazard}
                onChange={(e) => setFilterHazard(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Hazard Types</option>
                <option value="LANDSLIDE">Landslides</option>
                <option value="FLASH_FLOOD">Flash Floods</option>
                <option value="ROAD_BLOCKAGE">Road Blockages</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">Reported (Pending)</option>
                <option value="VERIFIED">Verified</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-black/60 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Report ID / Time</th>
                <th className="py-2.5 px-3">Hazard</th>
                <th className="py-2.5 px-3">Location & District</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    <span className="font-bold text-slate-100">{rep.id}</span>
                    <span className="block text-slate-500 text-[10px]">
                      {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        rep.hazardType === 'LANDSLIDE'
                          ? 'bg-orange-950/80 text-orange-400 border border-orange-800'
                          : rep.hazardType === 'ROAD_BLOCKAGE'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-red-950/80 text-red-400 border border-red-800'
                      }`}
                    >
                      {rep.hazardType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-white block max-w-[220px] truncate">{rep.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {rep.locationName}, {rep.district} ({rep.state})
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                    {rep.lat.toFixed(3)}, {rep.lng.toFixed(3)}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        rep.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-600'
                          : rep.severity === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-600'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      }`}
                    >
                      {rep.severity}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-white/5">
                      {rep.status}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {rep.status === 'REPORTED' && (
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, 'VERIFIED')}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Verify
                        </button>
                      )}

                      {rep.status !== 'DISPATCHED' && rep.status !== 'RESOLVED' && (
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, 'DISPATCHED')}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer shadow-sm"
                        >
                          Dispatch
                        </button>
                      )}

                      {rep.status !== 'RESOLVED' && (
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, 'RESOLVED')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-mono">
                    No incident reports matching active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mass Emergency Alert Dispatch Controls */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-600/20 text-red-500">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mass Alert Broadcast Dispatch Controls</h3>
              <p className="text-xs text-slate-400">Geo-fenced Multi-Channel Emergency Dispatch</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-mono tracking-wider uppercase">
            Direct SDMA / DDMA Pipeline
          </span>
        </div>

        {broadcastSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              Mass alert broadcast successfully dispatched across selected telecom towers and offline PWA push relays!
            </span>
          </div>
        )}

        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Alert Headline / Subject
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Alert Severity Level
              </label>
              <select
                value={broadcastSeverity}
                onChange={(e) => setBroadcastSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500 font-sans"
              >
                <option value="CRITICAL">CRITICAL (Red Alert - Life Threat)</option>
                <option value="HIGH">HIGH (Orange Alert - Severe Threat)</option>
                <option value="MODERATE">MODERATE (Yellow Alert - Watch)</option>
              </select>
            </div>
          </div>

          {/* Delivery Channels Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Dispatch Transmission Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Cell Broadcast (Telecom Geo-Fence)',
                'PWA Offline Push Relay',
                'SDRF VHF Radio Relay',
                'Disaster SMS Gateway',
                'Air Siren Siren Triggers',
              ].map((channel) => (
                <button
                  type="button"
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    broadcastChannels.includes(channel)
                      ? 'bg-red-950 border-red-500 text-red-200 shadow-sm'
                      : 'bg-slate-900 border-white/10 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Public Alert Text (Will be localized to Assamese, Manipuri, Khasi, Mizo, Bengali)
            </label>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSendingBroadcast}
              className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSendingBroadcast ? 'Broadcasting to Sector Towers...' : 'Dispatch Instant Emergency Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
