import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NE_STATES_GEO, NE_RIVER_GAUGES, NE_SLOPE_ZONES, NE_TELEMETRIC_STATIONS } from '../data/neSpatialData';

/**
 * Interactive Leaflet Map Component for North-East India WebGIS
 * Renders:
 * - High-resolution terrain slope heatmaps & instability zones
 * - Active river level gauges with warning/danger markers
 * - Color-coded state risk boundaries (Assam, Meghalaya, Arunachal, Manipur, Mizoram, Nagaland, Tripura, Sikkim)
 * - Geotagged citizen & authority incident markers
 * - Telemetric sensor stations with AI linking
 */

export default function DisasterMap({
  selectedState = 'All',
  selectedStation = null,
  onSelectStation = () => {},
  incidentReports = [],
  pinLocation = null,
  onMapClick = () => {},
  isPinningMode = false,
  activeLayers = {
    slopeZones: true,
    riverGauges: true,
    stateBoundaries: true,
    incidents: true,
    telemetry: true,
  },
  onToggleLayer = () => {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({
    stateBoundaries: L.layerGroup(),
    slopeZones: L.layerGroup(),
    riverGauges: L.layerGroup(),
    incidents: L.layerGroup(),
    telemetry: L.layerGroup(),
    pinMarker: L.layerGroup(),
    tileLayer: null,
  });

  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'topo' | 'osm'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on North-East India (approx lat 26.2, lng 93.0)
    const map = L.map(mapContainerRef.current, {
      center: [26.15, 92.95],
      zoom: 7,
      minZoom: 6,
      maxZoom: 17,
      zoomControl: false,
    });

    // Add zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Default Dark GIS basemap (CartoDB Dark Matter)
    const darkTileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    layerGroupsRef.current.tileLayer = darkTileLayer;

    // Add layer groups to map
    Object.entries(layerGroupsRef.current).forEach(([key, group]) => {
      if (key !== 'tileLayer') {
        group.addTo(map);
      }
    });

    mapInstanceRef.current = map;

    // Map click handler for pinning incident reports
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onMapClick({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layerGroupsRef.current.tileLayer) {
      map.removeLayer(layerGroupsRef.current.tileLayer);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; CARTO &copy; OpenStreetMap';

    if (mapStyle === 'topo') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap';
    } else if (mapStyle === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newTile = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
    newTile.bringToBack();
    layerGroupsRef.current.tileLayer = newTile;
  }, [mapStyle]);

  // Render State Boundaries Layer
  useEffect(() => {
    const group = layerGroupsRef.current.stateBoundaries;
    group.clearLayers();
    if (!activeLayers.stateBoundaries) return;

    const riskColors = {
      LOW: '#10b981',
      MODERATE: '#f59e0b',
      HIGH: '#f97316',
      CRITICAL: '#ef4444',
    };

    Object.values(NE_STATES_GEO).forEach((state) => {
      const color = riskColors[state.overallRisk] || '#38bdf8';
      const isSelected = selectedState === state.name;

      const polygon = L.polygon(state.polygon, {
        color: isSelected ? '#38bdf8' : color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 0.95 : 0.65,
        fillColor: color,
        fillOpacity: isSelected ? 0.22 : 0.1,
        dashArray: isSelected ? undefined : '4, 4',
      });

      polygon.bindTooltip(
        `<div class="p-1 text-xs font-sans">
          <p class="font-bold text-slate-100">${state.name} (${state.code})</p>
          <p class="text-slate-300">Risk: <span style="color:${color}" class="font-semibold">${state.overallRisk}</span></p>
          <p class="text-slate-400">Vulnerability: ${state.vulnerabilityIndex}/10</p>
        </div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      group.addLayer(polygon);
    });
  }, [activeLayers.stateBoundaries, selectedState]);

  // Render Terrain Slope Instability Heatmaps / Hotspots Layer
  useEffect(() => {
    const group = layerGroupsRef.current.slopeZones;
    group.clearLayers();
    if (!activeLayers.slopeZones) return;

    NE_SLOPE_ZONES.forEach((zone) => {
      const riskColor =
        zone.landslideRisk === 'CRITICAL'
          ? '#ef4444'
          : zone.landslideRisk === 'HIGH'
          ? '#f97316'
          : '#eab308';

      // Outer gradient buffer
      const outerCircle = L.circle([zone.lat, zone.lng], {
        radius: zone.radiusKm * 1000,
        color: riskColor,
        weight: 1,
        opacity: 0.4,
        fillColor: riskColor,
        fillOpacity: 0.12,
        dashArray: '3, 6',
      });

      // Core steep slope center
      const innerCircle = L.circle([zone.lat, zone.lng], {
        radius: (zone.radiusKm * 1000) / 2.5,
        color: riskColor,
        weight: 2,
        opacity: 0.85,
        fillColor: riskColor,
        fillOpacity: 0.35,
      });

      // Instability Icon
      const slopeIcon = L.divIcon({
        className: 'custom-slope-icon',
        html: `<div style="
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(15, 23, 42, 0.9);
          border: 2px solid ${riskColor};
          box-shadow: 0 0 10px ${riskColor}88;
          color: ${riskColor}; font-weight: 700; font-size: 11px;
        ">
          ${zone.slopeDegrees}°
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: slopeIcon });

      const popupContent = `
        <div class="p-2 text-slate-100 font-sans" style="min-width: 220px;">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
            <span class="text-xs font-bold text-amber-400">SLOPE INSTABILITY ZONE</span>
            <span class="text-xs px-1.5 py-0.5 rounded font-bold" style="background:${riskColor}22; color:${riskColor}; border:1px solid ${riskColor}">
              ${zone.landslideRisk}
            </span>
          </div>
          <h4 class="text-sm font-bold text-white">${zone.name}</h4>
          <p class="text-xs text-slate-400 mt-0.5">State: <strong class="text-slate-200">${zone.state}</strong></p>
          <div class="mt-2 text-xs space-y-1 bg-slate-900/80 p-2 rounded border border-slate-800">
            <div class="flex justify-between">
              <span class="text-slate-400">Slope Gradient:</span>
              <span class="font-mono font-bold text-amber-300">${zone.slopeDegrees}° inclination</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Soil Saturation:</span>
              <span class="font-mono font-bold text-blue-300">${zone.saturation}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Soil Geology:</span>
              <span class="text-slate-200 truncate max-w-[130px]" title="${zone.soilType}">${zone.soilType}</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-2 leading-relaxed italic">${zone.geology}</p>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-leaflet-popup' });

      group.addLayer(outerCircle);
      group.addLayer(innerCircle);
      group.addLayer(marker);
    });
  }, [activeLayers.slopeZones]);

  // Render River Level Gauges Layer
  useEffect(() => {
    const group = layerGroupsRef.current.riverGauges;
    group.clearLayers();
    if (!activeLayers.riverGauges) return;

    NE_RIVER_GAUGES.forEach((gauge) => {
      const isAboveDanger = gauge.currentLevel >= gauge.dangerLevel;
      const isAboveWarning = gauge.currentLevel >= gauge.warningLevel;
      const gaugeColor = isAboveDanger ? '#ef4444' : isAboveWarning ? '#f59e0b' : '#10b981';
      const statusText = isAboveDanger ? 'ABOVE DANGER' : isAboveWarning ? 'WARNING STAGE' : 'NORMAL FLOW';

      const gaugeIcon = L.divIcon({
        className: 'custom-gauge-icon',
        html: `<div style="
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          background: #090d16;
          border: 2px solid ${gaugeColor};
          box-shadow: 0 0 12px ${gaugeColor}99;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${gaugeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12h20"/>
            <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/>
            <path d="m4 8 4 4"/>
            <path d="m12 4v8"/>
            <path d="m20 8-4 4"/>
          </svg>
          ${
            isAboveDanger
              ? `<span style="
                  position: absolute; top: -4px; right: -4px; width: 8px; height: 8px;
                  border-radius: 50%; background: #ef4444; box-shadow: 0 0 6px #ef4444;
                "></span>`
              : ''
          }
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([gauge.lat, gauge.lng], { icon: gaugeIcon });

      const popupContent = `
        <div class="p-2 text-slate-100 font-sans" style="min-width: 230px;">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
            <span class="text-xs font-bold text-sky-400">RIVER GAUGE TELEMETRY</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold" style="background:${gaugeColor}22; color:${gaugeColor}; border:1px solid ${gaugeColor}">
              ${statusText}
            </span>
          </div>
          <h4 class="text-sm font-bold text-white">${gauge.river} at ${gauge.name}</h4>
          <p class="text-xs text-slate-400">${gauge.state} Catchment</p>
          <div class="mt-2 grid grid-cols-2 gap-1.5 bg-slate-900/90 p-2 rounded border border-slate-800 text-xs">
            <div>
              <p class="text-[10px] text-slate-400">CURRENT STAGE</p>
              <p class="font-mono text-sm font-extrabold" style="color:${gaugeColor}">${gauge.currentLevel.toFixed(2)} m</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">DANGER LEVEL</p>
              <p class="font-mono text-sm font-semibold text-rose-300">${gauge.dangerLevel.toFixed(2)} m</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">WARNING MARK</p>
              <p class="font-mono text-xs text-amber-300">${gauge.warningLevel.toFixed(2)} m</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400">STAGE TREND</p>
              <p class="font-bold text-xs ${gauge.trend === 'RISING' ? 'text-rose-400' : 'text-emerald-400'}">${gauge.trend}</p>
            </div>
          </div>
          <div class="mt-2 text-[11px] text-slate-400 flex justify-between">
            <span>Historical Peak (HFL):</span>
            <span class="font-mono font-bold text-slate-300">${gauge.highestFloodLevel} m</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-leaflet-popup' });
      group.addLayer(marker);
    });
  }, [activeLayers.riverGauges]);

  // Render Telemetric Station Markers (Link to AI Analysis)
  useEffect(() => {
    const group = layerGroupsRef.current.telemetry;
    group.clearLayers();
    if (!activeLayers.telemetry) return;

    NE_TELEMETRIC_STATIONS.forEach((stn) => {
      const isSelected = selectedStation && selectedStation.id === stn.id;
      const riskColors = {
        LOW: '#10b981',
        MODERATE: '#f59e0b',
        HIGH: '#f97316',
        CRITICAL: '#ef4444',
      };
      const color = riskColors[stn.riskLevel] || '#38bdf8';

      const stnIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `<div style="
          display: flex; align-items: center; justify-content: center;
          width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'};
          border-radius: 50%;
          background: #020617;
          border: 2px solid ${isSelected ? '#38bdf8' : color};
          box-shadow: 0 0 ${isSelected ? '16px #38bdf8' : '8px ' + color};
          transition: all 0.2s ease;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#38bdf8' : color}" stroke-width="2.5">
            <path d="M12 2a10 10 0 0 0-10 10c0 4.4 2.9 8.2 7 9.5V22h6v-.5c4.1-1.3 7-5.1 7-9.5A10 10 0 0 0 12 2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>`,
        iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
        iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
      });

      const marker = L.marker([stn.lat, stn.lng], { icon: stnIcon });

      const popupContent = `
        <div class="p-2 text-slate-100 font-sans" style="min-width: 240px;">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
            <span class="text-xs font-bold text-emerald-400">TELEMETRIC NODE</span>
            <span class="text-xs px-1.5 py-0.5 rounded font-bold" style="background:${color}22; color:${color}; border:1px solid ${color}">
              ${stn.riskLevel}
            </span>
          </div>
          <h4 class="text-sm font-bold text-white">${stn.name}</h4>
          <p class="text-xs text-slate-400">${stn.district}, ${stn.state}</p>
          <div class="mt-2 grid grid-cols-2 gap-1.5 bg-slate-900 p-2 rounded border border-slate-800 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 block">RAINFALL</span>
              <span class="font-mono font-bold text-sky-400">${stn.rainfall} mm/hr</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">SLOPE ANGLE</span>
              <span class="font-mono font-bold text-amber-400">${stn.terrainSlope}°</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">SOIL MOISTURE</span>
              <span class="font-mono font-bold text-emerald-400">${stn.soilSaturation}%</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">VULNERABILITY</span>
              <span class="font-mono font-bold text-rose-400">${stn.historicalIndex}/10</span>
            </div>
          </div>
          <button id="btn-analyze-${stn.id}" class="mt-2.5 w-full py-1.5 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
            Load Into AI Risk Evaluator
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-leaflet-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-analyze-${stn.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStation(stn);
            marker.closePopup();
          };
        }
      });

      group.addLayer(marker);
    });
  }, [activeLayers.telemetry, selectedStation]);

  // Render Geotagged Incident Markers Layer
  useEffect(() => {
    const group = layerGroupsRef.current.incidents;
    group.clearLayers();
    if (!activeLayers.incidents) return;

    incidentReports.forEach((rep) => {
      const isLandslide = rep.hazardType === 'LANDSLIDE';
      const isRoadBlock = rep.hazardType === 'ROAD_BLOCKAGE';
      const hazardColor = isLandslide ? '#f97316' : isRoadBlock ? '#eab308' : '#38bdf8';

      const incidentIcon = L.divIcon({
        className: 'custom-incident-icon',
        html: `<div style="
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 6px;
          background: #020617;
          border: 2px solid ${hazardColor};
          box-shadow: 0 0 10px ${hazardColor}88;
        ">
          ${
            isLandslide
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="${hazardColor}" stroke="none"><polygon points="3,20 10,7 15,14 18,9 22,20"/></svg>`
              : isRoadBlock
              ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${hazardColor}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${hazardColor}" stroke-width="2"><path d="M2 12c2.5-3 5-3 7.5 0 2.5 3 5 3 7.5 0 2.5-3 5-3 7 0"/><path d="M2 17c2.5-3 5-3 7.5 0 2.5 3 5 3 7.5 0 2.5-3 5-3 7 0"/></svg>`
          }
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([rep.lat, rep.lng], { icon: incidentIcon });

      const popupContent = `
        <div class="p-2 text-slate-100 font-sans" style="min-width: 250px;">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
            <span class="text-xs font-bold" style="color:${hazardColor}">${rep.hazardType.replace('_', ' ')} REPORT</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
              ${rep.status}
            </span>
          </div>
          <h4 class="text-sm font-bold text-white leading-tight">${rep.title}</h4>
          <p class="text-xs text-slate-400 mt-1">${rep.locationName}, ${rep.district}</p>
          <p class="text-xs text-slate-300 mt-1.5 bg-slate-900 p-2 rounded border border-slate-800 leading-relaxed">${rep.description}</p>
          <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Severity: <strong class="text-rose-400">${rep.severity}</strong></span>
            <span>${new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          ${
            rep.clusterId
              ? `<div class="mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">
                  <span>Spatial Cluster:</span> <span class="font-mono font-bold">${rep.clusterId}</span>
                </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-leaflet-popup' });
      group.addLayer(marker);
    });
  }, [activeLayers.incidents, incidentReports]);

  // Render Pin Location Marker when user clicks or selects location
  useEffect(() => {
    const group = layerGroupsRef.current.pinMarker;
    group.clearLayers();
    if (!pinLocation) return;

    const pinIcon = L.divIcon({
      className: 'custom-pin-icon',
      html: `<div style="
        position: relative; display: flex; align-items: center; justify-content: center;
        width: 34px; height: 34px; border-radius: 50%;
        background: #0284c7;
        border: 3px solid #ffffff;
        box-shadow: 0 0 15px #0284c7;
        animation: bounce 1s infinite alternate;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    const marker = L.marker([pinLocation.lat, pinLocation.lng], { icon: pinIcon });
    marker.bindTooltip('Pinned Location', { permanent: true, direction: 'top', className: 'leaflet-pin-tooltip' });
    group.addLayer(marker);

    // Pan map to pin location smoothly
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([pinLocation.lat, pinLocation.lng], { animate: true });
    }
  }, [pinLocation]);

  // Recenter map on Selected State
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedState && selectedState !== 'All' && NE_STATES_GEO[selectedState]) {
      const state = NE_STATES_GEO[selectedState];
      map.flyTo(state.center, state.zoom, { duration: 1.2 });
    } else if (selectedState === 'All') {
      map.flyTo([26.15, 92.95], 7, { duration: 1.2 });
    }
  }, [selectedState]);

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-white/10 bg-[#0a0c10] shadow-2xl">
      {/* Subtle tactical grid background pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none z-10"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Leaflet Mount Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left GIS Layer Controls - Immersive UI */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-lg border border-white/10 shadow-2xl flex flex-wrap gap-2 items-center max-w-[360px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Layers:</span>

          <button
            onClick={() => onToggleLayer('slopeZones')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayers.slopeZones
                ? 'bg-red-950/60 text-red-300 border border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Slope Hotspots
          </button>

          <button
            onClick={() => onToggleLayer('riverGauges')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayers.riverGauges
                ? 'bg-sky-950/60 text-sky-300 border border-sky-500/80 shadow-[0_0_8px_rgba(14,165,233,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            River Gauges
          </button>

          <button
            onClick={() => onToggleLayer('stateBoundaries')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayers.stateBoundaries
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            State Risks
          </button>

          <button
            onClick={() => onToggleLayer('incidents')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayers.incidents
                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Incidents
          </button>

          <button
            onClick={() => onToggleLayer('telemetry')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeLayers.telemetry
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Telemetry
          </button>
        </div>

        {/* Pinning Mode Banner */}
        {isPinningMode && (
          <div className="bg-red-950/90 border border-red-600 text-red-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Click anywhere on the map to pin exact incident coordinates.
          </div>
        )}
      </div>

      {/* Floating Tactical Live Sensors HUD (from Immersive UI theme) */}
      <div className="absolute bottom-14 left-3 z-[1000] hidden md:flex pointer-events-none">
        <div className="bg-black/70 backdrop-blur-md p-3.5 rounded-lg border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Live Sensors • {selectedStation ? selectedStation.name : 'NE Regional Average'}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Rainfall</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                {selectedStation ? selectedStation.rainfall : '58.4'}{' '}
                <span className="text-[9px] text-slate-400">mm/hr</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Soil Sat.</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                {selectedStation ? selectedStation.soilSaturation : '84.2'}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">River Gauge</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                {selectedStation ? `${selectedStation.riverGaugeLevel}m` : '+3.84m (Surge)'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Slope Stability</div>
              <div className="text-xs font-mono font-bold text-red-500">
                {selectedStation && selectedStation.terrainSlope > 30 ? 'CRITICAL' : 'HIGH RISK'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left Cartographic Legend & Basemap Switcher */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        {/* Basemap Switcher */}
        <div className="bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-2xl flex gap-1">
          <button
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              mapStyle === 'dark' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dark GIS
          </button>
          <button
            onClick={() => setMapStyle('topo')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              mapStyle === 'topo' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Topography
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
              mapStyle === 'osm' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenStreetMap
          </button>
        </div>

        {/* Quick Reset View Button */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([26.15, 92.95], 7, { duration: 1.0 });
            }
          }}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md text-slate-200 p-2 rounded-lg border border-white/10 shadow-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          title="Reset View to North-East India"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="hidden sm:inline">NE Overview</span>
        </button>
      </div>

      {/* Bottom Right Floating Status */}
      <div className="absolute bottom-3 right-3 z-[1000] pointer-events-none hidden sm:block">
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-400 flex items-center gap-2 shadow-2xl">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>WebGIS Realtime Feed • Brahmaputra / Barak / Sub-Himalayan Grid</span>
        </div>
      </div>
    </div>
  );
}
