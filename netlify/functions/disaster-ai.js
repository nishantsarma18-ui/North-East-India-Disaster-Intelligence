import { GoogleGenAI, Type } from '@google/genai';

/**
 * Netlify Serverless Function: disaster-ai
 * North-East India Disaster Intelligence Platform
 *
 * Evaluates rainfall intensity, terrain slope angle, river gauge levels,
 * soil moisture saturation, and historical disaster vulnerability indices.
 * Queries Gemini using @google/genai to produce an XAI-grounded hazard assessment
 * with multi-lingual alerts (Assamese, Manipuri, Khasi, Mizo, Bengali, English).
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Physics-based fallback engine for resilience when offline, missing key, or during network interruption
function computePhysicalBaseline(data) {
  const rainfall = Number(data.rainfall) || 0; // mm/hr
  const slope = Number(data.terrainSlope) || 0; // degrees
  const riverLevel = Number(data.riverGaugeLevel) || 0; // meters
  const soilSaturation = Number(data.soilSaturation) || 0; // 0 - 100 %
  const histIndex = Number(data.historicalDisasterIndices) || 5; // 1 - 10 scale
  const location = data.locationName || 'North-East India Region';
  const riverName = data.riverName || 'Regional Catchment';

  // Landslide index: steep slope (>25 deg) + high soil saturation (>75%) + intense rainfall (>30mm/hr)
  const slopeFactor = Math.min(10, (slope / 45) * 10);
  const saturationFactor = Math.min(10, (soilSaturation / 100) * 10);
  const rainfallFactor = Math.min(10, (rainfall / 50) * 10);
  const landslideScore = 0.4 * slopeFactor + 0.35 * saturationFactor + 0.25 * rainfallFactor;

  // Flood index: high river level (> warning mark approx 45m or delta) + rainfall + saturation
  const floodScore = (riverLevel > 48 ? 8 : riverLevel > 44 ? 5 : 2) * 0.4 + rainfallFactor * 0.35 + saturationFactor * 0.25;

  let overallRiskLevel = 'LOW';
  let hazardType = 'FLOOD';

  const maxScore = Math.max(landslideScore, floodScore);
  if (maxScore >= 7.5 || (landslideScore > 6 && floodScore > 6)) {
    overallRiskLevel = 'CRITICAL';
  } else if (maxScore >= 5.5) {
    overallRiskLevel = 'HIGH';
  } else if (maxScore >= 3.5) {
    overallRiskLevel = 'MODERATE';
  } else {
    overallRiskLevel = 'LOW';
  }

  if (landslideScore >= 5.0 && floodScore >= 5.0) {
    hazardType = 'COMBINED';
  } else if (landslideScore > floodScore) {
    hazardType = 'LANDSLIDE';
  } else {
    hazardType = 'FLOOD';
  }

  const driverDesc = [];
  if (slope >= 28) driverDesc.push(`steep hill slope (${slope}° inclination)`);
  if (soilSaturation >= 70) driverDesc.push(`critically saturated pore water pressure (${soilSaturation}%)`);
  if (rainfall >= 35) driverDesc.push(`torrential monsoonal downpour (${rainfall} mm/hr)`);
  if (riverLevel >= 45) driverDesc.push(`river gauge approaching danger mark (${riverLevel}m on ${riverName})`);

  const driverSummary = driverDesc.length > 0 
    ? driverDesc.join(', along with ') 
    : `monitored environmental parameters within baseline thresholds (rainfall: ${rainfall}mm/hr, slope: ${slope}°)`;

  const xaiExplanation = `Hydro-geological risk assessment for ${location}: Risk is designated as ${overallRiskLevel} primarily driven by ${driverSummary}. In North-Eastern Himalayan and Shillong Plateau geology, saturation above 75% dramatically lowers shear strength along regolith failure planes, while rapid surface runoff elevates tributary surge volumes.`;

  const citizenSafety = overallRiskLevel === 'CRITICAL' || overallRiskLevel === 'HIGH'
    ? [
        'Evacuate immediately from identified debris flow paths, riverbanks, and unstable cut slopes.',
        'Seek shelter in designated district multi-purpose cyclone/flood shelters on high ground.',
        'Keep battery-operated emergency radios tuned to SDRF/IMD emergency broadcasts.',
        'Do not attempt to drive or wade through waterlogged roads or swollen hill streams.'
      ]
    : [
        'Monitor local weather bulletins and CWC river stage advisories.',
        'Clear domestic drainage paths and inspect retaining walls for seepage cracks.',
        'Keep essential emergency kit (torch, potable water, medical supplies) accessible.'
      ];

  const responderOperations = overallRiskLevel === 'CRITICAL' || overallRiskLevel === 'HIGH'
    ? [
        'Mobilize NDRF and SDRF quick-response teams with inflatable motorized boats and de-watering pumps.',
        'Preposition heavy earth-moving equipment (JCBs) along strategic arterial highways (NH-27, NH-6).',
        'Issue cell-broadcast emergency alerts across vulnerable telecom towers in the sector.',
        'Open and staff round-the-clock district emergency operations centers (DEOC).'
      ]
    : [
        'Maintain level-1 standby across municipal disaster quick-reaction units.',
        'Verify automated rain gauge (ARG) telemetry and water level sensor calibrations.',
        'Stock emergency food rations and water purification sachets at sub-divisional godowns.'
      ];

  // Authentic regional language alert templates
  const multiLingualAlerts = {
    english: `[ALERT - ${overallRiskLevel}] ${hazardType} threat at ${location}. Rainfall: ${rainfall} mm/hr, River level: ${riverLevel}m. Follow district emergency directives immediately.`,
    assamese: `[সতৰ্কবাণী - ${overallRiskLevel}] ${location}ত ${hazardType === 'FLOOD' ? 'বানপানী' : hazardType === 'LANDSLIDE' ? 'ভূমিস্খলন' : 'বানপানী আৰু ভূমিস্খলন'}ৰ আশংকাজনক স্থিতি। বৰষুণ: ${rainfall} মিমি/ঘণ্টা। জিলা দুৰ্যোগ প্ৰশমন নিৰ্দেশনা অনুসৰণ কৰক।`,
    manipuri: `[চেকশিনৱা - ${overallRiskLevel}] ${location}দা ${hazardType === 'FLOOD' ? 'ইশিং তুম্বা/ঈচিং ইচাও' : hazardType === 'LANDSLIDE' ? 'চিংশিৎ তূম্বা' : 'ঈচাও অমসুং চিংশিৎ তূম্বা'}গী খুদোংথীবা লৈরে। অথুবা মতমদা কাঙলুপ শেম-শাবা তৌবীয়ু।`,
    khasi: `[KHLUB JINGMAHAM - ${overallRiskLevel}] Ka jingma na ka bynta ka ${hazardType === 'FLOOD' ? 'shlei um' : hazardType === 'LANDSLIDE' ? 'twah khyndew' : 'shlei um bad twah khyndew'} ha ${location}. Sngewbha bud ia ki hukum jong ka District Administration.`,
    mizo: `[VAUHNA - ${overallRiskLevel}] ${location}-ah ${hazardType === 'FLOOD' ? 'tui lian' : hazardType === 'LANDSLIDE' ? 'lei tawlh' : 'tui lian leh lei tawlh'} hlauhawm a awm. District thuneitute thupek zawm nghal rawh le.`,
    bengali: `[সতর্কবার্তা - ${overallRiskLevel}] ${location}-এ ${hazardType === 'FLOOD' ? 'বন্যা' : hazardType === 'LANDSLIDE' ? 'ভূমিধস' : 'বন্যা ও ভূমিধস'}-এর তীব্র আশঙ্কা। বৃষ্টিপাত: ${rainfall} মিমি/ঘণ্টা। জরুরি নির্দেশাবলি পালন করুন।`
  };

  return {
    overallRiskLevel,
    hazardType,
    xaiExplanation,
    recommendedActions: {
      citizenSafety,
      responderOperations,
    },
    multiLingualAlerts,
    telemetry: {
      slopeFactor: Number(slopeFactor.toFixed(2)),
      saturationIndex: Number(saturationFactor.toFixed(2)),
      dischargeEstimate: `${(rainfall * 1.8 + riverLevel * 14).toFixed(1)} m³/s`,
      alertUrgency: overallRiskLevel === 'CRITICAL' ? 'IMMEDIATE_ACTION' : overallRiskLevel === 'HIGH' ? 'WARNING' : 'MONITORING'
    },
    source: 'Deterministic Physical Heuristic Engine'
  };
}

export async function handler(event, context) {
  // Handle pre-flight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'ok' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  let bodyData;
  try {
    bodyData = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
  } catch (err) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON payload in request body' }),
    };
  }

  const rainfall = Number(bodyData.rainfall ?? 45); // mm/hr
  const terrainSlope = Number(bodyData.terrainSlope ?? 32); // degrees
  const riverGaugeLevel = Number(bodyData.riverGaugeLevel ?? 47.8); // meters
  const soilSaturation = Number(bodyData.soilSaturation ?? 84); // %
  const historicalDisasterIndices = Number(bodyData.historicalDisasterIndices ?? 7.5); // 1-10
  const locationName = bodyData.locationName || 'Guwahati / Dima Hasao Corridor, Assam';
  const riverName = bodyData.riverName || 'Brahmaputra / Kopili Basin';

  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key, immediately respond with the high-fidelity physical heuristic response
  if (!apiKey) {
    const fallbackResult = computePhysicalBaseline({
      rainfall,
      terrainSlope,
      riverGaugeLevel,
      soilSaturation,
      historicalDisasterIndices,
      locationName,
      riverName,
    });
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ...fallbackResult,
        notice: 'Generated via physical hydro-meteorological engine (GEMINI_API_KEY unconfigured).',
      }),
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `
You are the Lead Hydro-Geological Risk Architect for North-East India (covering Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, and Sikkim).

Analyze these real-time telemetric parameters:
- Location / Basin: ${locationName} (${riverName})
- Precipitation Rate: ${rainfall} mm/hr
- Terrain Slope Angle: ${terrainSlope} degrees
- River Gauge Level: ${riverGaugeLevel} meters
- Soil Moisture Saturation: ${soilSaturation}%
- Historical Hazard Vulnerability Index: ${historicalDisasterIndices}/10

Strict Requirements:
1. Determine overallRiskLevel ("LOW" | "MODERATE" | "HIGH" | "CRITICAL").
2. Determine hazardType ("FLOOD" | "LANDSLIDE" | "COMBINED").
3. Provide xaiExplanation: an explainable, plain-language breakdown explaining the exact physical interactions (e.g. how slope steepness and pore water pressure reduce soil shear strength triggering debris flow, or how runoff rate and river gauge elevation correlate with flash flood risk).
4. Provide recommendedActions with two specific lists:
   - citizenSafety: 3-4 actionable safety directives for local residents.
   - responderOperations: 3-4 actionable emergency directives for SDRF, NDRF, and District Disaster Management Authorities (DDMA).
5. Provide multiLingualAlerts containing translatedAlert in:
   - "assamese" (অসমীয়া)
   - "manipuri" (মৈতৈলোন্ / Meiteilon)
   - "khasi" (Ka Ktien Khasi)
   - "mizo" (Mizo ṭawng)
   - "bengali" (বাংলা)
   - "english" (English)
`.trim();

    // Use gemini-2.5-flash
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskLevel: {
              type: Type.STRING,
              enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
              description: 'Overall multi-hazard risk level.',
            },
            hazardType: {
              type: Type.STRING,
              enum: ['FLOOD', 'LANDSLIDE', 'COMBINED'],
              description: 'Primary disaster category.',
            },
            xaiExplanation: {
              type: Type.STRING,
              description: 'Explainable AI plain-language environmental rationale.',
            },
            recommendedActions: {
              type: Type.OBJECT,
              properties: {
                citizenSafety: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Safety instructions for citizens.',
                },
                responderOperations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Operational directives for SDRF/NDRF responders.',
                },
              },
              required: ['citizenSafety', 'responderOperations'],
            },
            multiLingualAlerts: {
              type: Type.OBJECT,
              properties: {
                assamese: { type: Type.STRING },
                manipuri: { type: Type.STRING },
                khasi: { type: Type.STRING },
                mizo: { type: Type.STRING },
                bengali: { type: Type.STRING },
                english: { type: Type.STRING },
              },
              required: ['assamese', 'manipuri', 'khasi', 'mizo', 'bengali', 'english'],
            },
            telemetry: {
              type: Type.OBJECT,
              properties: {
                slopeFactor: { type: Type.NUMBER },
                saturationIndex: { type: Type.NUMBER },
                dischargeEstimate: { type: Type.STRING },
                alertUrgency: { type: Type.STRING },
              },
            },
          },
          required: [
            'overallRiskLevel',
            'hazardType',
            'xaiExplanation',
            'recommendedActions',
            'multiLingualAlerts',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text.trim());

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ...parsed,
        source: `Gemini AI Engine (${modelName})`,
        evaluatedAt: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Gemini API query failed, invoking physical heuristic engine:', error);

    const fallbackResult = computePhysicalBaseline({
      rainfall,
      terrainSlope,
      riverGaugeLevel,
      soilSaturation,
      historicalDisasterIndices,
      locationName,
      riverName,
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ...fallbackResult,
        warning: 'Gemini inference failed or rate limited; served via physical heuristic engine.',
        errorDetails: error?.message,
      }),
    };
  }
}
