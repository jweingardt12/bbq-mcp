/**
 * BBQ MCP Server Type Definitions
 */

// Temperature units
export type TemperatureUnit = "fahrenheit" | "celsius";

// Probe/channel data from ThermoWorks devices
export interface ProbeReading {
  probeId: string;
  name: string;
  currentTemp: number;
  targetTemp: number | null;
  minAlarm: number | null;
  maxAlarm: number | null;
  unit: TemperatureUnit;
  timestamp: Date;
}

// Device information
export interface ThermoWorksDevice {
  serialNumber: string;
  deviceName: string;
  deviceType: "Signals" | "Smoke" | "BlueDOT" | "Node" | "RFX";
  probes: ProbeReading[];
  lastUpdated: Date;
  batteryLevel?: number;
  signalStrength?: number;
}

// Cook session tracking
export interface CookSession {
  id: string;
  startTime: Date;
  proteinType: ProteinType;
  proteinWeight: number; // in pounds
  cookMethod: CookMethod;
  targetDoneness: DonenessLevel;
  targetTemp: number;
  probeAssignments: Map<string, string>; // probeId -> description
  temperatureLog: TemperatureLogEntry[];
  events: CookEvent[];
  status: "active" | "resting" | "completed" | "aborted";
  estimatedCompletionTime?: Date;
}

export interface TemperatureLogEntry {
  timestamp: Date;
  readings: Map<string, number>; // probeId -> temperature
}

export interface CookEvent {
  timestamp: Date;
  type: "wrap" | "spritz" | "flip" | "rest_start" | "temp_milestone" | "stall_detected" | "stall_cleared" | "custom";
  description: string;
  temperature?: number;
}

// Protein types supported
export type ProteinType =
  | "beef_brisket"
  | "beef_ribeye"
  | "beef_tri_tip"
  | "beef_prime_rib"
  | "beef_short_ribs"
  | "pork_shoulder"
  | "pork_butt"
  | "pork_ribs_spare"
  | "pork_ribs_baby_back"
  | "pork_loin"
  | "pork_tenderloin"
  | "pork_belly"
  | "chicken_whole"
  | "chicken_breast"
  | "chicken_thighs"
  | "chicken_wings"
  | "turkey_whole"
  | "turkey_breast"
  | "lamb_shoulder"
  | "lamb_leg"
  | "lamb_rack"
  | "salmon"
  | "other";

// Cooking methods
export type CookMethod =
  | "smoke_low_slow" // 225-250°F
  | "smoke_hot_fast" // 275-325°F
  | "grill_direct"
  | "grill_indirect"
  | "reverse_sear"
  | "spatchcock"
  | "rotisserie";

// Doneness levels
export type DonenessLevel =
  | "rare"
  | "medium_rare"
  | "medium"
  | "medium_well"
  | "well_done"
  | "pullable" // For pulled pork/brisket
  | "usda_safe"; // Minimum safe temperature

// Cooking knowledge database entry
export interface ProteinProfile {
  type: ProteinType;
  displayName: string;
  category: "beef" | "pork" | "poultry" | "lamb" | "seafood";
  usdaSafeTemp: number;
  requiresRest: boolean;
  restTimeMinutes: number;
  carryoverDegrees: number; // Expected temp rise during rest
  donenessTemps: Partial<Record<DonenessLevel, number>>;
  recommendedMethods: CookMethod[];
  stallRange?: { start: number; end: number }; // Temperature range where stall occurs
  estimatedTimePerPound: Record<CookMethod, number>; // minutes per pound
  tips: string[];
}

// Timing estimation
export interface CookTimeEstimate {
  totalMinutes: number;
  hoursAndMinutes: string;
  estimatedDoneTime: Date;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
  warnings: string[];
}

// Temperature analysis result
export interface TemperatureAnalysis {
  [key: string]: unknown;
  currentTemp: number;
  targetTemp: number;
  tempDelta: number;
  percentComplete: number;
  trend: "rising" | "falling" | "stable" | "stalled";
  trendRatePerHour: number; // degrees per hour
  estimatedMinutesRemaining: number | null;
  inStallZone: boolean;
  recommendations: string[];
}

// Response format enum
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}
