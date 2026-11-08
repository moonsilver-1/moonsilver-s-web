export type MetricLevel = 1 | 2 | 3 | 4 | 5;

export interface MetricAssessment {
  level: MetricLevel;
  evidence: string;
  reason: string;
  confidence: number;
  paragraph_id?: string;
}

export interface CandidateMetrics {
  m1: MetricAssessment;
  m2: MetricAssessment;
  m3: MetricAssessment;
  m4: MetricAssessment;
  m5: MetricAssessment;
}

export interface Candidate {
  id: string;
  student_id?: string;
  name: string;
  gender: string;
  major: string;
  position_id: string;
  position_name: string;
  qualified: boolean;
  qualification_issue: string | null;
  status: 'completed' | 'pending_review' | 'parsing' | 'evaluating' | 'failed';
  review_reason: string | null;
  interview_score: number;
  interview_notes: string;
  original_text: Record<string, string>;
  metrics: CandidateMetrics;
  material_score: number;
  composite_score: number;
  rank?: number | string;
}

export interface PositionWeights {
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m5: number;
}

export interface Position {
  id: string;
  name: string;
  category: string;
  department: string;
  alpha: number;
  description: string;
  weights: PositionWeights;
  target_quota: number;
  applicant_count: number;
}

export interface MetricRubricItem {
  level: MetricLevel;
  point: string;
  example: string;
}

export interface MetricConfig {
  id: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  name: string;
  scope: string;
  rubric: MetricRubricItem[];
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  provider: string;
  timeframe: string;
  targetMetric: 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
  action: string;
  benefit: string;
}

export interface TestCase {
  id: string;
  name: string;
  desc: string;
  expected: string;
  status: 'pass' | 'fail' | 'pending';
  category: string;
  metric?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  targetStudentId: string;
  targetStudentName: string;
  metricId: string;
  oldLevel: number;
  newLevel: number;
  reason: string;
  verified: boolean;
}

export type SubAgentRole = 
  | 'parser' 
  | 'civic_ethics' 
  | 'academic' 
  | 'leadership' 
  | 'competency' 
  | 'integrity' 
  | 'arbitrator' 
  | 'growth_planner';

export interface SubAgentStatus {
  id: SubAgentRole;
  name: string;
  avatar: string;
  specialty: string;
  status: 'idle' | 'running' | 'completed' | 'alert';
  currentTask?: string;
  progress: number;
  log: string[];
}

export interface TaskItem {
  id: string;
  studentId: string;
  name: string;
  fileHash: string;
  fileName: string;
  fileSize: string;
  positionId: string;
  status: 'queued' | 'parsing' | 'evaluating' | 'completed' | 'pending_review' | 'failed';
  durationSeconds: number;
  submittedAt: string;
  reviewReason?: string;
}
