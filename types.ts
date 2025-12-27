
export enum ThreatLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AnalysisResult {
  query: string;
  status: 'Safe' | 'Malicious';
  threatLevel: ThreatLevel;
  riskScore: number; // 0 to 100
  analysis: string;
  secureVersion: string;
  attackType?: string;
  timestamp: number;
}

export interface HistoryItem extends AnalysisResult {
  id: string;
}
