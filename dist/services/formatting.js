/**
 * Formatting Service
 * Handles response formatting for both Markdown and JSON outputs
 */
import { PROTEIN_PROFILES, COOK_METHOD_INFO, DONENESS_INFO } from "../constants.js";
/**
 * Format cooking guidance as Markdown
 */
export function formatCookingGuidanceMarkdown(profile, weightPounds, targetTemp, pullTemp, doneness, cookMethod, estimate, startTime) {
    const methodInfo = COOK_METHOD_INFO[cookMethod];
    const donenessInfo = DONENESS_INFO[doneness];
    let output = `## 🍖 Cooking Guide: ${profile.displayName}\n\n`;
    output += `**Weight:** ${weightPounds} lbs\n`;
    output += `**Method:** ${methodInfo.displayName} (${methodInfo.tempRange})\n`;
    output += `**Target Doneness:** ${donenessInfo.displayName} - ${donenessInfo.description}\n\n`;
    output += `### 🎯 Temperature Targets\n\n`;
    output += `- **Target Internal Temp:** ${targetTemp}°F\n`;
    output += `- **Pull Temperature:** ${pullTemp}°F (accounts for ${profile.carryoverDegrees}°F carryover)\n`;
    output += `- **USDA Safe Minimum:** ${profile.usdaSafeTemp}°F\n\n`;
    output += `### ⏱️ Time Estimate\n\n`;
    output += `**Estimated Cook Time:** ${estimate.hoursAndMinutes}\n`;
    output += `**Confidence:** ${estimate.confidence.charAt(0).toUpperCase() + estimate.confidence.slice(1)}\n\n`;
    if (estimate.assumptions.length > 0) {
        output += `**Notes:**\n`;
        for (const assumption of estimate.assumptions) {
            output += `- ${assumption}\n`;
        }
        output += "\n";
    }
    if (estimate.warnings.length > 0) {
        output += `**⚠️ Warnings:**\n`;
        for (const warning of estimate.warnings) {
            output += `- ${warning}\n`;
        }
        output += "\n";
    }
    if (startTime) {
        output += `### 📅 Timeline\n\n`;
        output += `- **Start Cooking:** ${formatDateTime(startTime.startTime)}\n`;
        output += `- **Rest Time:** ${startTime.restTime} minutes\n`;
        output += `- **Buffer:** ${startTime.bufferMinutes} minutes (for variability)\n\n`;
    }
    if (profile.requiresRest) {
        output += `### 😴 Resting\n\n`;
        output += `Rest for **${profile.restTimeMinutes} minutes** before slicing.\n`;
        output += `Temperature will rise approximately ${profile.carryoverDegrees}°F during rest.\n\n`;
    }
    if (profile.stallRange) {
        output += `### 🛑 Stall Warning\n\n`;
        output += `This cut typically stalls between **${profile.stallRange.start}-${profile.stallRange.end}°F**.\n`;
        output += `The stall can last 2-4 hours. Consider wrapping to push through faster.\n\n`;
    }
    output += `### 💡 Tips\n\n`;
    for (const tip of profile.tips.slice(0, 5)) {
        output += `- ${tip}\n`;
    }
    return output;
}
/**
 * Format temperature analysis as Markdown
 */
export function formatTemperatureAnalysisMarkdown(analysis) {
    let output = `## 🌡️ Temperature Analysis\n\n`;
    output += `**Current:** ${analysis.currentTemp}°F → **Target:** ${analysis.targetTemp}°F\n`;
    output += `**Progress:** ${analysis.percentComplete}% complete\n`;
    output += `**Remaining:** ${analysis.tempDelta}°F to go\n\n`;
    const trendEmoji = analysis.trend === "rising"
        ? "📈"
        : analysis.trend === "falling"
            ? "📉"
            : analysis.trend === "stalled"
                ? "⏸️"
                : "➡️";
    output += `### Trend: ${trendEmoji} ${analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)}\n\n`;
    if (analysis.trendRatePerHour !== 0) {
        output += `**Rate:** ${analysis.trendRatePerHour > 0 ? "+" : ""}${analysis.trendRatePerHour}°F/hour\n`;
    }
    if (analysis.estimatedMinutesRemaining !== null) {
        const hours = Math.floor(analysis.estimatedMinutesRemaining / 60);
        const minutes = analysis.estimatedMinutesRemaining % 60;
        const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        output += `**ETA:** ~${timeString} remaining\n`;
    }
    else if (analysis.inStallZone) {
        output += `**ETA:** Cannot estimate during stall\n`;
    }
    if (analysis.inStallZone) {
        output += `\n⚠️ **Currently in the stall zone!**\n`;
    }
    if (analysis.recommendations.length > 0) {
        output += `\n### Recommendations\n\n`;
        for (const rec of analysis.recommendations) {
            output += `${rec}\n`;
        }
    }
    return output;
}
/**
 * Format protein list as Markdown
 */
export function formatProteinListMarkdown(proteins, category) {
    const categoryDisplay = category === "all" ? "All Proteins" : `${category?.charAt(0).toUpperCase()}${category?.slice(1)}`;
    let output = `## 🥩 ${categoryDisplay}\n\n`;
    // Group by category
    const grouped = proteins.reduce((acc, protein) => {
        if (!acc[protein.category]) {
            acc[protein.category] = [];
        }
        acc[protein.category].push(protein);
        return acc;
    }, {});
    for (const [cat, prots] of Object.entries(grouped)) {
        output += `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`;
        for (const protein of prots) {
            const doneness = Object.keys(protein.donenessTemps)[0];
            const temp = protein.donenessTemps[doneness];
            output += `**${protein.displayName}** (\`${protein.type}\`)\n`;
            output += `- Target: ${temp}°F (${DONENESS_INFO[doneness]?.displayName || doneness})\n`;
            output += `- Methods: ${protein.recommendedMethods.map((m) => COOK_METHOD_INFO[m].displayName).join(", ")}\n`;
            if (protein.stallRange) {
                output += `- ⚠️ Stalls at ${protein.stallRange.start}-${protein.stallRange.end}°F\n`;
            }
            output += "\n";
        }
    }
    return output;
}
/**
 * Format stall detection result as Markdown
 */
export function formatStallDetectionMarkdown(result, currentTemp) {
    let output = `## 🛑 Stall Analysis\n\n`;
    output += `**Current Temperature:** ${currentTemp}°F\n`;
    output += `**In Stall Zone:** ${result.inStallZone ? "Yes" : "No"}\n`;
    output += `**Stalled:** ${result.isStalled ? "Yes" : "No"}\n`;
    if (result.isStalled) {
        output += `**Stall Duration:** ${result.stallDurationMinutes} minutes\n`;
    }
    output += `\n### Recommendation\n\n${result.recommendation}\n`;
    if (result.isStalled) {
        output += `\n### Options to Push Through\n\n`;
        output += `1. **Wrap (Texas Crutch):** Wrap in butcher paper or foil to trap moisture and speed cooking\n`;
        output += `2. **Increase Heat:** Bump smoker to 275-300°F temporarily\n`;
        output += `3. **Ride It Out:** Be patient - stall will eventually break\n`;
    }
    return output;
}
/**
 * Format rest time calculation as Markdown
 */
export function formatRestTimeMarkdown(result) {
    let output = `## 😴 Rest Time Guide\n\n`;
    output += `**Recommended Rest:** ${result.recommendedRestMinutes} minutes\n`;
    output += `**Expected Carryover:** +${result.expectedCarryover}°F\n`;
    output += `**Expected Final Temp:** ${result.expectedFinalTemp}°F\n\n`;
    output += `### Instructions\n\n`;
    for (const instruction of result.instructions) {
        output += `- ${instruction}\n`;
    }
    return output;
}
/**
 * Format device reading simulation as Markdown
 */
export function formatDeviceReadingMarkdown(deviceType, probeReadings, analysis) {
    let output = `## 📱 ThermoWorks ${deviceType} Reading\n\n`;
    for (const probe of probeReadings) {
        const name = probe.name || probe.probe_id;
        output += `**${name}:** ${probe.temperature}°F\n`;
    }
    if (analysis) {
        output += `\n---\n\n`;
        output += formatTemperatureAnalysisMarkdown(analysis);
    }
    return output;
}
/**
 * Format cooking tips as Markdown
 */
export function formatTipsMarkdown(tips, proteinType) {
    const profile = PROTEIN_PROFILES[proteinType];
    let output = `## 💡 Cooking Tips: ${profile.displayName}\n\n`;
    for (const tip of tips) {
        output += `- ${tip}\n`;
    }
    return output;
}
/**
 * Format target temperature info as Markdown
 */
export function formatTargetTempMarkdown(profile, targetTemp, pullTemp, doneness) {
    const donenessInfo = DONENESS_INFO[doneness];
    let output = `## 🎯 Target Temperature: ${profile.displayName}\n\n`;
    output += `**Doneness:** ${donenessInfo.displayName}\n`;
    output += `**Description:** ${donenessInfo.description}\n\n`;
    output += `### Temperatures\n\n`;
    output += `- **Target Internal:** ${targetTemp}°F\n`;
    output += `- **Pull At:** ${pullTemp}°F (${profile.carryoverDegrees}°F carryover)\n`;
    output += `- **USDA Safe Minimum:** ${profile.usdaSafeTemp}°F\n\n`;
    // Show all available doneness levels
    output += `### All Doneness Options\n\n`;
    for (const [level, temp] of Object.entries(profile.donenessTemps)) {
        const info = DONENESS_INFO[level];
        const marker = level === doneness ? " ← Selected" : "";
        output += `- **${info?.displayName || level}:** ${temp}°F${marker}\n`;
    }
    return output;
}
/**
 * Helper to format date/time
 */
function formatDateTime(date) {
    return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}
//# sourceMappingURL=formatting.js.map