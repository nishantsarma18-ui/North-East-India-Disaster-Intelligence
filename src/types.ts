/**
 * North-East India Disaster Intelligence Platform
 * TypeScript Type Definitions
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type HazardType = 'FLOOD' | 'FLASH_FLOOD' | 'LANDSLIDE' | 'ROAD_BLOCKAGE' | 'COMBINED';
export type AppViewMode = 'citizen' | 'command';
export type SupportedLanguage = 'english' | 'assamese' | 'manipuri' | 'khasi' | 'mizo' | 'bengali';

export interface MultiLingualAlerts {
  assamese: string;
  manipuri: string;
  khasi: string;
  mizo: string;
  bengali: string;
  english: string;
}

export interface RecommendedActions {
  citizenSafety: string[];
  responderOperations: string[];
}

export interface DisasterAITelemetry {
  slopeFactor: number;
  saturationIndex: number;
  dischargeEstimate: string;
  alertUrgency: string;
}

export interface DisasterAIResponse {
  overallRiskLevel: RiskLevel;
  hazardType: HazardType;
  xaiExplanation: string;
  recommendedActions: RecommendedActions;
  multiLingualAlerts: MultiLingualAlerts;
  telemetry?: DisasterAITelemetry;
  source?: string;
  evaluatedAt?: string;
  warning?: string;
  notice?: string;
}

export interface DisasterAIRequest {
  rainfall: number; // mm/hr
  terrainSlope: number; // degrees
  riverGaugeLevel: number; // meters
  soilSaturation: number; // %
  historicalDisasterIndices: number; // 1-10 scale
  locationName?: string;
  riverName?: string;
}

export interface TelemetricStation {
  id: string;
  name: string;
  state: string;
  district: string;
  basin: string;
  lat: number;
  lng: number;
  rainfall: number; // mm/hr
  terrainSlope: number; // degrees
  riverGaugeLevel: number; // meters
  gaugeDangerMark: number; // meters
  soilSaturation: number; // %
  historicalIndex: number; // 1-10
  riskLevel: RiskLevel;
  hazardType: HazardType;
  elevationMeters: number;
}

export interface RiverGauge {
  id: string;
  name: string;
  river: string;
  state: string;
  currentLevel: number; // meters
  warningLevel: number; // meters
  dangerLevel: number; // meters
  highestFloodLevel: number; // meters
  trend: 'RISING' | 'STEADY' | 'FALLING';
  lat: number;
  lng: number;
}

export interface SlopeZone {
  id: string;
  name: string;
  state: string;
  slopeDegrees: number;
  geology: string;
  soilType: string;
  saturation: number;
  landslideRisk: RiskLevel;
  lat: number;
  lng: number;
  radiusKm: number;
}

export type ReportStatus = 'REPORTED' | 'VERIFIED' | 'INVESTIGATING' | 'DISPATCHED' | 'RESOLVED';

export interface IncidentReport {
  id: string;
  hazardType: HazardType;
  title: string;
  description: string;
  state: string;
  district: string;
  locationName: string;
  lat: number;
  lng: number;
  timestamp: string;
  severity: RiskLevel;
  status: ReportStatus;
  reporterType: 'CITIZEN' | 'FIRST_RESPONDER' | 'AUTOMATED_SENSOR';
  synced: boolean;
  verificationScore?: number;
  clusterId?: string | null;
  photoUrl?: string;
  responderNotes?: string;
}

export interface BroadcastAlert {
  id: string;
  title: string;
  regions: string[];
  hazardType: HazardType;
  severity: RiskLevel;
  sentAt: string;
  channels: string[];
  recipientCount: number;
  message?: string;
}
