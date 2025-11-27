/**
 * Zod validation schemas for BBQ MCP Server tools
 */
import { z } from "zod";
export declare const ResponseFormatSchema: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
export declare const TemperatureUnitSchema: z.ZodDefault<z.ZodEnum<["fahrenheit", "celsius"]>>;
export declare const ProteinTypeSchema: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
export declare const CookMethodSchema: z.ZodEnum<["smoke_low_slow", "smoke_hot_fast", "grill_direct", "grill_indirect", "reverse_sear", "spatchcock", "rotisserie"]>;
export declare const DonenessLevelSchema: z.ZodEnum<["rare", "medium_rare", "medium", "medium_well", "well_done", "pullable", "usda_safe"]>;
/**
 * Schema for getting cooking guidance
 */
export declare const GetCookingGuidanceSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    weight_pounds: z.ZodNumber;
    target_doneness: z.ZodOptional<z.ZodEnum<["rare", "medium_rare", "medium", "medium_well", "well_done", "pullable", "usda_safe"]>>;
    cook_method: z.ZodOptional<z.ZodEnum<["smoke_low_slow", "smoke_hot_fast", "grill_direct", "grill_indirect", "reverse_sear", "spatchcock", "rotisserie"]>>;
    serving_time: z.ZodOptional<z.ZodString>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    weight_pounds: number;
    response_format: "markdown" | "json";
    target_doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    serving_time?: string | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    weight_pounds: number;
    target_doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    serving_time?: string | undefined;
    response_format?: "markdown" | "json" | undefined;
}>;
export type GetCookingGuidanceInput = z.infer<typeof GetCookingGuidanceSchema>;
/**
 * Schema for analyzing current temperature
 */
export declare const AnalyzeTemperatureSchema: z.ZodObject<{
    current_temp: z.ZodNumber;
    target_temp: z.ZodNumber;
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    cook_method: z.ZodOptional<z.ZodEnum<["smoke_low_slow", "smoke_hot_fast", "grill_direct", "grill_indirect", "reverse_sear", "spatchcock", "rotisserie"]>>;
    cook_start_time: z.ZodOptional<z.ZodString>;
    previous_readings: z.ZodOptional<z.ZodArray<z.ZodObject<{
        temp: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        temp: number;
        timestamp: string;
    }, {
        temp: number;
        timestamp: string;
    }>, "many">>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format: "markdown" | "json";
    current_temp: number;
    target_temp: number;
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    cook_start_time?: string | undefined;
    previous_readings?: {
        temp: number;
        timestamp: string;
    }[] | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    current_temp: number;
    target_temp: number;
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    response_format?: "markdown" | "json" | undefined;
    cook_start_time?: string | undefined;
    previous_readings?: {
        temp: number;
        timestamp: string;
    }[] | undefined;
}>;
export type AnalyzeTemperatureInput = z.infer<typeof AnalyzeTemperatureSchema>;
/**
 * Schema for getting target temperature
 */
export declare const GetTargetTemperatureSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    doneness: z.ZodOptional<z.ZodEnum<["rare", "medium_rare", "medium", "medium_well", "well_done", "pullable", "usda_safe"]>>;
    include_pull_temp: z.ZodDefault<z.ZodBoolean>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format: "markdown" | "json";
    include_pull_temp: boolean;
    doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format?: "markdown" | "json" | undefined;
    doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
    include_pull_temp?: boolean | undefined;
}>;
export type GetTargetTemperatureInput = z.infer<typeof GetTargetTemperatureSchema>;
/**
 * Schema for listing proteins
 */
export declare const ListProteinsSchema: z.ZodObject<{
    category: z.ZodDefault<z.ZodEnum<["beef", "pork", "poultry", "lamb", "seafood", "all"]>>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
    category: "beef" | "pork" | "poultry" | "lamb" | "seafood" | "all";
}, {
    response_format?: "markdown" | "json" | undefined;
    category?: "beef" | "pork" | "poultry" | "lamb" | "seafood" | "all" | undefined;
}>;
export type ListProteinsInput = z.infer<typeof ListProteinsSchema>;
/**
 * Schema for estimating cook time
 */
export declare const EstimateCookTimeSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    weight_pounds: z.ZodNumber;
    cook_method: z.ZodEnum<["smoke_low_slow", "smoke_hot_fast", "grill_direct", "grill_indirect", "reverse_sear", "spatchcock", "rotisserie"]>;
    smoker_temp: z.ZodOptional<z.ZodNumber>;
    target_doneness: z.ZodOptional<z.ZodEnum<["rare", "medium_rare", "medium", "medium_well", "well_done", "pullable", "usda_safe"]>>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    weight_pounds: number;
    cook_method: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie";
    response_format: "markdown" | "json";
    target_doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
    smoker_temp?: number | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    weight_pounds: number;
    cook_method: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie";
    target_doneness?: "rare" | "medium_rare" | "medium" | "medium_well" | "well_done" | "pullable" | "usda_safe" | undefined;
    response_format?: "markdown" | "json" | undefined;
    smoker_temp?: number | undefined;
}>;
export type EstimateCookTimeInput = z.infer<typeof EstimateCookTimeSchema>;
/**
 * Schema for detecting stall
 */
export declare const DetectStallSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    current_temp: z.ZodNumber;
    readings: z.ZodArray<z.ZodObject<{
        temp: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        temp: number;
        timestamp: string;
    }, {
        temp: number;
        timestamp: string;
    }>, "many">;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format: "markdown" | "json";
    current_temp: number;
    readings: {
        temp: number;
        timestamp: string;
    }[];
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    current_temp: number;
    readings: {
        temp: number;
        timestamp: string;
    }[];
    response_format?: "markdown" | "json" | undefined;
}>;
export type DetectStallInput = z.infer<typeof DetectStallSchema>;
/**
 * Schema for getting cooking tips
 */
export declare const GetCookingTipsSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    cook_method: z.ZodOptional<z.ZodEnum<["smoke_low_slow", "smoke_hot_fast", "grill_direct", "grill_indirect", "reverse_sear", "spatchcock", "rotisserie"]>>;
    current_phase: z.ZodOptional<z.ZodEnum<["prep", "cooking", "stall", "wrapping", "final_push", "resting", "serving"]>>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format: "markdown" | "json";
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    current_phase?: "resting" | "prep" | "cooking" | "stall" | "wrapping" | "final_push" | "serving" | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    cook_method?: "smoke_low_slow" | "smoke_hot_fast" | "grill_direct" | "grill_indirect" | "reverse_sear" | "spatchcock" | "rotisserie" | undefined;
    response_format?: "markdown" | "json" | undefined;
    current_phase?: "resting" | "prep" | "cooking" | "stall" | "wrapping" | "final_push" | "serving" | undefined;
}>;
export type GetCookingTipsInput = z.infer<typeof GetCookingTipsSchema>;
/**
 * Schema for calculating rest time
 */
export declare const CalculateRestTimeSchema: z.ZodObject<{
    protein_type: z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>;
    current_temp: z.ZodNumber;
    target_final_temp: z.ZodOptional<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    response_format: "markdown" | "json";
    current_temp: number;
    target_final_temp?: number | undefined;
}, {
    protein_type: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other";
    current_temp: number;
    response_format?: "markdown" | "json" | undefined;
    target_final_temp?: number | undefined;
}>;
export type CalculateRestTimeInput = z.infer<typeof CalculateRestTimeSchema>;
/**
 * Schema for simulating ThermoWorks device data
 * This simulates what we'd receive from the ThermoWorks Cloud API
 */
export declare const SimulateDeviceReadingSchema: z.ZodObject<{
    device_type: z.ZodEnum<["Signals", "Smoke", "BlueDOT"]>;
    probe_readings: z.ZodArray<z.ZodObject<{
        probe_id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        temperature: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        probe_id: string;
        temperature: number;
        name?: string | undefined;
    }, {
        probe_id: string;
        temperature: number;
        name?: string | undefined;
    }>, "many">;
    protein_type: z.ZodOptional<z.ZodEnum<["beef_brisket", "beef_ribeye", "beef_tri_tip", "beef_prime_rib", "beef_short_ribs", "pork_shoulder", "pork_butt", "pork_ribs_spare", "pork_ribs_baby_back", "pork_loin", "pork_tenderloin", "pork_belly", "chicken_whole", "chicken_breast", "chicken_thighs", "chicken_wings", "turkey_whole", "turkey_breast", "lamb_shoulder", "lamb_leg", "lamb_rack", "salmon", "other"]>>;
    target_temp: z.ZodOptional<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
    device_type: "Signals" | "Smoke" | "BlueDOT";
    probe_readings: {
        probe_id: string;
        temperature: number;
        name?: string | undefined;
    }[];
    protein_type?: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other" | undefined;
    target_temp?: number | undefined;
}, {
    device_type: "Signals" | "Smoke" | "BlueDOT";
    probe_readings: {
        probe_id: string;
        temperature: number;
        name?: string | undefined;
    }[];
    protein_type?: "beef_brisket" | "beef_ribeye" | "beef_tri_tip" | "beef_prime_rib" | "beef_short_ribs" | "pork_shoulder" | "pork_butt" | "pork_ribs_spare" | "pork_ribs_baby_back" | "pork_loin" | "pork_tenderloin" | "pork_belly" | "chicken_whole" | "chicken_breast" | "chicken_thighs" | "chicken_wings" | "turkey_whole" | "turkey_breast" | "lamb_shoulder" | "lamb_leg" | "lamb_rack" | "salmon" | "other" | undefined;
    response_format?: "markdown" | "json" | undefined;
    target_temp?: number | undefined;
}>;
export type SimulateDeviceReadingInput = z.infer<typeof SimulateDeviceReadingSchema>;
/**
 * Schema for temperature conversion
 */
export declare const ConvertTemperatureSchema: z.ZodObject<{
    temperature: z.ZodNumber;
    from_unit: z.ZodDefault<z.ZodEnum<["fahrenheit", "celsius"]>>;
    to_unit: z.ZodDefault<z.ZodEnum<["fahrenheit", "celsius"]>>;
}, "strict", z.ZodTypeAny, {
    temperature: number;
    from_unit: "fahrenheit" | "celsius";
    to_unit: "fahrenheit" | "celsius";
}, {
    temperature: number;
    from_unit?: "fahrenheit" | "celsius" | undefined;
    to_unit?: "fahrenheit" | "celsius" | undefined;
}>;
export type ConvertTemperatureInput = z.infer<typeof ConvertTemperatureSchema>;
//# sourceMappingURL=index.d.ts.map