#!/usr/bin/env node
/**
 * BBQ MCP Server Demo
 * 
 * This script demonstrates the cooking logic without needing MCP infrastructure.
 * Run with: node demo.js
 */

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
} from './dist/services/cooking.js';

import { PROTEIN_PROFILES, COOK_METHOD_INFO } from './dist/constants.js';

console.log('🍖 BBQ MCP Server Demo\n');
console.log('='.repeat(60) + '\n');

// Demo 1: Cooking Guidance for a Brisket
console.log('📋 DEMO 1: Brisket Cooking Guidance');
console.log('-'.repeat(40));

const brisketProfile = getProteinProfile('beef_brisket');
const brisketTemp = getTargetTemperature('beef_brisket', 'pullable');
const brisketTime = estimateCookTime('beef_brisket', 14, 'smoke_low_slow', 225);

console.log(`Protein: ${brisketProfile.displayName}`);
console.log(`Weight: 14 lbs`);
console.log(`Method: Low & Slow Smoke at 225°F`);
console.log(`\nTemperatures:`);
console.log(`  Target: ${brisketTemp.targetTemp}°F (${brisketTemp.doneness})`);
console.log(`  Pull at: ${brisketTemp.pullTemp}°F (accounts for ${brisketProfile.carryoverDegrees}°F carryover)`);
console.log(`  USDA Safe: ${brisketProfile.usdaSafeTemp}°F`);
console.log(`\nTime Estimate:`);
console.log(`  Cook time: ${brisketTime.hoursAndMinutes}`);
console.log(`  Confidence: ${brisketTime.confidence}`);
console.log(`  Rest time: ${brisketProfile.restTimeMinutes} minutes`);
console.log(`\nStall Warning: ${brisketProfile.stallRange.start}-${brisketProfile.stallRange.end}°F`);
console.log('\n');

// Demo 2: Timeline Planning
console.log('📅 DEMO 2: Timeline Planning');
console.log('-'.repeat(40));

const servingTime = new Date();
servingTime.setHours(18, 0, 0, 0); // 6 PM today
if (servingTime < new Date()) {
  servingTime.setDate(servingTime.getDate() + 1); // Tomorrow if past 6 PM
}

const timeline = calculateStartTime('beef_brisket', 14, 'smoke_low_slow', servingTime, 225);

console.log(`Target serving time: ${servingTime.toLocaleString()}`);
console.log(`\nRecommended Timeline:`);
console.log(`  Start cooking: ${timeline.startTime.toLocaleString()}`);
console.log(`  Estimated cook: ${timeline.cookTime.hoursAndMinutes}`);
console.log(`  Rest period: ${timeline.restTime} minutes`);
console.log(`  Buffer time: ${timeline.bufferMinutes} minutes (for variability)`);
console.log('\n');

// Demo 3: Temperature Analysis Mid-Cook
console.log('🌡️ DEMO 3: Temperature Analysis (Mid-Cook)');
console.log('-'.repeat(40));

const readings = [
  { temp: 145, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { temp: 155, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { temp: 162, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { temp: 165, timestamp: new Date() },
];

const analysis = analyzeTemperature(165, 203, 'beef_brisket', 'smoke_low_slow', undefined, readings);

console.log(`Current: ${analysis.currentTemp}°F → Target: ${analysis.targetTemp}°F`);
console.log(`Progress: ${analysis.percentComplete}%`);
console.log(`Remaining: ${analysis.tempDelta}°F to go`);
console.log(`\nTrend: ${analysis.trend} (${analysis.trendRatePerHour > 0 ? '+' : ''}${analysis.trendRatePerHour}°F/hour)`);
console.log(`In Stall Zone: ${analysis.inStallZone ? 'YES ⚠️' : 'No'}`);
if (analysis.estimatedMinutesRemaining) {
  const hours = Math.floor(analysis.estimatedMinutesRemaining / 60);
  const mins = analysis.estimatedMinutesRemaining % 60;
  console.log(`ETA: ~${hours}h ${mins}m remaining`);
}
console.log(`\nRecommendations:`);
for (const rec of analysis.recommendations) {
  console.log(`  ${rec}`);
}
console.log('\n');

// Demo 4: Stall Detection
console.log('🛑 DEMO 4: Stall Detection');
console.log('-'.repeat(40));

const stallReadings = [
  { temp: 155, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { temp: 156, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { temp: 156, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { temp: 157, timestamp: new Date() },
];

const stallResult = detectStall('beef_brisket', 157, stallReadings);

console.log(`Current Temp: 157°F`);
console.log(`In Stall Zone: ${stallResult.inStallZone ? 'Yes' : 'No'}`);
console.log(`Stalled: ${stallResult.isStalled ? 'YES 🛑' : 'No'}`);
if (stallResult.isStalled) {
  console.log(`Stall Duration: ${stallResult.stallDurationMinutes} minutes`);
}
console.log(`\nRecommendation: ${stallResult.recommendation}`);
console.log('\n');

// Demo 5: Rest Time Calculation
console.log('😴 DEMO 5: Rest Time Calculation');
console.log('-'.repeat(40));

const restResult = calculateRestTime('beef_prime_rib', 120, 130);

console.log(`Pulled at: 120°F`);
console.log(`Target Final: 130°F (medium-rare)`);
console.log(`\nRest Time: ${restResult.recommendedRestMinutes} minutes`);
console.log(`Expected Carryover: +${restResult.expectedCarryover}°F`);
console.log(`Expected Final Temp: ${restResult.expectedFinalTemp}°F`);
console.log(`\nInstructions:`);
for (const inst of restResult.instructions) {
  console.log(`  - ${inst}`);
}
console.log('\n');

// Demo 6: Quick Reference - All Beef Cuts
console.log('🥩 DEMO 6: Supported Beef Cuts');
console.log('-'.repeat(40));

const beefProteins = Object.values(PROTEIN_PROFILES).filter(p => p.category === 'beef');
for (const protein of beefProteins) {
  const temps = getTargetTemperature(protein.type);
  console.log(`${protein.displayName}: ${temps.targetTemp}°F (pull at ${temps.pullTemp}°F)`);
}
console.log('\n');

// Demo 7: Temperature Conversion
console.log('🔄 DEMO 7: Temperature Conversion');
console.log('-'.repeat(40));

const temps = [145, 165, 203, 225];
for (const f of temps) {
  const c = convertTemperature(f, 'fahrenheit', 'celsius');
  console.log(`${f}°F = ${c}°C`);
}
console.log('\n');

console.log('='.repeat(60));
console.log('✅ Demo complete! The BBQ MCP Server is ready to help you cook.');
console.log('\nTo use with an MCP client, add to your config:');
console.log(JSON.stringify({
  "mcpServers": {
    "bbq": {
      "command": "node",
      "args": ["<path>/bbq-mcp-server/dist/index.js"]
    }
  }
}, null, 2));
