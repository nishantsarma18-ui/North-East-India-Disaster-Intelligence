import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  MapPin,
  Wifi,
  WifiOff,
  User,
  Activity,
  Layers,
  PhoneCall,
  Bell,
  Download,
  AlertTriangle,
  RefreshCw,
  Compass
} from 'lucide-react';
import DisasterMap from './components/DisasterMap';
import CitizenView from './components/CitizenView';
import CommandDashboard from './components/CommandDashboard';
import OfflineReportModal from './components/OfflineReportModal';
import { INITIAL_INCIDENT_REPORTS, NE_STATES_GEO } from './data/neSpatialData';
import { offlineDb } from './utils/offlineDb';

export default function App() {
  // Persistent view mode: 'citizen' | 'command'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('ne_disaster_view_mode') || 'citizen';
  });

  const [selectedState, setSelectedState] = useState('Assam');
  const [selectedStation, setSelectedStation] = useState(null);
  const [incidentReports, setIncidentReports] = useState(INITIAL_INCIDENT_REPORTS);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);
  const [activeBroadcasts, setActiveBroadcasts] = useState([]);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState(null);

  // Map layer visibility toggles
  const [activeLayers, setActiveLayers] = useState({
    slopeZones: true,
    riverGauges: true,
    stateBoundaries: true,
    incidents: true,
    telemetry: true,
  });

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ne_disaster_view_mode', viewMode);
  }, [viewMode]);

  // Track network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    checkOfflineStore();

    // Fetch live reports and broadcasts from backend if available
    fetchBackendReports();
    fetchBackendBroadcasts();

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOfflineStore = async () => {
    try {
      const unsynced = await offlineDb.getUnsyncedReports();
      setOfflinePendingCount(unsynced.length);
    } catch (e) {
      console.warn('IndexedDB check error:', e);
    }
  };

  const syncOfflineReports = async () => {
    try {
      const unsynced = await offlineDb.getUnsyncedReports();
      if (unsynced.length === 0) return;

      const res = await fetch('/api/reports/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: unsynced }),
      });

      if (res.ok) {
        await offlineDb.markReportsSynced(unsynced.map((r) => r.id));
        setOfflinePendingCount(0);
        fetchBackendReports();
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    }
  };

  const fetchBackendReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          setIncidentReports(data.reports);
        }
      }
    } catch (err) {
      // Offline fallback: load from IndexedDB
      try {
        const local = await offlineDb.getAllLocalReports();
        if (local && local.length > 0) {
          setIncidentReports(local);
        }
      } catch (e) {}
    }
  };

  const fetchBackendBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcasts');
      if (res.ok) {
        const data = await res.json();
        if (data.broadcasts) {
          setActiveBroadcasts(data.broadcasts);
        }
      }
    } catch (err) {}
  };

  const handleMapClick = (coords) => {
    setPinLocation(coords);
    if (isPinningMode) {
      setIsPinningMode(false);
      setIsReportModalOpen(true);
    }
  };

  const handleToggleLayer = (layerName) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    setIncidentReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    try {
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.warn('Could not update status on server:', e);
    }
  };

  const handleDispatchBroadcast = async (broadcastPayload) => {
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastPayload),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBroadcasts((prev) => [data.broadcast, ...prev]);
      }
    } catch (err) {
      console.warn('Offline broadcast queue:', err);
    }
  };

  const handleInstallPwa = () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt();
      pwaInstallPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          setPwaInstallPrompt(null);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 flex flex-col antialiased selection:bg-red-600 selection:text-white">
      {/* Top Navigation & Operational Command Bar - Immersive UI */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-white">NE-Disaster Intelligence</h1>
            <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase">
              LIVE MONITORING: ASSAM / MANIPUR / SIKKIM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* View Mode Switcher */}
          <div className="flex gap-1 sm:gap-2 bg-slate-900 rounded-full p-1 border border-white/5">
            <button
              onClick={() => setViewMode('command')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'command'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Command Dashboard
            </button>
            <button
              onClick={() => setViewMode('citizen')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'citizen'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Citizen PWA
            </button>
          </div>

          {/* Telemetry and System Online Readout */}
          <div className="hidden lg:block text-right">
            <div className="text-xs font-mono text-slate-400">26.15°N, 92.95°E</div>
            <div className="text-xs font-mono text-green-500 uppercase flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {isOnline ? '● SYSTEM ONLINE' : '● OFFLINE (CACHE)'}
            </div>
          </div>

          {/* Offline/Online Status indicator (Mobile & Tablet) */}
          <div
            className={`p-2 rounded-xl border flex lg:hidden items-center gap-1 text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
            }`}
            title={isOnline ? 'Online - Live Telemetry' : 'Offline - Storing in IndexedDB'}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* PWA Install Button */}
          {pwaInstallPrompt && (
            <button
              onClick={handleInstallPwa}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-full text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              title="Install Progressive Web App"
            >
              <Download className="w-3.5 h-3.5" />
              Install PWA
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* Spatial WebGIS Map Frame */}
        <section className="h-[480px] sm:h-[540px] w-full">
          <DisasterMap
            selectedState={selectedState}
            selectedStation={selectedStation}
            onSelectStation={(station) => {
              setSelectedStation(station);
              setSelectedState(station.state);
              if (viewMode === 'citizen') {
                setViewMode('command');
              }
            }}
            incidentReports={incidentReports}
            pinLocation={pinLocation}
            onMapClick={handleMapClick}
            isPinningMode={isPinningMode}
            activeLayers={activeLayers}
            onToggleLayer={handleToggleLayer}
          />
        </section>

        {/* View Mode Switching: Citizen View vs Command Dashboard */}
        {viewMode === 'citizen' ? (
          <CitizenView
            selectedState={selectedState}
            onSelectState={setSelectedState}
            onOpenReportModal={() => {
              setIsPinningMode(false);
              setIsReportModalOpen(true);
            }}
            incidentReports={incidentReports}
            isOnline={isOnline}
            offlineReportsCount={offlinePendingCount}
          />
        ) : (
          <CommandDashboard
            incidentReports={incidentReports}
            onUpdateReportStatus={handleUpdateReportStatus}
            onDispatchBroadcast={handleDispatchBroadcast}
            selectedStation={selectedStation}
            activeBroadcasts={activeBroadcasts}
          />
        )}
      </main>

      {/* Offline/Online Geotagged Incident Reporting Modal */}
      <OfflineReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialLocation={pinLocation}
        onReportSaved={(newRep) => {
          setIncidentReports((prev) => [newRep, ...prev]);
          checkOfflineStore();
        }}
        isOnline={isOnline}
      />

      {/* Immersive UI Footer Ticker Bar */}
      <footer className="h-12 bg-black border-t border-white/10 flex items-center px-4 sm:px-6 mt-8 overflow-hidden z-20">
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee text-[11px] font-mono whitespace-nowrap">
            <span className="text-red-500 font-bold">[ALERT] SEVERE RAINFALL WARNING: MEGHALAYA (24H)</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-orange-500">[NOTICE] NH-6 RESTRICTED ACCESS NEAR JOWAI</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-green-500">[STATUS] POWER RESTORED IN ITANAGAR NORTH</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-red-500 font-bold">[ALERT] HAFLONG-JATINGA DEBRIS FLOW RISK: CRITICAL</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-sky-400">[TELEMETRY] BRAHMAPUTRA GAUGE: 48.92M (STABLE)</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-purple-400">[SYSTEM] AI INFERENCE ENGINE RUNNING ON GEMINI 2.5 FLASH</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-red-500 font-bold">[ALERT] SEVERE RAINFALL WARNING: MEGHALAYA (24H)</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-orange-500">[NOTICE] NH-6 RESTRICTED ACCESS NEAR JOWAI</span>
            <span className="text-slate-500 mx-4">|</span>
            <span className="text-green-500">[STATUS] POWER RESTORED IN ITANAGAR NORTH</span>
            <span className="text-slate-500 mx-4">|</span>
          </div>
        </div>
        <div className="w-auto shrink-0 text-right flex items-center justify-end gap-3 font-mono text-[10px] text-slate-500 pl-4 border-l border-white/10">
          <span className="hidden sm:inline">SENTINEL-2 SAT LATEST: 14:22 GMT</span>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
}
