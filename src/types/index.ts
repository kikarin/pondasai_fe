export type StepId =
  | 'CHOOSE_LOCATION'       
  | 'INPUT_LAND_DIMENSIONS'  
  | 'EDIT_POLYGON'          
  | 'INPUT_REQUIREMENTS'     
  | 'SITE_ANALYSIS'         
  | 'RECOMMENDATIONS'       
  | 'FLOOR_PLAN'            
  | 'PREVIEW_3D'            
  | 'MATERIAL_LIST'         
  | 'PDF_REPORT';           

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LandDimensions {
  width?: number; 
  length?: number; 
  area?: number; 
}

export interface HouseRequirements {
  residents: number;
  rooms: number;
  floors: number;
  budget?: number; 
}

export interface RiskFactor {
  level: 'Rendah' | 'Sedang' | 'Tinggi';
  description: string;
  score?: number;
}

export interface SiteMetrics {
  floodScore: number;
  earthquakeScore: number;
  slopeScore: number;
  elevationScore: number;
  riverScore: number;
  floodScoreBase?: number;
  earthquakeScoreBase?: number;
  floodHistoryBonus?: number;
  earthquakeHistoryBonus?: number;
  bmkgHistoryBonus?: number;
  earthquakeLocalBonus?: number;
  floodLocalHistoryBonus?: number;
  historyEvidenceScore?: number;
  historyEvidenceLevel?: string;
}

export interface BmkgEarthquakeEvent {
  date: string;
  magnitude: number;
  region: string;
  distanceKm: number;
  mmi?: string;
  source?: string;
}

export interface CityDisasterEvent {
  type: 'banjir' | 'gempa';
  date: string;
  description: string;
}

export interface DisasterHistory {
  city: string;
  localArea?: string;
  floodHistoryNote: string;
  floodHistoryNoteLocal?: string;
  floodHistoryNoteCity?: string;
  earthquakeHistoryNote: string;
  earthquakeHistoryNoteLocal?: string;
  earthquakeHistoryNoteCity?: string;
  bmkgEarthquakeNote: string;
  bmkgEarthquakes: BmkgEarthquakeEvent[];
  localEvents?: CityDisasterEvent[];
  cityContextEvents?: CityDisasterEvent[];
  localEventCount?: number;
  cityContextEventCount?: number;
  cityEvents: CityDisasterEvent[];
  historyStatus?: 'ok' | 'missing_api_key' | 'search_failed';
  hazardNarratives?: Record<string, HazardNarrative>;
}

export interface HazardNarrativeEvent {
  date: string;
  description: string;
}

export interface HazardNarrative {
  scope: string;
  note: string;
  events: HazardNarrativeEvent[];
  eventCount?: number;
  status: 'ok' | 'missing_api_key' | 'search_failed';
  volcano?: string;
}


export type HazardKey =
  | 'banjir'
  | 'gempa'
  | 'longsor'
  | 'gunung_api'
  | 'tsunami'
  | 'cuaca_ekstrem';

export type FetchStatus = 'SUCCESS' | 'TIMEOUT' | 'ERROR';
export type SiteClass = 'daratan_layak' | 'laut' | 'inland_water' | 'hutan' | 'lereng_curam';
export type GateStatus = 'valid' | 'blocked' | 'advisory';

export interface HazardDataQuality {
  bnpb: boolean;
  bmkgCapable: boolean; 
  spatial: boolean;
}

export interface HazardConfidence {
  key: string;
  score: number;
  level: string;
  basis: string;
  technicalOk: boolean;
  analyticalOk: boolean;
  reason: string;
  dataQuality: HazardDataQuality;
}

export interface ConfidenceResult {
  overall: number;
  overallLevel: string;
  perHazard: Record<string, HazardConfidence>;
  breakdown: {
    technical: { key: string; reason: string }[];
    analytical: { key: string; reason: string }[];
  };
  confidenceReason: string;
}

export interface HazardEntry {
  key: string;
  domain: string;
  fetchStatus: FetchStatus;
  score: number | null;
  category: 'Rendah' | 'Sedang' | 'Tinggi' | null;
  rawIndex: number | null;
  source: string;
  endpoint: string;
}

export interface DomainContributor {
  key: string;
  score: number;
  sub_weight?: number;
}

export interface DomainResult {
  score: number;
  weight: number;
  strategy: 'max' | 'peak_weighted' | 'weighted_average' | string;
  present: boolean;
  contributors: DomainContributor[];
}

export interface OverallResult {
  score: number;
  category: string;
  compositeBaseScore: number;
  peakFloor: number;
  blocked: boolean;
  retryRequired: boolean;
}

export interface SeverityItem {
  rank: number;
  key: string;
  label: string;
  score: number;
  category: 'Rendah' | 'Sedang' | 'Tinggi' | null;
}

export interface EngineVersion {
  riskEngine: string;
  ruleEngine: string;
  analysisPipeline: string;
}

export interface SiteProfile {
  class: SiteClass;
  gateStatus: GateStatus;
  fullAddress: string;
  coordinates: Coordinates;
  riverDistanceM: number | null;
  elevationM: number | null;
  coastal: boolean;
  legalContext: string | null;
}

export interface RiskEngineResult {
  version: EngineVersion;
  siteProfile: SiteProfile;
  overall: OverallResult;
  domains: Record<string, DomainResult>;
  hazards: Record<string, HazardEntry>;
  historyEvidence: { score: number };
  confidence: ConfidenceResult;
  severity: SeverityItem[];
}


export interface HazardRisikoEntry {
  key: string;
  label: string;
  fetchStatus: FetchStatus;
  score: number | null;
  category: 'Rendah' | 'Sedang' | 'Tinggi' | null;
  rawIndex: number | null;
  endpoint: string;
  state?: 'fetched' | 'green';
  confidence: HazardConfidence;
}

export interface RisikoResponse {
  coordinates: Coordinates;
  risiko: Record<string, HazardRisikoEntry>;
  cached: boolean;
  confidenceReason: string;
  unavailableCount: number;
  greenHazards?: string[];
  bahayaUnavailable?: string[];
  note: string;
}

export interface SiteAnalysisData {
  locationName: string;
  coordinates: Coordinates;
  floodRisk: RiskFactor;
  earthquakeRisk: RiskFactor;
  slope: {
    degrees: number;
    level: 'Datar' | 'Landai' | 'Curam' | 'Sangat Curam';
    description: string;
  };
  elevation: {
    value: number;
    description: string;
  };
  riverDistance: {
    value: number | null;
    available?: boolean;
    description: string;
  };
  overallRiskScore: number;
  metrics?: SiteMetrics;
  disasterHistory?: DisasterHistory;
  buildSuitability?: {
    level: 'layak_mitigasi' | 'hati_hati' | 'sangat_hati_hati' | 'tidak_disarankan';
    label: string;
    advisory: string;
    reasons?: string[];
  };
  riskEngine?: RiskEngineResult;
  siteProfile?: SiteProfile;
  engineVersion?: EngineVersion;
}

export interface StructuralRecommendation {
  structureType: string; 
  foundationType: string; 
  floorElevation: number; 
  description: string;
}

export interface RoomLayout {
  name: string;
  width: number;
  length: number;
  x: number; 
  y: number;
}

export interface HouseLayout {
  rooms: RoomLayout[];
  totalBuildingArea: number;
  buildingWidth?: number;
  buildingLength?: number;
  floors?: number;
  roofType?: 'limas' | 'datar' | string;
  landAreaM2?: number;
  buildableAreaM2?: number;
  coverageRatio?: number;
  budgetApplied?: boolean;
  maxFloorsAllowed?: number;
  landOutline?: [number, number][];
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface ReportResponse {
  reportId: string;
  reportType: string;
  metadata: {
    fileName: string;
    generatedAt: string;
    version: string;
    hasFloorPlan?: boolean;
    materialCount?: number;
  };
  payload: {
    locationName: string;
    siteAnalysis: SiteAnalysisData;
    recommendations: StructuralRecommendation;
    houseLayout: HouseLayout | null;
    materials: MaterialItem[];
    aiExplanation?: string | null;
    generatedAt: string;
    fileName: string;
  };
}

export interface ProjectState {
  coordinates: Coordinates;
  dimensions: LandDimensions;
  polygonGeoJson: any; 
  requirements: HouseRequirements;
  siteAnalysis: SiteAnalysisData | null;
  recommendations: StructuralRecommendation | null;
  houseLayout: HouseLayout | null;
  materials: MaterialItem[];
}
