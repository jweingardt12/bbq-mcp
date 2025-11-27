/**
 * BBQ MCP Server Constants
 * Comprehensive cooking knowledge database based on USDA guidelines and BBQ best practices
 */
import type { ProteinProfile, ProteinType, CookMethod, DonenessLevel } from "./types.js";
export declare const CHARACTER_LIMIT = 50000;
export declare const THERMOWORKS_CLOUD_URL = "https://cloud.thermoworks.com";
export declare const DEFAULT_SMOKER_TEMP = 225;
export declare const HOT_FAST_TEMP = 300;
/**
 * Comprehensive protein cooking profiles
 * Temperatures are in Fahrenheit
 * Time estimates are minutes per pound at the recommended cook method
 */
export declare const PROTEIN_PROFILES: Record<ProteinType, ProteinProfile>;
/**
 * Cook method descriptions and temperature ranges
 */
export declare const COOK_METHOD_INFO: Record<CookMethod, {
    displayName: string;
    tempRange: string;
    description: string;
}>;
/**
 * Doneness level display names and descriptions
 */
export declare const DONENESS_INFO: Record<DonenessLevel, {
    displayName: string;
    description: string;
}>;
//# sourceMappingURL=constants.d.ts.map