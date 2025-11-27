/**
 * Formatting Service
 * Handles response formatting for both Markdown and JSON outputs
 */
import type { ProteinType, CookMethod, DonenessLevel, ProteinProfile, CookTimeEstimate, TemperatureAnalysis } from "../types.js";
/**
 * Format cooking guidance as Markdown
 */
export declare function formatCookingGuidanceMarkdown(profile: ProteinProfile, weightPounds: number, targetTemp: number, pullTemp: number, doneness: DonenessLevel, cookMethod: CookMethod, estimate: CookTimeEstimate, startTime?: {
    startTime: Date;
    restTime: number;
    bufferMinutes: number;
}): string;
/**
 * Format temperature analysis as Markdown
 */
export declare function formatTemperatureAnalysisMarkdown(analysis: TemperatureAnalysis): string;
/**
 * Format protein list as Markdown
 */
export declare function formatProteinListMarkdown(proteins: ProteinProfile[], category?: string): string;
/**
 * Format stall detection result as Markdown
 */
export declare function formatStallDetectionMarkdown(result: {
    isStalled: boolean;
    stallDurationMinutes: number;
    inStallZone: boolean;
    recommendation: string;
}, currentTemp: number): string;
/**
 * Format rest time calculation as Markdown
 */
export declare function formatRestTimeMarkdown(result: {
    recommendedRestMinutes: number;
    expectedCarryover: number;
    expectedFinalTemp: number;
    instructions: string[];
}): string;
/**
 * Format device reading simulation as Markdown
 */
export declare function formatDeviceReadingMarkdown(deviceType: string, probeReadings: Array<{
    probe_id: string;
    name?: string;
    temperature: number;
}>, analysis?: TemperatureAnalysis): string;
/**
 * Format cooking tips as Markdown
 */
export declare function formatTipsMarkdown(tips: string[], proteinType: ProteinType): string;
/**
 * Format target temperature info as Markdown
 */
export declare function formatTargetTempMarkdown(profile: ProteinProfile, targetTemp: number, pullTemp: number, doneness: DonenessLevel): string;
//# sourceMappingURL=formatting.d.ts.map