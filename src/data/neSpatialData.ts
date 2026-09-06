import { RiverGauge, SlopeZone, TelemetricStation, IncidentReport } from '../types';

export interface StateGeoInfo {
  code: string;
  name: string;
  capital: string;
  center: [number, number];
  zoom: number;
  overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  vulnerabilityIndex: number;
  activeHazards: string[];
  helpline: string;
  polygon: [number, number][]; // Simplified state boundary for Leaflet Polygon rendering
}

export const NE_STATES_GEO: Record<string, StateGeoInfo> = {
  Assam: {
    code: 'AS',
    name: 'Assam',
    capital: 'Dispur / Guwahati',
    center: [26.2006, 92.9376],
    zoom: 7,
    overallRisk: 'CRITICAL',
    vulnerabilityIndex: 8.7,
    activeHazards: ['Riverine Flood', 'Flash Flood', 'Barail Range Landslide'],
    helpline: '1070 / 1079 (ASDMA)',
    polygon: [
      [27.9, 95.8],
      [27.4, 95.4],
      [26.9, 94.6],
      [26.4, 93.6],
      [25.0, 93.1],
      [24.5, 92.8],
      [24.8, 92.4],
      [25.7, 92.0],
      [26.1, 91.5],
      [26.0, 90.0],
      [26.2, 89.8],
      [26.6, 90.1],
      [26.8, 92.1],
      [27.0, 93.5],
      [27.8, 95.2],
      [27.9, 95.8]
    ]
  },
  Meghalaya: {
    code: 'ML',
    name: 'Meghalaya',
    capital: 'Shillong',
    center: [25.5788, 91.8933],
    zoom: 8,
    overallRisk: 'CRITICAL',
    vulnerabilityIndex: 8.9,
    activeHazards: ['Extreme Rainfall', 'Escarpment Landslides', 'Urban Flash Flood'],
    helpline: '1070 / 0364-2226571 (SDMA)',
    polygon: [
      [26.1, 91.8],
      [25.8, 92.5],
      [25.2, 92.7],
      [25.1, 91.5],
      [25.2, 90.1],
      [25.5, 90.0],
      [26.0, 90.7],
      [26.1, 91.8]
    ]
  },
  'Arunachal Pradesh': {
    code: 'AR',
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    center: [28.218, 94.7278],
    zoom: 7,
    overallRisk: 'HIGH',
    vulnerabilityIndex: 8.1,
    activeHazards: ['Sub-Himalayan Landslides', 'Cloudbursts', 'Debris Damming'],
    helpline: '1070 / 0360-2212222',
    polygon: [
      [29.3, 95.0],
      [28.8, 96.5],
      [27.8, 96.9],
      [27.0, 95.8],
      [27.1, 93.6],
      [27.3, 92.0],
      [28.0, 92.2],
      [28.5, 94.0],
      [29.3, 95.0]
    ]
  },
  Manipur: {
    code: 'MN',
    name: 'Manipur',
    capital: 'Imphal',
    center: [24.6637, 93.9063],
    zoom: 8,
    overallRisk: 'CRITICAL',
    vulnerabilityIndex: 8.4,
    activeHazards: ['Valley Inundation', 'Nambul/Imphal River Overflow', 'Hill Road Slips'],
    helpline: '0385-2443441 / 1070',
    polygon: [
      [25.7, 94.2],
      [25.3, 94.6],
      [24.3, 94.4],
      [23.9, 93.5],
      [24.2, 93.1],
      [25.1, 93.4],
      [25.7, 94.2]
    ]
  },
  Mizoram: {
    code: 'MZ',
    name: 'Mizoram',
    capital: 'Aizawl',
    center: [23.1645, 92.9376],
    zoom: 8,
    overallRisk: 'HIGH',
    vulnerabilityIndex: 7.9,
    activeHazards: ['Steep Ridge Landslides', 'Aizawl Urban Slope Failure'],
    helpline: '1070 / 0389-2335842',
    polygon: [
      [24.5, 92.9],
      [24.1, 93.3],
      [23.0, 93.1],
      [22.0, 92.9],
      [22.4, 92.4],
      [23.7, 92.6],
      [24.5, 92.9]
    ]
  },
  Nagaland: {
    code: 'NL',
    name: 'Nagaland',
    capital: 'Kohima',
    center: [26.1584, 94.5624],
    zoom: 8,
    overallRisk: 'MODERATE',
    vulnerabilityIndex: 7.2,
    activeHazards: ['NH-2 Subsidence', 'Monsoon Hill Slips'],
    helpline: '1070 / 0370-2270050',
    polygon: [
      [27.0, 95.2],
      [26.5, 95.3],
      [25.6, 94.5],
      [25.6, 93.8],
      [26.3, 94.3],
      [27.0, 95.2]
    ]
  },
  Tripura: {
    code: 'TR',
    name: 'Tripura',
    capital: 'Agartala',
    center: [23.8315, 91.2868],
    zoom: 8,
    overallRisk: 'MODERATE',
    vulnerabilityIndex: 6.8,
    activeHazards: ['Howrah River Flash Flooding', 'Lowland Siltation'],
    helpline: '1070 / 0381-2416045',
    polygon: [
      [24.5, 92.2],
      [24.1, 92.3],
      [23.0, 91.9],
      [23.3, 91.2],
      [24.1, 91.3],
      [24.5, 92.2]
    ]
  },
  Sikkim: {
    code: 'SK',
    name: 'Sikkim',
    capital: 'Gangtok',
    center: [27.533, 88.5122],
    zoom: 8,
    overallRisk: 'HIGH',
    vulnerabilityIndex: 8.3,
    activeHazards: ['GLOF Threat', 'Teesta Debris Surge', 'NH-10 Highway Severance'],
    helpline: '1070 / 03592-202461',
    polygon: [
      [28.1, 88.7],
      [27.8, 88.9],
      [27.1, 88.8],
      [27.1, 88.1],
      [27.7, 88.1],
      [28.1, 88.7]
    ]
  }
};

export const NE_RIVER_GAUGES: RiverGauge[] = [
  {
    id: 'GAUGE-BP-GUW',
    name: 'Guwahati Pandu Ghat',
    river: 'Brahmaputra',
    state: 'Assam',
    currentLevel: 48.45,
    warningLevel: 48.68,
    dangerLevel: 49.68,
    highestFloodLevel: 51.46,
    trend: 'RISING',
    lat: 26.183,
    lng: 91.702
  },
  {
    id: 'GAUGE-BP-DIB',
    name: 'Dibrugarh Sadar Ghat',
    river: 'Brahmaputra',
    state: 'Assam',
    currentLevel: 104.9,
    warningLevel: 104.7,
    dangerLevel: 105.7,
    highestFloodLevel: 106.48,
    trend: 'RISING',
    lat: 27.482,
    lng: 94.912
  },
  {
    id: 'GAUGE-KOP-KAM',
    name: 'Kampur Station (Nagaon)',
    river: 'Kopili',
    state: 'Assam',
    currentLevel: 61.35,
    warningLevel: 59.5,
    dangerLevel: 60.5,
    highestFloodLevel: 62.2,
    trend: 'RISING', // Above danger mark!
    lat: 26.048,
    lng: 92.831
  },
  {
    id: 'GAUGE-BAR-SIL',
    name: 'Annapurna Ghat, Silchar',
    river: 'Barak',
    state: 'Assam',
    currentLevel: 19.62,
    warningLevel: 18.83,
    dangerLevel: 19.83,
    highestFloodLevel: 21.98,
    trend: 'RISING',
    lat: 24.833,
    lng: 92.798
  },
  {
    id: 'GAUGE-TEE-DOM',
    name: 'Teesta Bazar / Singtam',
    river: 'Teesta',
    state: 'Sikkim',
    currentLevel: 85.45,
    warningLevel: 84.8,
    dangerLevel: 85.95,
    highestFloodLevel: 87.2,
    trend: 'RISING',
    lat: 27.234,
    lng: 88.502
  },
  {
    id: 'GAUGE-SUB-BAD',
    name: 'Badatighat (Lakhimpur)',
    river: 'Subansiri',
    state: 'Assam',
    currentLevel: 82.25,
    warningLevel: 81.53,
    dangerLevel: 82.53,
    highestFloodLevel: 84.1,
    trend: 'STEADY',
    lat: 27.012,
    lng: 94.135
  },
  {
    id: 'GAUGE-NAM-IMP',
    name: 'Keishamthong Gauge Bridge',
    river: 'Nambul',
    state: 'Manipur',
    currentLevel: 782.85,
    warningLevel: 782.0,
    dangerLevel: 783.0,
    highestFloodLevel: 784.1,
    trend: 'RISING',
    lat: 24.795,
    lng: 93.932
  },
  {
    id: 'GAUGE-HOW-AGA',
    name: 'Chandanmura Bridge',
    river: 'Howrah',
    state: 'Tripura',
    currentLevel: 10.35,
    warningLevel: 9.8,
    dangerLevel: 10.8,
    highestFloodLevel: 11.6,
    trend: 'FALLING',
    lat: 23.828,
    lng: 91.295
  }
];

export const NE_SLOPE_ZONES: SlopeZone[] = [
  {
    id: 'SLOPE-HAFLONG',
    name: 'Barail Hill Corridor (NH-27)',
    state: 'Assam',
    slopeDegrees: 37,
    geology: 'Disang & Barail Shales with loose overburden',
    soilType: 'Silty Clay Loam',
    saturation: 88,
    landslideRisk: 'CRITICAL',
    lat: 25.178,
    lng: 93.023,
    radiusKm: 18
  },
  {
    id: 'SLOPE-CHERRA',
    name: 'Sohra / Mawsynram Escarpment',
    state: 'Meghalaya',
    slopeDegrees: 43,
    geology: 'Cretaceous Sandstone over Pre-Cambrian Basement',
    soilType: 'Lateritic gravelly soil',
    saturation: 94,
    landslideRisk: 'CRITICAL',
    lat: 25.298,
    lng: 91.722,
    radiusKm: 22
  },
  {
    id: 'SLOPE-AIZAWL',
    name: 'Aizawl Terraced Ridges',
    state: 'Mizoram',
    slopeDegrees: 34,
    geology: 'Surma Series Sandstone & Mudstone',
    soilType: 'Residual Sandy Clay',
    saturation: 82,
    landslideRisk: 'HIGH',
    lat: 23.731,
    lng: 92.718,
    radiusKm: 14
  },
  {
    id: 'SLOPE-KARSINGSA',
    name: 'Papum Pare Sub-Himalayan Flank',
    state: 'Arunachal Pradesh',
    slopeDegrees: 38,
    geology: 'Siwalik Fragile Molasse',
    soilType: 'Unconsolidated Boulder Conglomerate',
    saturation: 79,
    landslideRisk: 'HIGH',
    lat: 27.135,
    lng: 93.722,
    radiusKm: 25
  },
  {
    id: 'SLOPE-CHUNGTHANG',
    name: 'North Sikkim Teesta Valley Gash',
    state: 'Sikkim',
    slopeDegrees: 46,
    geology: 'Higher Himalayan Gneiss with glacial moraines',
    soilType: 'Coarse glacio-fluvial debris',
    saturation: 89,
    landslideRisk: 'CRITICAL',
    lat: 27.604,
    lng: 88.647,
    radiusKm: 20
  },
  {
    id: 'SLOPE-KOHIMA',
    name: 'Zubza - Kohima Ridgeline',
    state: 'Nagaland',
    slopeDegrees: 31,
    geology: 'Oligocene Disang Turbidites',
    soilType: 'Heavy plastic clay',
    saturation: 76,
    landslideRisk: 'MODERATE',
    lat: 25.675,
    lng: 94.108,
    radiusKm: 15
  }
];

export const NE_TELEMETRIC_STATIONS: TelemetricStation[] = [
  {
    id: 'STN-DIMA-01',
    name: 'Haflong Telemetry Node',
    state: 'Assam',
    district: 'Dima Hasao',
    basin: 'Kopili-Jatinga Catchment',
    lat: 25.178,
    lng: 93.023,
    rainfall: 52, // mm/hr
    terrainSlope: 36, // deg
    riverGaugeLevel: 61.35, // Kopili gauge reading
    gaugeDangerMark: 60.5,
    soilSaturation: 89, // %
    historicalIndex: 8.9,
    riskLevel: 'CRITICAL',
    hazardType: 'COMBINED',
    elevationMeters: 680
  },
  {
    id: 'STN-SHIL-02',
    name: 'Cherrapunji Meteorological Radar',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    basin: 'Shella / Surma Tributaries',
    lat: 25.298,
    lng: 91.722,
    rainfall: 68, // Extreme rain
    terrainSlope: 42,
    riverGaugeLevel: 14.8,
    gaugeDangerMark: 13.5,
    soilSaturation: 96,
    historicalIndex: 9.4,
    riskLevel: 'CRITICAL',
    hazardType: 'LANDSLIDE',
    elevationMeters: 1430
  },
  {
    id: 'STN-GUW-03',
    name: 'Guwahati Metro Inundation Cell',
    state: 'Assam',
    district: 'Kamrup Metro',
    basin: 'Brahmaputra Central',
    lat: 26.183,
    lng: 91.745,
    rainfall: 38,
    terrainSlope: 14,
    riverGaugeLevel: 48.45,
    gaugeDangerMark: 49.68,
    soilSaturation: 81,
    historicalIndex: 7.8,
    riskLevel: 'HIGH',
    hazardType: 'FLOOD',
    elevationMeters: 55
  },
  {
    id: 'STN-ITA-04',
    name: 'Papum Pare Basin Sensor',
    state: 'Arunachal Pradesh',
    district: 'Papum Pare',
    basin: 'Dikrong / Subansiri',
    lat: 27.135,
    lng: 93.722,
    rainfall: 44,
    terrainSlope: 35,
    riverGaugeLevel: 82.25,
    gaugeDangerMark: 82.53,
    soilSaturation: 83,
    historicalIndex: 7.5,
    riskLevel: 'HIGH',
    hazardType: 'COMBINED',
    elevationMeters: 420
  },
  {
    id: 'STN-IMP-05',
    name: 'Imphal Valley Triage Hub',
    state: 'Manipur',
    district: 'Imphal West',
    basin: 'Manipur / Nambul River',
    lat: 24.795,
    lng: 93.932,
    rainfall: 41,
    terrainSlope: 8,
    riverGaugeLevel: 782.85,
    gaugeDangerMark: 783.0,
    soilSaturation: 91,
    historicalIndex: 8.6,
    riskLevel: 'CRITICAL',
    hazardType: 'FLOOD',
    elevationMeters: 786
  },
  {
    id: 'STN-AIZ-06',
    name: 'Aizawl Crest Observatory',
    state: 'Mizoram',
    district: 'Aizawl',
    basin: 'Tlawng River Basin',
    lat: 23.731,
    lng: 92.718,
    rainfall: 32,
    terrainSlope: 34,
    riverGaugeLevel: 18.2,
    gaugeDangerMark: 21.0,
    soilSaturation: 78,
    historicalIndex: 7.1,
    riskLevel: 'HIGH',
    hazardType: 'LANDSLIDE',
    elevationMeters: 1130
  },
  {
    id: 'STN-GAN-07',
    name: 'Singtam - Mangan Axis Sensor',
    state: 'Sikkim',
    district: 'Mangan',
    basin: 'Teesta Upper Valley',
    lat: 27.42,
    lng: 88.52,
    rainfall: 48,
    terrainSlope: 45,
    riverGaugeLevel: 85.45,
    gaugeDangerMark: 85.95,
    soilSaturation: 89,
    historicalIndex: 9.1,
    riskLevel: 'CRITICAL',
    hazardType: 'COMBINED',
    elevationMeters: 1650
  },
  {
    id: 'STN-AGA-08',
    name: 'Agartala Plains Telemetry',
    state: 'Tripura',
    district: 'West Tripura',
    basin: 'Howrah River Basin',
    lat: 23.831,
    lng: 91.286,
    rainfall: 18,
    terrainSlope: 6,
    riverGaugeLevel: 10.35,
    gaugeDangerMark: 10.8,
    soilSaturation: 64,
    historicalIndex: 5.9,
    riskLevel: 'MODERATE',
    hazardType: 'FLOOD',
    elevationMeters: 18
  }
];

export const INITIAL_INCIDENT_REPORTS: IncidentReport[] = [
  {
    id: 'REP-AS-101',
    hazardType: 'LANDSLIDE',
    title: 'Slope slip blocking NH-27 near Haflong',
    description: 'Continuous heavy rainfall has caused boulders and earth to slide onto both lanes of NH-27. Traffic stranded.',
    state: 'Assam',
    district: 'Dima Hasao',
    locationName: 'Haflong Hill Cut, NH-27',
    lat: 25.178,
    lng: 93.023,
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    severity: 'CRITICAL',
    status: 'DISPATCHED',
    reporterType: 'CITIZEN',
    synced: true,
    verificationScore: 0.94,
    clusterId: 'CLUSTER-HAFLONG-01'
  },
  {
    id: 'REP-AS-102',
    hazardType: 'LANDSLIDE',
    title: 'Mudslide near Jatinga bypass',
    description: 'Mud sliding down hillside onto road, 2 km from Haflong toward Jatinga.',
    state: 'Assam',
    district: 'Dima Hasao',
    locationName: 'Jatinga Bypass Sector',
    lat: 25.185,
    lng: 93.031,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    severity: 'HIGH',
    status: 'VERIFIED',
    reporterType: 'CITIZEN',
    synced: true,
    verificationScore: 0.89,
    clusterId: 'CLUSTER-HAFLONG-01' // Spatial duplicate candidate
  },
  {
    id: 'REP-ML-201',
    hazardType: 'FLASH_FLOOD',
    title: 'Wah Umkhrah river overflowing banks near Polo',
    description: 'Flash flooding inundating low-lying commercial shops and settlements around Polo Grounds.',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    locationName: 'Polo Grounds, Shillong',
    lat: 25.589,
    lng: 91.892,
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    severity: 'HIGH',
    status: 'INVESTIGATING',
    reporterType: 'CITIZEN',
    synced: true,
    verificationScore: 0.91,
    clusterId: 'CLUSTER-SHILLONG-01'
  },
  {
    id: 'REP-AR-301',
    hazardType: 'ROAD_BLOCKAGE',
    title: 'Culvert breached on Banderdewa - Itanagar route',
    description: 'High runoff washed away road shoulder; only two-wheelers can pass cautiously.',
    state: 'Arunachal Pradesh',
    district: 'Papum Pare',
    locationName: 'Karsingsa, NH-415',
    lat: 27.135,
    lng: 93.722,
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    severity: 'MODERATE',
    status: 'REPORTED',
    reporterType: 'CITIZEN',
    synced: true,
    verificationScore: 0.78,
    clusterId: 'CLUSTER-ITANAGAR-01'
  },
  {
    id: 'REP-MN-401',
    hazardType: 'FLASH_FLOOD',
    title: 'Nambul River breach in Keishamthong',
    description: 'Water has begun spilling over embankment onto Keishamthong bazaar area.',
    state: 'Manipur',
    district: 'Imphal West',
    locationName: 'Keishamthong, Imphal',
    lat: 24.796,
    lng: 93.931,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    severity: 'CRITICAL',
    status: 'DISPATCHED',
    reporterType: 'CITIZEN',
    synced: true,
    verificationScore: 0.96,
    clusterId: 'CLUSTER-IMPHAL-01'
  }
];
