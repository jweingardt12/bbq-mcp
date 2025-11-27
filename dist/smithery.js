/**
 * BBQ MCP Server - Smithery-compatible Entry Point
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PROTEIN_PROFILES, DONENESS_INFO } from "./constants.js";
import { getProteinProfile, getTargetTemperature, estimateCookTime, calculateStartTime, analyzeTemperature, detectStall, calculateRestTime, convertTemperature, getRecommendedCookMethod, } from "./services/cooking.js";
import { formatCookingGuidanceMarkdown, formatTemperatureAnalysisMarkdown, formatProteinListMarkdown, formatStallDetectionMarkdown, formatRestTimeMarkdown, } from "./services/formatting.js";
import { getThermoWorksClient, resetThermoWorksClient, } from "./services/thermoworks.js";
/**
 * Configuration schema for Smithery deployment
 */
export const configSchema = z.object({
    thermoworksEmail: z.string().email().optional().describe("ThermoWorks account email"),
    thermoworksPassword: z.string().optional().describe("ThermoWorks account password"),
    useLegacySmoke: z.boolean().default(false).describe("Use legacy Smoke Gateway"),
    defaultTempUnit: z.enum(["fahrenheit", "celsius"]).default("fahrenheit"),
});
/**
 * Get proteins filtered by category
 */
function getProteinsByCategory(category) {
    const allProteins = Object.values(PROTEIN_PROFILES);
    if (category === "all")
        return allProteins;
    return allProteins.filter((p) => p.category === category);
}
/**
 * Create and configure the BBQ MCP Server for Smithery
 */
export default function createServer({ config }) {
    const server = new McpServer({
        name: "bbq-mcp-server",
        version: "1.0.0",
    });
    // Auto-authenticate if credentials provided
    if (config.thermoworksEmail && config.thermoworksPassword) {
        const client = getThermoWorksClient(config.useLegacySmoke);
        client.authenticate({
            email: config.thermoworksEmail,
            password: config.thermoworksPassword,
        }).catch((err) => {
            console.error("Auto-authentication failed:", err.message);
        });
    }
    // ===== BBQ COOKING TOOLS =====
    server.tool("bbq_get_cooking_guidance", "Get comprehensive cooking guidance for a protein", {
        protein_type: z.string().describe("Type of protein (e.g., 'beef_brisket')"),
        weight_pounds: z.number().positive().describe("Weight in pounds"),
        target_doneness: z.string().optional().describe("Target doneness level"),
        cook_method: z.string().optional().describe("Cooking method"),
        serving_time: z.string().optional().describe("Target serving time (ISO 8601)"),
    }, async ({ protein_type, weight_pounds, target_doneness, cook_method, serving_time }) => {
        try {
            const profile = getProteinProfile(protein_type);
            const method = cook_method || getRecommendedCookMethod(protein_type);
            const { targetTemp, pullTemp, doneness } = getTargetTemperature(protein_type, target_doneness);
            const timeEstimate = estimateCookTime(protein_type, weight_pounds, method);
            let startTimeInfo;
            if (serving_time) {
                const result = calculateStartTime(protein_type, weight_pounds, method, new Date(serving_time));
                startTimeInfo = {
                    startTime: result.startTime,
                    restTime: result.restTime,
                    bufferMinutes: result.bufferMinutes,
                };
            }
            const markdown = formatCookingGuidanceMarkdown(profile, weight_pounds, targetTemp, pullTemp, doneness, method, timeEstimate, startTimeInfo);
            return { content: [{ type: "text", text: markdown }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_analyze_temperature", "Analyze temperature and get progress/recommendations", {
        current_temp: z.number().describe("Current temperature in °F"),
        target_temp: z.number().describe("Target temperature in °F"),
        protein_type: z.string().describe("Type of protein"),
        previous_readings: z.array(z.object({ temp: z.number(), timestamp: z.string() })).optional(),
    }, async ({ current_temp, target_temp, protein_type, previous_readings }) => {
        try {
            const readings = previous_readings?.map((r) => ({ temp: r.temp, timestamp: new Date(r.timestamp) }));
            const analysis = analyzeTemperature(current_temp, target_temp, protein_type, undefined, undefined, readings);
            const markdown = formatTemperatureAnalysisMarkdown(analysis);
            return { content: [{ type: "text", text: markdown }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_get_target_temperature", "Get target and pull temps for a protein", {
        protein_type: z.string().describe("Type of protein"),
        doneness: z.string().optional().describe("Desired doneness"),
    }, async ({ protein_type, doneness }) => {
        try {
            const { targetTemp, pullTemp, doneness: actualDoneness } = getTargetTemperature(protein_type, doneness);
            const profile = getProteinProfile(protein_type);
            const text = `## ${profile.displayName}\n\n**Target:** ${targetTemp}°F\n**Pull At:** ${pullTemp}°F\n**Doneness:** ${DONENESS_INFO[actualDoneness]?.displayName || actualDoneness}`;
            return { content: [{ type: "text", text }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_list_proteins", "List all supported proteins", { category: z.enum(["all", "beef", "pork", "poultry", "lamb", "seafood"]).default("all") }, async ({ category }) => {
        const proteins = getProteinsByCategory(category);
        const markdown = formatProteinListMarkdown(proteins, category);
        return { content: [{ type: "text", text: markdown }] };
    });
    server.tool("bbq_estimate_cook_time", "Estimate cooking time", {
        protein_type: z.string(),
        weight_pounds: z.number().positive(),
        cook_method: z.string(),
        smoker_temp: z.number().optional(),
    }, async ({ protein_type, weight_pounds, cook_method, smoker_temp }) => {
        try {
            const estimate = estimateCookTime(protein_type, weight_pounds, cook_method, smoker_temp);
            const hours = Math.floor(estimate.totalMinutes / 60);
            const mins = estimate.totalMinutes % 60;
            const text = `**Estimated Time:** ${hours}h ${mins}m\n**Confidence:** ${estimate.confidence}`;
            return { content: [{ type: "text", text }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_detect_stall", "Detect temperature stall", {
        protein_type: z.string(),
        current_temp: z.number(),
        readings: z.array(z.object({ temp: z.number(), timestamp: z.string() })).min(3),
    }, async ({ protein_type, current_temp, readings }) => {
        try {
            const parsedReadings = readings.map((r) => ({ temp: r.temp, timestamp: new Date(r.timestamp) }));
            const result = detectStall(protein_type, current_temp, parsedReadings);
            const markdown = formatStallDetectionMarkdown(result, current_temp);
            return { content: [{ type: "text", text: markdown }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_calculate_rest_time", "Calculate rest time and carryover", {
        protein_type: z.string(),
        current_temp: z.number(),
        target_final_temp: z.number().optional(),
    }, async ({ protein_type, current_temp, target_final_temp }) => {
        try {
            const result = calculateRestTime(protein_type, current_temp, target_final_temp);
            const markdown = formatRestTimeMarkdown(result);
            return { content: [{ type: "text", text: markdown }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
        }
    });
    server.tool("bbq_convert_temperature", "Convert temperature units", {
        temperature: z.number(),
        from_unit: z.enum(["fahrenheit", "celsius"]),
        to_unit: z.enum(["fahrenheit", "celsius"]),
    }, async ({ temperature, from_unit, to_unit }) => {
        const result = convertTemperature(temperature, from_unit, to_unit);
        return { content: [{ type: "text", text: `${temperature}°${from_unit === "fahrenheit" ? "F" : "C"} = ${result}°${to_unit === "fahrenheit" ? "F" : "C"}` }] };
    });
    // ===== THERMOWORKS TOOLS =====
    server.tool("thermoworks_authenticate", "Connect to ThermoWorks Cloud", {
        email: z.string().email(),
        password: z.string(),
        use_legacy_smoke: z.boolean().default(false),
    }, async ({ email, password, use_legacy_smoke }) => {
        try {
            resetThermoWorksClient();
            const client = getThermoWorksClient(use_legacy_smoke);
            await client.authenticate({ email, password });
            const devices = await client.getDevices();
            let text = `## ✅ Connected\n\n**Devices:** ${devices.length}\n`;
            for (const d of devices)
                text += `- ${d.name} (${d.serial})\n`;
            return { content: [{ type: "text", text }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Auth failed";
            return { content: [{ type: "text", text: `❌ ${message}` }], isError: true };
        }
    });
    server.tool("thermoworks_get_live_readings", "Get live temperature readings", { device_serial: z.string().optional() }, async ({ device_serial }) => {
        try {
            const client = getThermoWorksClient();
            if (!client.isAuthenticated()) {
                return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
            }
            const readings = device_serial
                ? [await client.getDeviceReadings(device_serial)].filter(Boolean)
                : await client.getAllReadings();
            if (readings.length === 0)
                return { content: [{ type: "text", text: "No readings" }] };
            let text = `## 🌡️ Readings\n\n`;
            for (const r of readings) {
                if (r) {
                    text += `**${r.name}**\n`;
                    for (const [id, p] of Object.entries(r.probes)) {
                        text += `- Probe ${id}: ${p.temp}°${r.unit}\n`;
                    }
                }
            }
            return { content: [{ type: "text", text }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error";
            return { content: [{ type: "text", text: message }], isError: true };
        }
    });
    server.tool("thermoworks_analyze_live", "Analyze live temp against cooking targets", {
        device_serial: z.string(),
        probe_id: z.string().default("1"),
        protein_type: z.string(),
        target_temp: z.number().optional(),
    }, async ({ device_serial, probe_id, protein_type, target_temp }) => {
        try {
            const client = getThermoWorksClient();
            if (!client.isAuthenticated()) {
                return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
            }
            const reading = await client.getDeviceReadings(device_serial);
            if (!reading)
                return { content: [{ type: "text", text: "No reading" }], isError: true };
            const probe = reading.probes[probe_id];
            if (!probe)
                return { content: [{ type: "text", text: `No probe ${probe_id}` }], isError: true };
            const { targetTemp } = getTargetTemperature(protein_type);
            const target = target_temp || targetTemp;
            const analysis = analyzeTemperature(probe.temp, target, protein_type);
            let text = `## ${getProteinProfile(protein_type).displayName}\n\n`;
            text += `**Current:** ${probe.temp}°${reading.unit} | **Target:** ${target}°F\n`;
            text += `**Progress:** ${analysis.percentComplete}%\n`;
            if (analysis.inStallZone)
                text += `⚠️ In stall zone\n`;
            return { content: [{ type: "text", text }] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Error";
            return { content: [{ type: "text", text: message }], isError: true };
        }
    });
    return server.server;
}
//# sourceMappingURL=smithery.js.map