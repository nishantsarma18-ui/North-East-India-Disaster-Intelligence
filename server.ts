import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handler as disasterAiHandler } from './netlify/functions/disaster-ai.js';
import { handler as ingestDataHandler } from './netlify/functions/ingest-data.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory mock store for reports synchronized from citizens to command authority
let synchronizedReports = [
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
    clusterId: 'CLUSTER-HAFLONG-01' // Duplicate/Cluster candidate
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

// Active broadcasts dispatched by authority
let activeBroadcasts = [
  {
    id: 'BCAST-001',
    title: 'IMMEDIATE RED ALERT: Severe Flash Flood & Landslide Threat',
    regions: ['Dima Hasao (Assam)', 'East Khasi Hills (Meghalaya)', 'Imphal West (Manipur)'],
    hazardType: 'COMBINED',
    severity: 'CRITICAL',
    sentAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    channels: ['Cell Broadcast', 'PWA Offline Push', 'SDRF Radio Relay', 'SMS Gateways'],
    recipientCount: 148200
  }
];

// Bridge to Netlify function disaster-ai handler
app.post('/api/disaster-ai', async (req, res) => {
  try {
    const netlifyEvent = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers,
    };
    const response = await disasterAiHandler(netlifyEvent, {});
    const parsedBody = JSON.parse(response.body);
    res.status(response.statusCode).json(parsedBody);
  } catch (error) {
    console.error('Error in /api/disaster-ai:', error);
    res.status(500).json({ error: 'Internal server error in disaster intelligence calculation' });
  }
});

// Bridge to Netlify function ingest-data handler (Hydro-Met & Satellite Ingestion Pipeline)
app.all('/api/ingest-data', async (req, res) => {
  try {
    const netlifyEvent = {
      httpMethod: req.method,
      queryStringParameters: req.query,
      body: req.body ? JSON.stringify(req.body) : null,
      headers: req.headers,
    };
    const response = await ingestDataHandler(netlifyEvent, {});
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, val]) => {
        if (typeof val === 'string') res.setHeader(key, val);
      });
    }
    const parsedBody = response.body ? JSON.parse(response.body) : {};
    res.status(response.statusCode).json(parsedBody);
  } catch (error) {
    console.error('Error in /api/ingest-data:', error);
    res.status(500).json({ error: 'Internal server error in data ingestion pipeline' });
  }
});

// Citizen incident submission & sync endpoint
app.get('/api/reports', (req, res) => {
  res.json({ reports: synchronizedReports });
});

app.post('/api/reports', (req, res) => {
  const newReport = {
    id: `REP-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    status: 'REPORTED',
    synced: true,
    verificationScore: 0.85,
    clusterId: null,
    ...req.body
  };
  synchronizedReports.unshift(newReport);
  res.status(201).json({ success: true, report: newReport });
});

// Batch sync endpoint for offline PWA queues
app.post('/api/reports/batch-sync', (req, res) => {
  const { reports } = req.body || {};
  if (!Array.isArray(reports)) {
    return res.status(400).json({ error: 'reports must be an array' });
  }

  const added = [];
  for (const r of reports) {
    const existingIndex = synchronizedReports.findIndex(item => item.id === r.id);
    if (existingIndex >= 0) {
      synchronizedReports[existingIndex] = { ...synchronizedReports[existingIndex], ...r, synced: true };
      added.push(synchronizedReports[existingIndex]);
    } else {
      const item = {
        ...r,
        id: r.id || `REP-${Date.now().toString().slice(-6)}`,
        synced: true,
        status: r.status || 'REPORTED',
        verificationScore: 0.88
      };
      synchronizedReports.unshift(item);
      added.push(item);
    }
  }

  res.json({ success: true, count: added.length, reports: added });
});

// Report status update (triage / dispatch)
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status, severity, notes } = req.body;
  const report = synchronizedReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  if (status) report.status = status;
  if (severity) report.severity = severity;
  if (notes) (report as Record<string, unknown>).notes = notes;
  res.json({ success: true, report });
});

// Broadcast alerts dispatch
app.get('/api/broadcasts', (req, res) => {
  res.json({ broadcasts: activeBroadcasts });
});

app.post('/api/broadcasts', (req, res) => {
  const { title, regions, hazardType, severity, message, channels } = req.body;
  const newBroadcast = {
    id: `BCAST-${Date.now().toString().slice(-4)}`,
    title: title || 'Emergency Public Alert',
    regions: regions || ['All High-Risk Sectors'],
    hazardType: hazardType || 'COMBINED',
    severity: severity || 'HIGH',
    message: message || '',
    sentAt: new Date().toISOString(),
    channels: channels || ['Cell Broadcast', 'PWA Push', 'SDRF VHF'],
    recipientCount: Math.floor(Math.random() * 80000 + 40000)
  };
  activeBroadcasts.unshift(newBroadcast);
  res.status(201).json({ success: true, broadcast: newBroadcast });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NE India Disaster Intelligence Platform',
    timestamp: new Date().toISOString(),
    region: 'North-East India'
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disaster Intelligence Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
