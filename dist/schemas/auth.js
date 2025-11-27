/**
 * Authentication-related Zod schemas for ThermoWorks integration
 */
import { z } from "zod";
import { ResponseFormatSchema } from "./index.js";
/**
 * Schema for authenticating with ThermoWorks Cloud
 */
export const AuthenticateSchema = z
    .object({
    email: z
        .string()
        .email()
        .describe("Email address used for your ThermoWorks account (same as in the ThermoWorks app)"),
    password: z
        .string()
        .min(6)
        .describe("Password for your ThermoWorks account"),
    use_legacy_smoke: z
        .boolean()
        .default(false)
        .describe("Set to true if using older Smoke Gateway devices (pre-2022). Default false for newer ThermoWorks Cloud devices."),
})
    .strict();
/**
 * Schema for getting connected devices
 */
export const GetDevicesSchema = z
    .object({
    response_format: ResponseFormatSchema.describe("Output format"),
})
    .strict();
/**
 * Schema for getting live device readings
 */
export const GetLiveReadingsSchema = z
    .object({
    device_serial: z
        .string()
        .optional()
        .describe("Serial number of specific device to query. If not provided, returns readings from all devices."),
    response_format: ResponseFormatSchema.describe("Output format"),
})
    .strict();
/**
 * Schema for analyzing live temperature from connected device
 */
export const AnalyzeLiveTemperatureSchema = z
    .object({
    device_serial: z
        .string()
        .describe("Serial number of the device to analyze"),
    probe_id: z
        .string()
        .default("1")
        .describe("Probe number to analyze (e.g., '1', '2', '3', '4' for Signals)"),
    protein_type: z
        .string()
        .describe("Type of protein being cooked (e.g., 'beef_brisket')"),
    target_temp: z
        .number()
        .optional()
        .describe("Target temperature. If not provided, uses recommended temp for the protein."),
    response_format: ResponseFormatSchema.describe("Output format"),
})
    .strict();
/**
 * Schema for checking authentication status
 */
export const CheckAuthStatusSchema = z.object({}).strict();
//# sourceMappingURL=auth.js.map