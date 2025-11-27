/**
 * Cooking Service
 * Core BBQ cooking logic and calculations
 */
import { PROTEIN_PROFILES, COOK_METHOD_INFO, DEFAULT_SMOKER_TEMP, HOT_FAST_TEMP, } from "../constants.js";
/**
 * Get the protein profile for a given protein type
 */
export function getProteinProfile(proteinType) {
    return PROTEIN_PROFILES[proteinType];
}
/**
 * Get the target temperature for a protein at a specific doneness
 */
export function getTargetTemperature(proteinType, doneness) {
    const profile = getProteinProfile(proteinType);
    // Determine the doneness to use
    let actualDoneness;
    if (doneness && profile.donenessTemps[doneness] !== undefined) {
        actualDoneness = doneness;
    }
    else {
        // Use the first available doneness (most common/recommended)
        const availableDoneness = Object.keys(profile.donenessTemps);
        actualDoneness = availableDoneness[0];
    }
    const targetTemp = profile.donenessTemps[actualDoneness] ?? profile.usdaSafeTemp;
    const pullTemp = targetTemp - profile.carryoverDegrees;
    return { targetTemp, pullTemp, doneness: actualDoneness };
}
/**
 * Estimate total cook time
 */
export function estimateCookTime(proteinType, weightPounds, cookMethod, smokerTemp) {
    const profile = getProteinProfile(proteinType);
    const methodInfo = COOK_METHOD_INFO[cookMethod];
    // Get base time per pound for this method
    const baseTimePerPound = profile.estimatedTimePerPound[cookMethod];
    if (baseTimePerPound === 0) {
        return {
            totalMinutes: 0,
            hoursAndMinutes: "Not recommended",
            estimatedDoneTime: new Date(),
            confidence: "low",
            assumptions: [],
            warnings: [`${methodInfo.displayName} is not recommended for ${profile.displayName}`],
        };
    }
    // Adjust for smoker temperature (baseline is 225°F for low/slow, 300°F for hot/fast)
    let tempAdjustment = 1.0;
    const baseTemp = cookMethod.includes("hot_fast") ? HOT_FAST_TEMP : DEFAULT_SMOKER_TEMP;
    if (smokerTemp) {
        // Higher temp = faster cook (roughly 10% faster per 25°F)
        const tempDiff = smokerTemp - baseTemp;
        tempAdjustment = 1 - tempDiff / 250;
        tempAdjustment = Math.max(0.5, Math.min(1.5, tempAdjustment)); // Clamp between 0.5x and 1.5x
    }
    // Calculate base cook time
    let totalMinutes = baseTimePerPound * weightPounds * tempAdjustment;
    // Add time for stall if applicable
    const assumptions = [];
    const warnings = [];
    if (profile.stallRange) {
        totalMinutes += 60; // Add 1 hour buffer for stall
        assumptions.push("Includes ~1 hour buffer for the stall (150-175°F range)");
        assumptions.push("Wrapping can reduce stall time by 30-50%");
    }
    // Add rest time to total timeline
    if (profile.requiresRest && profile.restTimeMinutes > 0) {
        assumptions.push(`Add ${profile.restTimeMinutes} minutes rest time before serving`);
    }
    // Calculate done time
    const estimatedDoneTime = new Date();
    estimatedDoneTime.setMinutes(estimatedDoneTime.getMinutes() + totalMinutes);
    // Determine confidence level
    let confidence = "medium";
    if (profile.stallRange) {
        confidence = "low"; // Stall-prone cooks are unpredictable
        warnings.push("Large cuts with stalls are unpredictable - plan for variability");
    }
    else if (baseTimePerPound > 50) {
        confidence = "medium";
    }
    else {
        confidence = "high";
    }
    // Format hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const hoursAndMinutes = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes` : `${minutes} minutes`;
    return {
        totalMinutes: Math.round(totalMinutes),
        hoursAndMinutes,
        estimatedDoneTime,
        confidence,
        assumptions,
        warnings,
    };
}
/**
 * Calculate when to start cooking to be ready by a target time
 */
export function calculateStartTime(proteinType, weightPounds, cookMethod, targetServingTime, smokerTemp) {
    const profile = getProteinProfile(proteinType);
    const cookTime = estimateCookTime(proteinType, weightPounds, cookMethod, smokerTemp);
    // Add rest time and buffer
    const restTime = profile.restTimeMinutes;
    const bufferMinutes = cookTime.confidence === "low" ? 120 : cookTime.confidence === "medium" ? 60 : 30;
    // Total time needed
    const totalMinutesNeeded = cookTime.totalMinutes + restTime + bufferMinutes;
    // Calculate start time
    const startTime = new Date(targetServingTime);
    startTime.setMinutes(startTime.getMinutes() - totalMinutesNeeded);
    return {
        startTime,
        cookTime,
        restTime,
        bufferMinutes,
    };
}
/**
 * Analyze current temperature progress and provide recommendations
 */
export function analyzeTemperature(currentTemp, targetTemp, proteinType, cookMethod, cookStartTime, previousReadings) {
    const profile = getProteinProfile(proteinType);
    const tempDelta = targetTemp - currentTemp;
    const startingTemp = 40; // Assume refrigerator temp as starting point
    const totalTempRange = targetTemp - startingTemp;
    const tempProgress = currentTemp - startingTemp;
    const percentComplete = Math.min(100, Math.max(0, (tempProgress / totalTempRange) * 100));
    // Determine trend from previous readings
    let trend = "stable";
    let trendRatePerHour = 0;
    if (previousReadings && previousReadings.length >= 2) {
        const recentReadings = previousReadings.slice(-5); // Look at last 5 readings
        const firstReading = recentReadings[0];
        const lastReading = recentReadings[recentReadings.length - 1];
        const tempChange = lastReading.temp - firstReading.temp;
        const timeChange = (lastReading.timestamp.getTime() - firstReading.timestamp.getTime()) / (1000 * 60 * 60); // hours
        if (timeChange > 0) {
            trendRatePerHour = tempChange / timeChange;
            if (Math.abs(trendRatePerHour) < 2) {
                // Less than 2°F/hour
                trend = profile.stallRange && currentTemp >= profile.stallRange.start && currentTemp <= profile.stallRange.end
                    ? "stalled"
                    : "stable";
            }
            else if (trendRatePerHour > 0) {
                trend = "rising";
            }
            else {
                trend = "falling";
            }
        }
    }
    // Check if in stall zone
    const inStallZone = profile.stallRange !== undefined &&
        currentTemp >= profile.stallRange.start &&
        currentTemp <= profile.stallRange.end;
    // Estimate time remaining
    let estimatedMinutesRemaining = null;
    if (trendRatePerHour > 0 && trend === "rising") {
        const hoursRemaining = tempDelta / trendRatePerHour;
        estimatedMinutesRemaining = Math.round(hoursRemaining * 60);
    }
    else if (trend === "stalled") {
        // During stall, estimate based on typical stall duration
        estimatedMinutesRemaining = null; // Can't reliably estimate during stall
    }
    // Generate recommendations
    const recommendations = [];
    if (inStallZone && trend === "stalled") {
        recommendations.push("🛑 You're in the stall zone! Temperature may plateau for 2-4 hours.");
        recommendations.push("💡 Consider wrapping in butcher paper or foil (Texas crutch) to push through faster.");
    }
    else if (inStallZone && trend === "rising") {
        recommendations.push("📈 Temperature is rising through the stall zone - looking good!");
    }
    if (tempDelta <= profile.carryoverDegrees + 5) {
        recommendations.push(`🎯 Getting close! Consider pulling at ${targetTemp - profile.carryoverDegrees}°F to account for carryover.`);
    }
    if (tempDelta <= 0) {
        recommendations.push("✅ Target temperature reached! Time to rest.");
        if (profile.requiresRest) {
            recommendations.push(`⏰ Rest for ${profile.restTimeMinutes} minutes before slicing.`);
        }
    }
    if (trend === "falling") {
        recommendations.push("⚠️ Temperature is dropping - check your heat source!");
        if (cookMethod?.includes("smoke")) {
            recommendations.push("🔥 You may need to add more fuel or adjust airflow.");
        }
    }
    if (percentComplete < 25 && previousReadings && previousReadings.length > 0) {
        recommendations.push("🕐 Still in early stages - patience is key!");
    }
    return {
        currentTemp,
        targetTemp,
        tempDelta,
        percentComplete: Math.round(percentComplete * 10) / 10,
        trend,
        trendRatePerHour: Math.round(trendRatePerHour * 10) / 10,
        estimatedMinutesRemaining,
        inStallZone,
        recommendations,
    };
}
/**
 * Detect if a cook is in a stall
 */
export function detectStall(proteinType, currentTemp, readings) {
    const profile = getProteinProfile(proteinType);
    // Check if this protein type typically stalls
    if (!profile.stallRange) {
        return {
            isStalled: false,
            stallDurationMinutes: 0,
            inStallZone: false,
            recommendation: `${profile.displayName} typically doesn't experience a stall.`,
        };
    }
    const inStallZone = currentTemp >= profile.stallRange.start && currentTemp <= profile.stallRange.end;
    if (!inStallZone) {
        if (currentTemp < profile.stallRange.start) {
            return {
                isStalled: false,
                stallDurationMinutes: 0,
                inStallZone: false,
                recommendation: `Approaching stall zone (${profile.stallRange.start}-${profile.stallRange.end}°F). Be prepared for a plateau.`,
            };
        }
        else {
            return {
                isStalled: false,
                stallDurationMinutes: 0,
                inStallZone: false,
                recommendation: "You've pushed through the stall! Temperature should rise steadily now.",
            };
        }
    }
    // Analyze readings to determine if actually stalled (temp not rising)
    const recentReadings = readings.slice(-6); // Last 6 readings
    if (recentReadings.length < 3) {
        return {
            isStalled: false,
            stallDurationMinutes: 0,
            inStallZone: true,
            recommendation: "In the stall zone but need more readings to confirm stall status.",
        };
    }
    // Calculate temperature change over the readings
    const tempChange = recentReadings[recentReadings.length - 1].temp - recentReadings[0].temp;
    const timeSpanMinutes = (recentReadings[recentReadings.length - 1].timestamp.getTime() -
        recentReadings[0].timestamp.getTime()) /
        (1000 * 60);
    const tempRatePerHour = timeSpanMinutes > 0 ? (tempChange / timeSpanMinutes) * 60 : 0;
    // Consider stalled if temp is rising less than 3°F per hour in the stall zone
    const isStalled = tempRatePerHour < 3;
    // Calculate how long the stall has lasted
    let stallDurationMinutes = 0;
    if (isStalled && readings.length >= 3) {
        // Find when temp first entered stall zone
        for (let i = readings.length - 1; i >= 0; i--) {
            if (readings[i].temp >= profile.stallRange.start && readings[i].temp <= profile.stallRange.end) {
                stallDurationMinutes =
                    (new Date().getTime() - readings[i].timestamp.getTime()) / (1000 * 60);
            }
            else {
                break;
            }
        }
    }
    let recommendation;
    if (isStalled) {
        if (stallDurationMinutes < 60) {
            recommendation =
                "Stall detected! This is normal - evaporative cooling is slowing the temp rise. The stall can last 2-4 hours.";
        }
        else if (stallDurationMinutes < 180) {
            recommendation = `Stall has lasted ${Math.round(stallDurationMinutes)} minutes. Consider wrapping in butcher paper (Texas crutch) to push through faster.`;
        }
        else {
            recommendation = `Extended stall (${Math.round(stallDurationMinutes)} minutes). Wrapping is strongly recommended, or you can ride it out - eventually, it will break through.`;
        }
    }
    else {
        recommendation =
            "In the stall zone but temperature is still rising. Keep monitoring - you may push through without a major plateau.";
    }
    return {
        isStalled,
        stallDurationMinutes: Math.round(stallDurationMinutes),
        inStallZone,
        recommendation,
    };
}
/**
 * Calculate recommended rest time and expected carryover
 */
export function calculateRestTime(proteinType, currentTemp, targetFinalTemp) {
    const profile = getProteinProfile(proteinType);
    const expectedCarryover = profile.carryoverDegrees;
    const expectedFinalTemp = currentTemp + expectedCarryover;
    const recommendedRestMinutes = profile.restTimeMinutes;
    const instructions = [];
    if (!profile.requiresRest) {
        instructions.push(`${profile.displayName} doesn't require significant resting.`);
        instructions.push("Serve immediately for best results.");
    }
    else {
        instructions.push(`Rest for ${recommendedRestMinutes} minutes.`);
        instructions.push(`Temperature will rise approximately ${expectedCarryover}°F during rest.`);
        instructions.push(`Expected final temperature: ${expectedFinalTemp}°F`);
        // Specific resting advice based on protein type
        if (profile.category === "beef" && (proteinType === "beef_brisket" || proteinType === "beef_prime_rib")) {
            instructions.push("For large roasts, rest in a cooler (without ice) wrapped in towels for up to 4 hours.");
        }
        else if (profile.category === "poultry") {
            instructions.push("Rest uncovered or loosely tented to keep skin crispy.");
        }
        else {
            instructions.push("Rest loosely tented with foil to retain heat.");
        }
        if (targetFinalTemp && expectedFinalTemp < targetFinalTemp) {
            const shortfall = targetFinalTemp - expectedFinalTemp;
            instructions.push(`⚠️ Final temp may be ${shortfall}°F below target. Consider pulling a bit later next time.`);
        }
        else if (targetFinalTemp && expectedFinalTemp > targetFinalTemp + 5) {
            instructions.push(`⚠️ Final temp may exceed target. Next time, pull earlier at ${targetFinalTemp - expectedCarryover}°F.`);
        }
    }
    return {
        recommendedRestMinutes,
        expectedCarryover,
        expectedFinalTemp,
        instructions,
    };
}
/**
 * Get cooking tips for a protein type and optional context
 */
export function getCookingTips(proteinType, cookMethod, currentPhase) {
    const profile = getProteinProfile(proteinType);
    const tips = [...profile.tips];
    // Add method-specific tips
    if (cookMethod) {
        const methodInfo = COOK_METHOD_INFO[cookMethod];
        tips.push(`For ${methodInfo.displayName}: Cook at ${methodInfo.tempRange}`);
        if (cookMethod === "reverse_sear") {
            tips.push("Start at 225°F until 10-15°F below target, then sear at high heat for 1-2 minutes per side.");
        }
        else if (cookMethod === "spatchcock") {
            tips.push("Remove backbone with kitchen shears, flatten bird for more even cooking and crispier skin.");
        }
    }
    // Add phase-specific tips
    if (currentPhase) {
        switch (currentPhase) {
            case "prep":
                tips.push("Season liberally - salt enhances flavor and aids bark formation.");
                tips.push("Let meat come to room temperature (30-60 min) for more even cooking.");
                break;
            case "stall":
                tips.push("The stall is caused by evaporative cooling - moisture on the surface keeps temps flat.");
                tips.push("Options: Wrap in butcher paper/foil (Texas crutch) or ride it out.");
                break;
            case "wrapping":
                tips.push("Butcher paper allows some smoke penetration while speeding the cook.");
                tips.push("Foil is faster but can soften the bark.");
                break;
            case "resting":
                tips.push("Don't skip the rest! It allows juices to redistribute.");
                tips.push("Large cuts can rest in a cooler for hours without losing much heat.");
                break;
        }
    }
    return tips;
}
/**
 * Convert temperature between units
 */
export function convertTemperature(temp, fromUnit, toUnit) {
    if (fromUnit === toUnit)
        return temp;
    if (fromUnit === "fahrenheit" && toUnit === "celsius") {
        return Math.round(((temp - 32) * 5) / 9 * 10) / 10;
    }
    else {
        return Math.round((temp * 9) / 5 + 32);
    }
}
/**
 * Format a time estimate for display
 */
export function formatTimeEstimate(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minutes`;
}
/**
 * Get the recommended cook method for a protein type
 */
export function getRecommendedCookMethod(proteinType) {
    const profile = getProteinProfile(proteinType);
    return profile.recommendedMethods[0];
}
//# sourceMappingURL=cooking.js.map