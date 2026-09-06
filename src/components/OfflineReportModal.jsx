import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, X, UploadCloud, CheckCircle, WifiOff } from 'lucide-react';
import { offlineDb } from '../utils/offlineDb';

export default function OfflineReportModal({
  isOpen,
  onClose,
  initialLocation,
  onReportSaved = () => {},
  isOnline = true,
}) {
  const [hazardType, setHazardType] = useState('LANDSLIDE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stateName, setStateName] = useState('Assam');
  const [district, setDistrict] = useState('');
  const [locationName, setLocationName] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [lat, setLat] = useState(initialLocation?.lat || 25.178);
  const [lng, setLng] = useState(initialLocation?.lng || 93.023);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (initialLocation) {
      setLat(initialLocation.lat);
      setLng(initialLocation.lng);
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(Number(position.coords.latitude.toFixed(4)));
        setLng(Number(position.coords.longitude.toFixed(4)));
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('GPS location error:', error);
        setIsGettingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) {
      alert('Please provide an incident title and landmark location.');
      return;
    }

    setIsSubmitting(true);
    const newReport = {
      id: `REP-OFF-${Date.now().toString().slice(-6)}`,
      hazardType,
      title: title.trim(),
      description: description.trim() || 'Reported via citizen emergency interface.',
      state: stateName,
      district: district.trim() || stateName,
      locationName: locationName.trim(),
      lat: Number(lat),
      lng: Number(lng),
      timestamp: new Date().toISOString(),
      severity,
      status: 'REPORTED',
      reporterType: 'CITIZEN',
      synced: isOnline,
      verificationScore: 0.85,
    };

    try {
      // 1. Always persist to client-side IndexedDB first for offline guarantee
      await offlineDb.saveReportLocally(newReport);

      // 2. If online, immediately sync to backend
      if (isOnline) {
        try {
          await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newReport),
          });
        } catch (netErr) {
          console.warn('Network sync failed, saved offline in IndexedDB:', netErr);
        }
      }

      onReportSaved(newReport);
      setSuccessNotice(
        isOnline
          ? 'Report submitted and synchronized with District Disaster Authority.'
          : 'Report saved offline in IndexedDB. Will sync automatically upon signal restoration.'
      );

      setTimeout(() => {
        setSuccessNotice('');
        onClose();
        setTitle('');
        setDescription('');
        setLocationName('');
      }, 1800);
    } catch (err) {
      console.error('Failed to save report:', err);
      alert('Error saving report to local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#05070a] border border-white/10 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="p-2.5 rounded-xl bg-red-950/80 text-red-500 border border-red-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Report Disaster Incident</h3>
            <p className="text-xs text-slate-400 font-mono">
              Low-Bandwidth & Offline Capable • NE Emergency Grid
            </p>
          </div>
        </div>

        {/* Offline notification badge */}
        {!isOnline && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/80 text-red-200 text-xs flex items-center gap-2 font-mono">
            <WifiOff className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              Device is currently offline. Your report will be stored securely in local <strong>IndexedDB</strong> and automatically relayed once connection resumes.
            </span>
          </div>
        )}

        {successNotice ? (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-200 text-sm flex items-center gap-3 my-4 font-mono">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hazard Type Radio Cards */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                Incident Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'LANDSLIDE', label: 'Landslide / Mudslip' },
                  { id: 'FLASH_FLOOD', label: 'Flash Flood' },
                  { id: 'ROAD_BLOCKAGE', label: 'Road / Bridge Cut' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setHazardType(item.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      hazardType === item.id
                        ? `bg-red-950/70 border-red-500 text-white shadow-md ring-1 ring-red-500`
                        : `bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Landmark */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Brief Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Boulders blocking highway 3km past Haflong"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* State & District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  State
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="Assam" className="bg-slate-900">Assam</option>
                  <option value="Meghalaya" className="bg-slate-900">Meghalaya</option>
                  <option value="Arunachal Pradesh" className="bg-slate-900">Arunachal Pradesh</option>
                  <option value="Manipur" className="bg-slate-900">Manipur</option>
                  <option value="Mizoram" className="bg-slate-900">Mizoram</option>
                  <option value="Nagaland" className="bg-slate-900">Nagaland</option>
                  <option value="Tripura" className="bg-slate-900">Tripura</option>
                  <option value="Sikkim" className="bg-slate-900">Sikkim</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Dima Hasao, East Khasi Hills"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Landmark / Sector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Landmark / Route Sector *
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. NH-27 Km Marker 42, Jatinga Bypass"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* GPS Coordinates & Fetch GPS Button */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Geotagged Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer font-mono"
                >
                  {isGettingLocation ? 'Detecting GPS...' : 'Use Device GPS'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">LATITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-200"
                  />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LONGITUDE</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Severity and Description */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Estimated Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['MODERATE', 'HIGH', 'CRITICAL'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`py-1.5 text-xs font-bold font-mono rounded-lg border transition-all cursor-pointer ${
                      severity === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-red-950 border-red-500 text-red-300 shadow-sm'
                          : lvl === 'HIGH'
                          ? 'bg-orange-950 border-orange-500 text-orange-300 shadow-sm'
                          : 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-white/5 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                Additional Observations / Citizen Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention stranded vehicles, rising water depth, or tree falls..."
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm border border-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                {isSubmitting ? 'Recording...' : isOnline ? 'Submit Incident' : 'Save Offline (IndexedDB)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
