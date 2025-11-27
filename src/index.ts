/**
 * BBQ MCP Server
 * An MCP server for BBQ cooking guidance with ThermoWorks Cloud integration
 *
 * Provides tools for:
 * - Authenticating with ThermoWorks Cloud
 * - Getting live temperature readings from connected devices
 * - Getting cooking guidance for various proteins
 * - Analyzing live temperature data
 * - Estimating cook times
 * - Detecting stalls
 * - Calculating rest times
 * - Converting temperatures
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";

import { PROTEIN_PROFILES, COOK_METHOD_INFO, DONENESS_INFO } from "./constants.js";
import {
  GetCookingGuidanceSchema,
  AnalyzeTemperatureSchema,
  GetTargetTemperatureSchema,
  ListProteinsSchema,
  EstimateCookTimeSchema,
  DetectStallSchema,
  GetCookingTipsSchema,
  CalculateRestTimeSchema,
  SimulateDeviceReadingSchema,
  ConvertTemperatureSchema,
} from "./schemas/index.js";
import {
  AuthenticateSchema,
  GetDevicesSchema,
  GetLiveReadingsSchema,
  AnalyzeLiveTemperatureSchema,
  CheckAuthStatusSchema,
} from "./schemas/auth.js";
import type {
  GetCookingGuidanceInput,
  AnalyzeTemperatureInput,
  GetTargetTemperatureInput,
  ListProteinsInput,
  EstimateCookTimeInput,
  DetectStallInput,
  GetCookingTipsInput,
  CalculateRestTimeInput,
  SimulateDeviceReadingInput,
  ConvertTemperatureInput,
} from "./schemas/index.js";
import type {
  AuthenticateInput,
  GetDevicesInput,
  GetLiveReadingsInput,
  AnalyzeLiveTemperatureInput,
  CheckAuthStatusInput,
} from "./schemas/auth.js";
import {
  getThermoWorksClient,
  resetThermoWorksClient,
} from "./services/thermoworks.js";
import type { ProteinType } from "./types.js";
import {
  getProteinProfile,
  getTargetTemperature,
  estimateCookTime,
  calculateStartTime,
  analyzeTemperature,
  detectStall,
  calculateRestTime,
  getCookingTips,
  convertTemperature,
  getRecommendedCookMethod,
} from "./services/cooking.js";
import {
  formatCookingGuidanceMarkdown,
  formatTemperatureAnalysisMarkdown,
  formatProteinListMarkdown,
  formatStallDetectionMarkdown,
  formatRestTimeMarkdown,
  formatDeviceReadingMarkdown,
  formatTipsMarkdown,
  formatTargetTempMarkdown,
} from "./services/formatting.js";
import type { DonenessLevel } from "./types.js";

// Initialize the MCP server
const server = new McpServer({
  name: "bbq-mcp-server",
  version: "1.0.0",
});

// Auto-authenticate with ThermoWorks if credentials are provided via environment variables
async function autoAuthenticate(): Promise<void> {
  const email = process.env.THERMOWORKS_EMAIL;
  const password = process.env.THERMOWORKS_PASSWORD;
  const useLegacySmoke = process.env.USE_LEGACY_SMOKE === "true";

  if (email && password) {
    try {
      console.error("Auto-authenticating with ThermoWorks...");
      const client = getThermoWorksClient(useLegacySmoke);
      await client.authenticate({ email, password });
      const devices = await client.getDevices();
      console.error(`ThermoWorks authentication successful. Found ${devices.length} device(s).`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`ThermoWorks auto-authentication failed: ${message}`);
    }
  }
}

// ===== TOOL REGISTRATIONS =====

/**
 * Tool: bbq_get_cooking_guidance
 * Get comprehensive cooking guidance for a specific protein
 */
server.registerTool(
  "bbq_get_cooking_guidance",
  {
    title: "Get BBQ Cooking Guidance",
    description: `Get comprehensive cooking guidance for a specific protein including target temperatures, time estimates, and tips.

This is the primary tool for planning a cook. It provides:
- Target internal temperature based on desired doneness
- Pull temperature (accounting for carryover)
- Estimated cook time based on weight and method
- Timeline for when to start if serving time is specified
- Stall warnings for large cuts
- Resting instructions
- Pro tips for the specific protein

Args:
  - protein_type: Type of meat (e.g., 'beef_brisket', 'pork_shoulder', 'chicken_whole')
  - weight_pounds: Weight in pounds (e.g., 12.5)
  - target_doneness: Desired doneness level (optional, uses recommended if not specified)
  - cook_method: Cooking method (optional, uses recommended if not specified)
  - serving_time: Target serving time in ISO 8601 format (optional)
  - response_format: 'markdown' or 'json'

Examples:
  - "How should I cook a 14 lb brisket?" -> protein_type='beef_brisket', weight_pounds=14
  - "I want to serve pulled pork at 6pm" -> protein_type='pork_butt', serving_time='2024-12-25T18:00:00'`,
    inputSchema: GetCookingGuidanceSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: GetCookingGuidanceInput) => {
    try {
      const profile = getProteinProfile(params.protein_type);
      const cookMethod = params.cook_method || getRecommendedCookMethod(params.protein_type);
      const { targetTemp, pullTemp, doneness } = getTargetTemperature(
        params.protein_type,
        params.target_doneness
      );
      const estimate = estimateCookTime(
        params.protein_type,
        params.weight_pounds,
        cookMethod
      );

      let startTimeInfo: { startTime: Date; restTime: number; bufferMinutes: number } | undefined;
      if (params.serving_time) {
        const servingDate = new Date(params.serving_time);
        startTimeInfo = calculateStartTime(
          params.protein_type,
          params.weight_pounds,
          cookMethod,
          servingDate
        );
      }

      if (params.response_format === "json") {
        const output = {
          protein: {
            type: params.protein_type,
            displayName: profile.displayName,
            category: profile.category,
            weightPounds: params.weight_pounds,
          },
          temperatures: {
            targetTemp,
            pullTemp,
            carryover: profile.carryoverDegrees,
            usdaSafeMin: profile.usdaSafeTemp,
          },
          doneness: {
            level: doneness,
            displayName: DONENESS_INFO[doneness].displayName,
            description: DONENESS_INFO[doneness].description,
          },
          cookMethod: {
            method: cookMethod,
            displayName: COOK_METHOD_INFO[cookMethod].displayName,
            tempRange: COOK_METHOD_INFO[cookMethod].tempRange,
          },
          timeEstimate: {
            totalMinutes: estimate.totalMinutes,
            hoursAndMinutes: estimate.hoursAndMinutes,
            confidence: estimate.confidence,
            estimatedDoneTime: estimate.estimatedDoneTime.toISOString(),
          },
          timeline: startTimeInfo
            ? {
                startTime: startTimeInfo.startTime.toISOString(),
                restTimeMinutes: startTimeInfo.restTime,
                bufferMinutes: startTimeInfo.bufferMinutes,
              }
            : null,
          rest: {
            required: profile.requiresRest,
            minutes: profile.restTimeMinutes,
          },
          stall: profile.stallRange
            ? {
                expectedRange: profile.stallRange,
                warning: "Temperature may plateau for 2-4 hours in this range",
              }
            : null,
          tips: profile.tips,
          assumptions: estimate.assumptions,
          warnings: estimate.warnings,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatCookingGuidanceMarkdown(
        profile,
        params.weight_pounds,
        targetTemp,
        pullTemp,
        doneness,
        cookMethod,
        estimate,
        startTimeInfo
      );

      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting cooking guidance: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_analyze_temperature
 * Analyze current temperature and provide progress/recommendations
 */
server.registerTool(
  "bbq_analyze_temperature",
  {
    title: "Analyze Temperature Progress",
    description: `Analyze current temperature reading and provide progress assessment, trend analysis, and recommendations.

Use this tool to interpret live temperature data from a thermometer. It provides:
- Progress percentage toward target
- Temperature trend (rising, falling, stalled, stable)
- Rate of temperature change per hour
- Estimated time remaining
- Stall detection
- Actionable recommendations

Args:
  - current_temp: Current internal temperature in °F
  - target_temp: Target internal temperature in °F
  - protein_type: Type of protein being cooked
  - cook_method: Cooking method (optional)
  - cook_start_time: When cook started, ISO 8601 format (optional)
  - previous_readings: Array of {temp, timestamp} for trend analysis (optional)
  - response_format: 'markdown' or 'json'

Examples:
  - "My brisket is at 165°F, target is 203°F" -> current_temp=165, target_temp=203, protein_type='beef_brisket'
  - "Temperature hasn't moved in 2 hours" -> Include previous_readings for stall detection`,
    inputSchema: AnalyzeTemperatureSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: AnalyzeTemperatureInput) => {
    try {
      const previousReadings = params.previous_readings?.map((r) => ({
        temp: r.temp,
        timestamp: new Date(r.timestamp),
      }));

      const cookStart = params.cook_start_time ? new Date(params.cook_start_time) : undefined;

      const analysis = analyzeTemperature(
        params.current_temp,
        params.target_temp,
        params.protein_type,
        params.cook_method,
        cookStart,
        previousReadings
      );

      if (params.response_format === "json") {
        const output = {
          currentTemp: analysis.currentTemp,
          targetTemp: analysis.targetTemp,
          tempDelta: analysis.tempDelta,
          percentComplete: analysis.percentComplete,
          trend: analysis.trend,
          trendRatePerHour: analysis.trendRatePerHour,
          estimatedMinutesRemaining: analysis.estimatedMinutesRemaining,
          inStallZone: analysis.inStallZone,
          recommendations: analysis.recommendations,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatTemperatureAnalysisMarkdown(analysis);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error analyzing temperature: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_get_target_temperature
 * Get target temperature for a protein at specified doneness
 */
server.registerTool(
  "bbq_get_target_temperature",
  {
    title: "Get Target Temperature",
    description: `Get the target internal temperature for a specific protein and doneness level.

Returns both the target serving temperature and the pull temperature (when to remove from heat) accounting for carryover cooking.

Args:
  - protein_type: Type of protein
  - doneness: Desired doneness level (optional, uses recommended if not specified)
  - include_pull_temp: Whether to include pull temperature (default: true)
  - response_format: 'markdown' or 'json'

Examples:
  - "What temp for medium-rare ribeye?" -> protein_type='beef_ribeye', doneness='medium_rare'
  - "When is chicken done?" -> protein_type='chicken_whole'`,
    inputSchema: GetTargetTemperatureSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: GetTargetTemperatureInput) => {
    try {
      const profile = getProteinProfile(params.protein_type);
      const { targetTemp, pullTemp, doneness } = getTargetTemperature(
        params.protein_type,
        params.doneness
      );

      if (params.response_format === "json") {
        const output = {
          proteinType: params.protein_type,
          displayName: profile.displayName,
          doneness: {
            level: doneness,
            displayName: DONENESS_INFO[doneness].displayName,
            description: DONENESS_INFO[doneness].description,
          },
          temperatures: {
            target: targetTemp,
            pull: params.include_pull_temp ? pullTemp : undefined,
            carryover: profile.carryoverDegrees,
            usdaSafeMin: profile.usdaSafeTemp,
          },
          allDonenessOptions: Object.entries(profile.donenessTemps).map(([level, temp]) => ({
            level,
            displayName: DONENESS_INFO[level as DonenessLevel]?.displayName || level,
            temperature: temp,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatTargetTempMarkdown(profile, targetTemp, pullTemp, doneness);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting target temperature: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_list_proteins
 * List all supported protein types
 */
server.registerTool(
  "bbq_list_proteins",
  {
    title: "List Supported Proteins",
    description: `List all supported protein types with their key cooking information.

Use this to discover available proteins and their identifiers for use with other tools.

Args:
  - category: Filter by category ('beef', 'pork', 'poultry', 'lamb', 'seafood', 'all')
  - response_format: 'markdown' or 'json'

Examples:
  - "What meats can you help me cook?" -> category='all'
  - "Show me beef options" -> category='beef'`,
    inputSchema: ListProteinsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: ListProteinsInput) => {
    try {
      let proteins = Object.values(PROTEIN_PROFILES);

      if (params.category !== "all") {
        proteins = proteins.filter((p) => p.category === params.category);
      }

      if (params.response_format === "json") {
        const output = {
          category: params.category,
          count: proteins.length,
          proteins: proteins.map((p) => ({
            type: p.type,
            displayName: p.displayName,
            category: p.category,
            usdaSafeTemp: p.usdaSafeTemp,
            recommendedMethods: p.recommendedMethods,
            hasStall: !!p.stallRange,
            donenessOptions: Object.keys(p.donenessTemps),
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatProteinListMarkdown(proteins, params.category);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing proteins: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_estimate_cook_time
 * Estimate cooking time for a protein
 */
server.registerTool(
  "bbq_estimate_cook_time",
  {
    title: "Estimate Cook Time",
    description: `Estimate total cooking time for a protein based on weight and cooking method.

Provides time estimates with confidence levels and accounts for factors like stalls.

Args:
  - protein_type: Type of protein
  - weight_pounds: Weight in pounds
  - cook_method: Cooking method to use
  - smoker_temp: Smoker/grill temperature in °F (optional)
  - target_doneness: Target doneness level (optional)
  - response_format: 'markdown' or 'json'

Examples:
  - "How long for a 10 lb pork butt?" -> protein_type='pork_butt', weight_pounds=10, cook_method='smoke_low_slow'
  - "Time for hot and fast brisket" -> protein_type='beef_brisket', cook_method='smoke_hot_fast'`,
    inputSchema: EstimateCookTimeSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: EstimateCookTimeInput) => {
    try {
      const profile = getProteinProfile(params.protein_type);
      const estimate = estimateCookTime(
        params.protein_type,
        params.weight_pounds,
        params.cook_method,
        params.smoker_temp
      );

      if (params.response_format === "json") {
        const output = {
          protein: {
            type: params.protein_type,
            displayName: profile.displayName,
            weightPounds: params.weight_pounds,
          },
          method: {
            method: params.cook_method,
            displayName: COOK_METHOD_INFO[params.cook_method].displayName,
            tempRange: COOK_METHOD_INFO[params.cook_method].tempRange,
            actualTemp: params.smoker_temp,
          },
          estimate: {
            totalMinutes: estimate.totalMinutes,
            hoursAndMinutes: estimate.hoursAndMinutes,
            estimatedDoneTime: estimate.estimatedDoneTime.toISOString(),
            confidence: estimate.confidence,
          },
          rest: {
            required: profile.requiresRest,
            minutes: profile.restTimeMinutes,
          },
          assumptions: estimate.assumptions,
          warnings: estimate.warnings,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      let markdown = `## ⏱️ Cook Time Estimate: ${profile.displayName}\n\n`;
      markdown += `**Weight:** ${params.weight_pounds} lbs\n`;
      markdown += `**Method:** ${COOK_METHOD_INFO[params.cook_method].displayName}\n`;
      if (params.smoker_temp) {
        markdown += `**Smoker Temp:** ${params.smoker_temp}°F\n`;
      }
      markdown += `\n### Estimate\n\n`;
      markdown += `**Total Time:** ${estimate.hoursAndMinutes}\n`;
      markdown += `**Confidence:** ${estimate.confidence}\n`;
      markdown += `**Done Around:** ${estimate.estimatedDoneTime.toLocaleTimeString()}\n\n`;

      if (profile.requiresRest) {
        markdown += `**+ Rest Time:** ${profile.restTimeMinutes} minutes\n\n`;
      }

      if (estimate.assumptions.length > 0) {
        markdown += `### Notes\n\n`;
        for (const note of estimate.assumptions) {
          markdown += `- ${note}\n`;
        }
      }

      if (estimate.warnings.length > 0) {
        markdown += `\n### ⚠️ Warnings\n\n`;
        for (const warning of estimate.warnings) {
          markdown += `- ${warning}\n`;
        }
      }

      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error estimating cook time: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_detect_stall
 * Detect if a cook is in a stall
 */
server.registerTool(
  "bbq_detect_stall",
  {
    title: "Detect Temperature Stall",
    description: `Analyze temperature readings to detect if a cook is experiencing a stall.

The stall is a phenomenon where internal temperature plateaus, common with large cuts like brisket and pork shoulder. This tool analyzes temperature trend to detect stalls and provides recommendations.

Args:
  - protein_type: Type of protein being cooked
  - current_temp: Current internal temperature in °F
  - readings: Array of at least 3 readings with {temp, timestamp}
  - response_format: 'markdown' or 'json'

Examples:
  - "Is my brisket stalling?" -> Provide current_temp and readings array
  - "Temp hasn't moved in 2 hours" -> Include readings over that period`,
    inputSchema: DetectStallSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: DetectStallInput) => {
    try {
      const readings = params.readings.map((r) => ({
        temp: r.temp,
        timestamp: new Date(r.timestamp),
      }));

      const result = detectStall(params.protein_type, params.current_temp, readings);

      if (params.response_format === "json") {
        const output = {
          currentTemp: params.current_temp,
          isStalled: result.isStalled,
          stallDurationMinutes: result.stallDurationMinutes,
          inStallZone: result.inStallZone,
          recommendation: result.recommendation,
          proteinType: params.protein_type,
          readingsAnalyzed: readings.length,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatStallDetectionMarkdown(result, params.current_temp);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error detecting stall: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_get_cooking_tips
 * Get cooking tips for a protein
 */
server.registerTool(
  "bbq_get_cooking_tips",
  {
    title: "Get Cooking Tips",
    description: `Get cooking tips and best practices for a specific protein and situation.

Args:
  - protein_type: Type of protein
  - cook_method: Specific cooking method (optional)
  - current_phase: Current cooking phase for targeted tips (optional)
    - 'prep': Preparation and seasoning
    - 'cooking': Active cooking
    - 'stall': Temperature stall
    - 'wrapping': Texas crutch / wrapping
    - 'final_push': End of cook
    - 'resting': Rest period
    - 'serving': Slicing and serving
  - response_format: 'markdown' or 'json'

Examples:
  - "Tips for smoking brisket" -> protein_type='beef_brisket', cook_method='smoke_low_slow'
  - "Help with the stall" -> protein_type='beef_brisket', current_phase='stall'`,
    inputSchema: GetCookingTipsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: GetCookingTipsInput) => {
    try {
      const tips = getCookingTips(params.protein_type, params.cook_method, params.current_phase);

      if (params.response_format === "json") {
        const output = {
          proteinType: params.protein_type,
          cookMethod: params.cook_method,
          currentPhase: params.current_phase,
          tips,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatTipsMarkdown(tips, params.protein_type);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error getting cooking tips: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_calculate_rest_time
 * Calculate recommended rest time
 */
server.registerTool(
  "bbq_calculate_rest_time",
  {
    title: "Calculate Rest Time",
    description: `Calculate recommended rest time and expected carryover cooking.

Resting allows juices to redistribute and temperature to equalize. This tool provides rest time recommendations and predicts final temperature after carryover.

Args:
  - protein_type: Type of protein
  - current_temp: Current internal temperature when removed from heat
  - target_final_temp: Desired final temperature after resting (optional)
  - response_format: 'markdown' or 'json'

Examples:
  - "Brisket is at 200°F, how long to rest?" -> protein_type='beef_brisket', current_temp=200
  - "Pulled steak at 125°F for medium-rare" -> protein_type='beef_ribeye', current_temp=125, target_final_temp=130`,
    inputSchema: CalculateRestTimeSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: CalculateRestTimeInput) => {
    try {
      const result = calculateRestTime(
        params.protein_type,
        params.current_temp,
        params.target_final_temp
      );

      if (params.response_format === "json") {
        const output = {
          proteinType: params.protein_type,
          currentTemp: params.current_temp,
          targetFinalTemp: params.target_final_temp,
          recommendedRestMinutes: result.recommendedRestMinutes,
          expectedCarryover: result.expectedCarryover,
          expectedFinalTemp: result.expectedFinalTemp,
          instructions: result.instructions,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatRestTimeMarkdown(result);
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error calculating rest time: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_analyze_device_reading
 * Analyze readings from a ThermoWorks device
 */
server.registerTool(
  "bbq_analyze_device_reading",
  {
    title: "Analyze ThermoWorks Device Reading",
    description: `Analyze temperature readings from a ThermoWorks device (Signals, Smoke, BlueDOT).

Simulates integration with ThermoWorks Cloud to provide analysis of multi-probe readings.

Args:
  - device_type: Type of ThermoWorks device ('Signals', 'Smoke', 'BlueDOT')
  - probe_readings: Array of probe readings with {probe_id, name, temperature}
  - protein_type: Type of protein being cooked (optional)
  - target_temp: Target temperature (optional)
  - response_format: 'markdown' or 'json'

Examples:
  - "Signals reading: Probe 1 at 165°F, Ambient at 250°F"
  - "Smoke shows 180°F on the meat probe"`,
    inputSchema: SimulateDeviceReadingSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: SimulateDeviceReadingInput) => {
    try {
      // Find the meat probe (not ambient)
      const meatProbe = params.probe_readings.find(
        (p) => !p.probe_id.toLowerCase().includes("ambient") && !p.name?.toLowerCase().includes("ambient")
      );

      let analysis: ReturnType<typeof analyzeTemperature> | undefined;
      if (meatProbe && params.protein_type && params.target_temp) {
        analysis = analyzeTemperature(
          meatProbe.temperature,
          params.target_temp,
          params.protein_type
        );
      }

      if (params.response_format === "json") {
        const output = {
          deviceType: params.device_type,
          probeReadings: params.probe_readings,
          proteinType: params.protein_type,
          targetTemp: params.target_temp,
          analysis: analysis
            ? {
                currentTemp: analysis.currentTemp,
                targetTemp: analysis.targetTemp,
                percentComplete: analysis.percentComplete,
                tempDelta: analysis.tempDelta,
                recommendations: analysis.recommendations,
              }
            : null,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      const markdown = formatDeviceReadingMarkdown(
        params.device_type,
        params.probe_readings,
        analysis
      );
      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error analyzing device reading: ${message}` }],
      };
    }
  }
);

/**
 * Tool: bbq_convert_temperature
 * Convert temperature between Fahrenheit and Celsius
 */
server.registerTool(
  "bbq_convert_temperature",
  {
    title: "Convert Temperature",
    description: `Convert temperature between Fahrenheit and Celsius.

Args:
  - temperature: Temperature value to convert
  - from_unit: Source unit ('fahrenheit' or 'celsius')
  - to_unit: Target unit ('fahrenheit' or 'celsius')

Examples:
  - "What is 225°F in Celsius?" -> temperature=225, from_unit='fahrenheit', to_unit='celsius'
  - "Convert 100°C to Fahrenheit" -> temperature=100, from_unit='celsius', to_unit='fahrenheit'`,
    inputSchema: ConvertTemperatureSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: ConvertTemperatureInput) => {
    try {
      const result = convertTemperature(params.temperature, params.from_unit, params.to_unit);

      const fromSymbol = params.from_unit === "fahrenheit" ? "°F" : "°C";
      const toSymbol = params.to_unit === "fahrenheit" ? "°F" : "°C";

      const output = {
        original: {
          value: params.temperature,
          unit: params.from_unit,
        },
        converted: {
          value: result,
          unit: params.to_unit,
        },
        display: `${params.temperature}${fromSymbol} = ${result}${toSymbol}`,
      };

      return {
        content: [{ type: "text", text: output.display }],
        structuredContent: output,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        isError: true,
        content: [{ type: "text", text: `Error converting temperature: ${message}` }],
      };
    }
  }
);

// ===== THERMOWORKS CLOUD INTEGRATION TOOLS =====

/**
 * Tool: thermoworks_authenticate
 * Authenticate with ThermoWorks Cloud to access live device data
 */
server.registerTool(
  "thermoworks_authenticate",
  {
    title: "Authenticate with ThermoWorks Cloud",
    description: `Connect to ThermoWorks Cloud using your ThermoWorks account credentials.

This allows the BBQ MCP Server to access live temperature data from your connected ThermoWorks devices (Signals, Smoke, BlueDOT, etc.).

IMPORTANT: Your credentials are only used to authenticate with ThermoWorks' servers and are not stored. The authentication token expires after 1 hour.

Args:
  - email: Your ThermoWorks account email (same as the ThermoWorks app)
  - password: Your ThermoWorks account password
  - use_legacy_smoke: Set to true for older Smoke Gateway devices (pre-2022)

Returns:
  Authentication status and list of connected devices.

Security Notes:
  - Credentials are sent directly to ThermoWorks/Firebase servers over HTTPS
  - No credentials are stored by the MCP server
  - For production use, set credentials via environment variables:
    THERMOWORKS_EMAIL and THERMOWORKS_PASSWORD

Examples:
  - "Connect to my ThermoWorks account" -> Provide email and password
  - "I have an older Smoke Gateway" -> Set use_legacy_smoke=true`,
    inputSchema: AuthenticateSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: AuthenticateInput) => {
    try {
      // Reset any existing client to ensure fresh auth
      resetThermoWorksClient();
      
      const client = getThermoWorksClient(params.use_legacy_smoke);
      await client.authenticate({
        email: params.email,
        password: params.password,
      });

      // Get list of devices after successful auth
      const devices = await client.getDevices();
      const authInfo = client.getAuthInfo();

      const output = {
        authenticated: true,
        userId: authInfo.userId,
        tokenExpiry: authInfo.tokenExpiry?.toISOString(),
        deviceCount: devices.length,
        devices: devices.map((d) => ({
          serial: d.serial,
          name: d.name,
          type: d.type,
        })),
      };

      let markdown = `## ✅ Connected to ThermoWorks Cloud\n\n`;
      markdown += `**Account:** ${params.email}\n`;
      markdown += `**Devices Found:** ${devices.length}\n\n`;

      if (devices.length > 0) {
        markdown += `### Your Devices\n\n`;
        for (const device of devices) {
          markdown += `- **${device.name}** (${device.type}) - Serial: ${device.serial}\n`;
        }
        markdown += `\nYou can now use \`thermoworks_get_live_readings\` to get temperature data!`;
      } else {
        markdown += `No devices found. Make sure your devices are:\n`;
        markdown += `- Registered in the ThermoWorks app\n`;
        markdown += `- Connected to WiFi (for Signals/Smoke Gateway)\n`;
        markdown += `- Currently powered on\n`;
      }

      return {
        content: [{ type: "text", text: markdown }],
        structuredContent: output,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `## ❌ Authentication Failed\n\n${message}\n\n**Troubleshooting:**\n- Verify your email and password are correct\n- Make sure you're using the same credentials as the ThermoWorks app\n- For older Smoke Gateway devices, set use_legacy_smoke=true`,
          },
        ],
      };
    }
  }
);

/**
 * Tool: thermoworks_check_auth
 * Check current authentication status
 */
server.registerTool(
  "thermoworks_check_auth",
  {
    title: "Check ThermoWorks Auth Status",
    description: `Check if you're currently authenticated with ThermoWorks Cloud.

Returns:
  Authentication status and token expiry time.`,
    inputSchema: CheckAuthStatusSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (_params: CheckAuthStatusInput) => {
    const client = getThermoWorksClient();
    const isAuth = client.isAuthenticated();
    const authInfo = client.getAuthInfo();

    if (!isAuth) {
      return {
        content: [
          {
            type: "text",
            text: `## 🔒 Not Authenticated\n\nUse \`thermoworks_authenticate\` to connect to ThermoWorks Cloud.`,
          },
        ],
        structuredContent: { authenticated: false },
      };
    }

    const output = {
      authenticated: true,
      userId: authInfo.userId,
      tokenExpiry: authInfo.tokenExpiry?.toISOString(),
      tokenValid: authInfo.tokenExpiry ? authInfo.tokenExpiry > new Date() : false,
    };

    return {
      content: [
        {
          type: "text",
          text: `## ✅ Authenticated\n\n**User ID:** ${authInfo.userId}\n**Token Expires:** ${authInfo.tokenExpiry?.toLocaleString()}`,
        },
      ],
      structuredContent: output,
    };
  }
);

/**
 * Tool: thermoworks_get_devices
 * Get list of connected ThermoWorks devices
 */
server.registerTool(
  "thermoworks_get_devices",
  {
    title: "Get ThermoWorks Devices",
    description: `Get a list of all ThermoWorks devices connected to your account.

Requires authentication first via thermoworks_authenticate.

Args:
  - response_format: 'markdown' or 'json'

Returns:
  List of devices with serial numbers, names, and types.`,
    inputSchema: GetDevicesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: GetDevicesInput) => {
    try {
      const client = getThermoWorksClient();

      if (!client.isAuthenticated()) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Not authenticated. Use `thermoworks_authenticate` first.",
            },
          ],
        };
      }

      const devices = await client.getDevices();

      if (params.response_format === "json") {
        return {
          content: [{ type: "text", text: JSON.stringify(devices, null, 2) }],
          structuredContent: { devices },
        };
      }

      let markdown = `## 📱 ThermoWorks Devices\n\n`;
      if (devices.length === 0) {
        markdown += `No devices found.\n`;
      } else {
        for (const device of devices) {
          markdown += `### ${device.name}\n`;
          markdown += `- **Type:** ${device.type}\n`;
          markdown += `- **Serial:** ${device.serial}\n\n`;
        }
      }

      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get devices";
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${message}` }],
      };
    }
  }
);

/**
 * Tool: thermoworks_get_live_readings
 * Get live temperature readings from connected devices
 */
server.registerTool(
  "thermoworks_get_live_readings",
  {
    title: "Get Live Temperature Readings",
    description: `Get current temperature readings from your ThermoWorks devices.

Requires authentication first via thermoworks_authenticate.

Args:
  - device_serial: Serial number of specific device (optional, defaults to all devices)
  - response_format: 'markdown' or 'json'

Returns:
  Current probe temperatures, alarm settings, and timestamps.

Examples:
  - "What are my current temperatures?" -> Gets all device readings
  - "Show me the Signals readings" -> Specify device_serial`,
    inputSchema: GetLiveReadingsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // Readings change over time
      openWorldHint: true,
    },
  },
  async (params: GetLiveReadingsInput) => {
    try {
      const client = getThermoWorksClient();

      if (!client.isAuthenticated()) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Not authenticated. Use `thermoworks_authenticate` first.",
            },
          ],
        };
      }

      let readings;
      if (params.device_serial) {
        const reading = await client.getDeviceReadings(params.device_serial);
        readings = reading ? [reading] : [];
      } else {
        readings = await client.getAllReadings();
      }

      if (readings.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No readings available. Make sure your devices are powered on and connected.",
            },
          ],
        };
      }

      if (params.response_format === "json") {
        return {
          content: [{ type: "text", text: JSON.stringify(readings, null, 2) }],
          structuredContent: { readings },
        };
      }

      let markdown = `## 🌡️ Live Temperature Readings\n\n`;
      markdown += `*Updated: ${new Date().toLocaleString()}*\n\n`;

      for (const reading of readings) {
        markdown += `### ${reading.name} (${reading.serial})\n\n`;

        for (const [probeId, probe] of Object.entries(reading.probes)) {
          const alarmStr =
            probe.alarm_high || probe.alarm_low
              ? ` (Alarm: ${probe.alarm_low || "—"}–${probe.alarm_high || "—"}°${reading.unit})`
              : "";

          markdown += `- **${probe.name || `Probe ${probeId}`}:** ${probe.temp}°${reading.unit}${alarmStr}\n`;
        }
        markdown += "\n";
      }

      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get readings";
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${message}` }],
      };
    }
  }
);

/**
 * Tool: thermoworks_analyze_live
 * Analyze live temperature data and provide cooking recommendations
 */
server.registerTool(
  "thermoworks_analyze_live",
  {
    title: "Analyze Live Temperature",
    description: `Get live temperature from a connected ThermoWorks device and analyze cooking progress.

Combines real-time device data with the BBQ cooking knowledge base to provide actionable recommendations.

Requires authentication first via thermoworks_authenticate.

Args:
  - device_serial: Serial number of the device
  - probe_id: Probe number to analyze (default: '1')
  - protein_type: Type of protein being cooked
  - target_temp: Target temperature (optional, uses protein default)
  - response_format: 'markdown' or 'json'

Returns:
  Current temperature, progress percentage, trend analysis, and recommendations.

Examples:
  - "How's my brisket doing?" -> Analyzes probe 1 against brisket targets
  - "Check the turkey on probe 2" -> protein_type='turkey_whole', probe_id='2'`,
    inputSchema: AnalyzeLiveTemperatureSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params: AnalyzeLiveTemperatureInput) => {
    try {
      const client = getThermoWorksClient();

      if (!client.isAuthenticated()) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Not authenticated. Use `thermoworks_authenticate` first.",
            },
          ],
        };
      }

      // Get live reading
      const reading = await client.getDeviceReadings(params.device_serial);

      if (!reading) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No readings available for device ${params.device_serial}. Make sure the device is powered on.`,
            },
          ],
        };
      }

      // Find the specified probe
      const probeData = reading.probes[params.probe_id];
      if (!probeData) {
        const availableProbes = Object.keys(reading.probes).join(", ");
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Probe ${params.probe_id} not found. Available probes: ${availableProbes}`,
            },
          ],
        };
      }

      // Get target temperature
      const proteinType = params.protein_type as ProteinType;
      const { targetTemp, pullTemp, doneness } = getTargetTemperature(proteinType);
      const target = params.target_temp || targetTemp;

      // Analyze the temperature
      const analysis = analyzeTemperature(
        probeData.temp,
        target,
        proteinType,
        undefined, // No cook method from device
        undefined, // No start time
        undefined // No previous readings yet
      );

      const profile = getProteinProfile(proteinType);

      if (params.response_format === "json") {
        const output = {
          device: {
            serial: reading.serial,
            name: reading.name,
            probe: params.probe_id,
            probeName: probeData.name,
          },
          reading: {
            currentTemp: probeData.temp,
            unit: reading.unit,
            timestamp: reading.timestamp,
          },
          target: {
            temp: target,
            pullTemp,
            doneness,
          },
          analysis,
          protein: {
            type: proteinType,
            displayName: profile.displayName,
          },
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output,
        };
      }

      let markdown = `## 🔴 Live Analysis: ${profile.displayName}\n\n`;
      markdown += `**Device:** ${reading.name} - ${probeData.name || `Probe ${params.probe_id}`}\n`;
      markdown += `**Current Temp:** ${probeData.temp}°${reading.unit}\n`;
      markdown += `**Target:** ${target}°F (${DONENESS_INFO[doneness]?.displayName || doneness})\n`;
      markdown += `**Pull At:** ${pullTemp}°F\n\n`;

      markdown += `### Progress\n\n`;
      markdown += `**${analysis.percentComplete}% complete** (${analysis.tempDelta}°F to go)\n\n`;

      if (analysis.inStallZone) {
        markdown += `⚠️ **In the stall zone!** Temperature may plateau.\n\n`;
      }

      if (analysis.recommendations.length > 0) {
        markdown += `### Recommendations\n\n`;
        for (const rec of analysis.recommendations) {
          markdown += `${rec}\n`;
        }
      }

      return {
        content: [{ type: "text", text: markdown }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to analyze";
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${message}` }],
      };
    }
  }
);

// ===== SERVER STARTUP =====

/**
 * Run server with stdio transport (for local integrations)
 */
async function runStdio(): Promise<void> {
  // Auto-authenticate if credentials are provided
  await autoAuthenticate();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BBQ MCP Server running on stdio");
}

/**
 * Run server with HTTP transport (for remote access)
 */
async function runHTTP(): Promise<void> {
  // Auto-authenticate if credentials are provided
  await autoAuthenticate();

  const app = express();

  // CORS configuration for Smithery deployment
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
    exposedHeaders: ['mcp-session-id', 'mcp-protocol-version'],
  }));

  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", server: "bbq-mcp-server" });
  });

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  app.listen(port, () => {
    console.error(`BBQ MCP Server running on http://localhost:${port}/mcp`);
  });
}

// Choose transport based on environment
const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
