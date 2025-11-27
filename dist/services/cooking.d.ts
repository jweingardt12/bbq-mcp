/**
 * Cooking Service
 * Core BBQ cooking logic and calculations
 */
import type { ProteinType, CookMethod, DonenessLevel, ProteinProfile, CookTimeEstimate, TemperatureAnalysis } from "../types.js";
/**
 * Get the protein profile for a given protein type
 */
export declare function getProteinProfile(proteinType: ProteinType): ProteinProfile;
/**
 * Get the target temperature for a protein at a specific doneness
 */
export declare function getTargetTemperature(proteinType: ProteinType, doneness?: DonenessLevel): {
    targetTemp: number;
    pullTemp: number;
    doneness: DonenessLevel;
};
/**
 * Estimate total cook time
 */
export declare function estimateCookTime(proteinType: ProteinType, weightPounds: number, cookMethod: CookMethod, smokerTemp?: number): CookTimeEstimate;
/**
 * Calculate when to start cooking to be ready by a target time
 */
export declare function calculateStartTime(proteinType: ProteinType, weightPounds: number, cookMethod: CookMethod, targetServingTime: Date, smokerTemp?: number): {
    startTime: Date;
    cookTime: CookTimeEstimate;
    restTime: number;
    bufferMinutes: number;
};
/**
 * Analyze current temperature progress and provide recommendations
 */
export declare function analyzeTemperature(currentTemp: number, targetTemp: number, proteinType: ProteinType, cookMethod?: CookMethod, cookStartTime?: Date, previousReadings?: Array<{
    temp: number;
    timestamp: Date;
}>): TemperatureAnalysis;
/**
 * Detect if a cook is in a stall
 */
export declare function detectStall(proteinType: ProteinType, currentTemp: number, readings: Array<{
    temp: number;
    timestamp: Date;
}>): {
    isStalled: boolean;
    stallDurationMinutes: number;
    inStallZone: boolean;
    recommendation: string;
};
/**
 * Calculate recommended rest time and expected carryover
 */
export declare function calculateRestTime(proteinType: ProteinType, currentTemp: number, targetFinalTemp?: number): {
    recommendedRestMinutes: number;
    expectedCarryover: number;
    expectedFinalTemp: number;
    instructions: string[];
};
/**
 * Get cooking tips for a protein type and optional context
 */
export declare function getCookingTips(proteinType: ProteinType, cookMethod?: CookMethod, currentPhase?: string): string[];
/**
 * Convert temperature between units
 */
export declare function convertTemperature(temp: number, fromUnit: "fahrenheit" | "celsius", toUnit: "fahrenheit" | "celsius"): number;
/**
 * Format a time estimate for display
 */
export declare function formatTimeEstimate(minutes: number): string;
/**
 * Get the recommended cook method for a protein type
 */
export declare function getRecommendedCookMethod(proteinType: ProteinType): CookMethod;
//# sourceMappingURL=cooking.d.ts.map