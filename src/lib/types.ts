// Mirrors app/schemas/admin.py, app/schemas/safety.py and app/schemas/hotspot.py in the backend.

export type ReportStatus = "submitted" | "under_review" | "resolved" | "rejected";
// AccidentReportCreate.severity in the backend
export type ReportSeverity = "minor" | "serious" | "critical" | "unknown";

export interface AccidentReport {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  report_type: string; // road_accident | hazard | hit_and_run | vehicle_breakdown | other
  description: string | null;
  severity: string | null;
  injuries_reported: boolean;
  emergency_required: boolean;
  latitude: number;
  longitude: number;
  gps_accuracy_m: number | null;
  road_name: string | null;
  address: string | null;
  occurred_at: string;
  created_at: string;
  status: ReportStatus;
  evidence_urls: string[];
  is_demo?: boolean; // fictional sample row, not from a real citizen
}

export interface AdminStats {
  total_reports: number;
  submitted: number;
  under_review: number;
  resolved: number;
  rejected: number;
  emergency_reports: number;
  open_emergencies: number;
  injury_reports: number;
}

export interface AdminMe {
  is_admin: boolean;
  email: string;
  full_name: string;
}

// Historical risk profile from the RTA dataset. `area` is a land-use category
// (Office areas, Church areas, ...) crossed with a junction type. It has no
// coordinates, so it is shown as a ranking, not as pins on the map.
export interface Hotspot {
  id: number;
  area: string;
  junction_type: string;
  accidents: number;
  fatalities: number;
  injuries: number;
  risk_score: number;
  peak_hour: number;
  severity: string; // medium | high | critical
}

export interface Authority {
  id: number;
  name: string;
  authority_type: string; // police | fire_emergency | medical_support | ...
  phone: string | null;
  email: string | null;
  latitude: number;
  longitude: number;
  coverage_area: string | null;
  distance_km?: number | null;
}

export interface SafetyEvent {
  id: number;
  user_id: number;
  user_name: string;
  event_type: string; // speed_limit_warning | unsafe_speed | phone_use_near_traffic | safe_trip_check
  activity: string; // driving | walking | cycling | ...
  phone_use: boolean;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  road_name: string | null;
  speed_limit_kmh: number | null;
  created_at: string;
  is_demo?: boolean;
}

export interface DemoData {
  present: boolean;
  reports: number;
  events: number;
}

export type NotificationCategory = "announcement" | "safety_tip" | "road_alert" | "warning";

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  category: NotificationCategory | string;
  created_at: string;
  sent_by: string | null;
  recipients: number; // people who could see it
  read_count: number; // people who opened it
}
