/**
 * Zod validation schemas for BBQ MCP Server tools
 */

import { z } from "zod";

// Response format enum
export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown");

// Temperature unit enum
export const TemperatureUnitSchema = z.enum(["fahrenheit", "celsius"]).default("fahrenheit");

// Protein type enum
export const ProteinTypeSchema = z.enum([
  "beef_brisket",
  "beef_ribeye",
  "beef_tri_tip",
  "beef_prime_rib",
  "beef_short_ribs",
  "pork_shoulder",
  "pork_butt",
  "pork_ribs_spare",
  "pork_ribs_baby_back",
  "pork_loin",
  "pork_tenderloin",
  "pork_belly",
  "chicken_whole",
  "chicken_breast",
  "chicken_thighs",
  "chicken_wings",
  "turkey_whole",
  "turkey_breast",
  "lamb_shoulder",
  "lamb_leg",
  "lamb_rack",
  "salmon",
  "other",
]);

// Cook method enum
export const CookMethodSchema = z.enum([
  "smoke_low_slow",
  "smoke_hot_fast",
  "grill_direct",
  "grill_indirect",
  "reverse_sear",
  "spatchcock",
  "rotisserie",
]);

// Doneness level enum
export const DonenessLevelSchema = z.enum([
  "rare",
  "medium_rare",
  "medium",
  "medium_well",
  "well_done",
  "pullable",
  "usda_safe",
]);

// ===== Tool Input Schemas =====

/**
 * Schema for getting cooking guidance
 */
export const GetCookingGuidanceSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe(
      "Type of protein being cooked (e.g., 'beef_brisket', 'pork_shoulder', 'chicken_whole')"
    ),
    weight_pounds: z
      .number()
      .positive()
      .max(50)
      .describe("Weight of the protein in pounds (e.g., 12.5 for a 12.5 lb brisket)"),
    target_doneness: DonenessLevelSchema.optional().describe(
      "Desired doneness level. If not specified, will use the recommended doneness for the protein type."
    ),
    cook_method: CookMethodSchema.optional().describe(
      "Cooking method to use. If not specified, will recommend the best method for this protein."
    ),
    serving_time: z
      .string()
      .optional()
      .describe(
        "Target serving time in ISO 8601 format (e.g., '2024-12-25T18:00:00'). Used to calculate when to start cooking."
      ),
    response_format: ResponseFormatSchema.describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
  })
  .strict();

export type GetCookingGuidanceInput = z.infer<typeof GetCookingGuidanceSchema>;

/**
 * Schema for analyzing current temperature
 */
export const AnalyzeTemperatureSchema = z
  .object({
    current_temp: z.number().min(-40).max(500).describe("Current internal temperature reading in Fahrenheit"),
    target_temp: z.number().min(100).max(250).describe("Target internal temperature in Fahrenheit"),
    protein_type: ProteinTypeSchema.describe("Type of protein being cooked"),
    cook_method: CookMethodSchema.optional().describe("Cooking method being used"),
    cook_start_time: z
      .string()
      .optional()
      .describe("When the cook started in ISO 8601 format (e.g., '2024-12-25T06:00:00')"),
    previous_readings: z
      .array(
        z.object({
          temp: z.number().describe("Temperature reading"),
          timestamp: z.string().describe("Time of reading in ISO 8601 format"),
        })
      )
      .optional()
      .describe("Previous temperature readings to calculate trend (most recent last)"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type AnalyzeTemperatureInput = z.infer<typeof AnalyzeTemperatureSchema>;

/**
 * Schema for getting target temperature
 */
export const GetTargetTemperatureSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe("Type of protein"),
    doneness: DonenessLevelSchema.optional().describe("Desired doneness level"),
    include_pull_temp: z
      .boolean()
      .default(true)
      .describe("Whether to include pull temperature (accounting for carryover)"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type GetTargetTemperatureInput = z.infer<typeof GetTargetTemperatureSchema>;

/**
 * Schema for listing proteins
 */
export const ListProteinsSchema = z
  .object({
    category: z
      .enum(["beef", "pork", "poultry", "lamb", "seafood", "all"])
      .default("all")
      .describe("Filter by protein category"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type ListProteinsInput = z.infer<typeof ListProteinsSchema>;

/**
 * Schema for estimating cook time
 */
export const EstimateCookTimeSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe("Type of protein being cooked"),
    weight_pounds: z.number().positive().max(50).describe("Weight of the protein in pounds"),
    cook_method: CookMethodSchema.describe("Cooking method to use"),
    smoker_temp: z
      .number()
      .min(200)
      .max(500)
      .optional()
      .describe("Smoker/grill temperature in Fahrenheit. Defaults based on cook method."),
    target_doneness: DonenessLevelSchema.optional().describe("Target doneness level"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type EstimateCookTimeInput = z.infer<typeof EstimateCookTimeSchema>;

/**
 * Schema for detecting stall
 */
export const DetectStallSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe("Type of protein being cooked"),
    current_temp: z.number().min(100).max(250).describe("Current internal temperature in Fahrenheit"),
    readings: z
      .array(
        z.object({
          temp: z.number().describe("Temperature reading"),
          timestamp: z.string().describe("Time of reading in ISO 8601 format"),
        })
      )
      .min(3)
      .describe("At least 3 temperature readings to analyze trend (most recent last)"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type DetectStallInput = z.infer<typeof DetectStallSchema>;

/**
 * Schema for getting cooking tips
 */
export const GetCookingTipsSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe("Type of protein"),
    cook_method: CookMethodSchema.optional().describe("Specific cooking method for targeted tips"),
    current_phase: z
      .enum(["prep", "cooking", "stall", "wrapping", "final_push", "resting", "serving"])
      .optional()
      .describe("Current phase of the cook for phase-specific tips"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type GetCookingTipsInput = z.infer<typeof GetCookingTipsSchema>;

/**
 * Schema for calculating rest time
 */
export const CalculateRestTimeSchema = z
  .object({
    protein_type: ProteinTypeSchema.describe("Type of protein"),
    current_temp: z.number().min(100).max(250).describe("Current internal temperature when removed from heat"),
    target_final_temp: z.number().min(100).max(250).optional().describe("Desired final temperature after resting"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type CalculateRestTimeInput = z.infer<typeof CalculateRestTimeSchema>;

/**
 * Schema for simulating ThermoWorks device data
 * This simulates what we'd receive from the ThermoWorks Cloud API
 */
export const SimulateDeviceReadingSchema = z
  .object({
    device_type: z.enum(["Signals", "Smoke", "BlueDOT"]).describe("Type of ThermoWorks device"),
    probe_readings: z
      .array(
        z.object({
          probe_id: z.string().describe("Probe identifier (e.g., 'probe1', 'ambient')"),
          name: z.string().optional().describe("Custom name for this probe"),
          temperature: z.number().describe("Temperature reading"),
        })
      )
      .min(1)
      .max(4)
      .describe("Temperature readings from each probe"),
    protein_type: ProteinTypeSchema.optional().describe("Type of protein being cooked (if known)"),
    target_temp: z.number().optional().describe("Target temperature set on device"),
    response_format: ResponseFormatSchema.describe("Output format"),
  })
  .strict();

export type SimulateDeviceReadingInput = z.infer<typeof SimulateDeviceReadingSchema>;

/**
 * Schema for temperature conversion
 */
export const ConvertTemperatureSchema = z
  .object({
    temperature: z.number().describe("Temperature value to convert"),
    from_unit: TemperatureUnitSchema.describe("Source temperature unit"),
    to_unit: TemperatureUnitSchema.describe("Target temperature unit"),
  })
  .strict();

export type ConvertTemperatureInput = z.infer<typeof ConvertTemperatureSchema>;
