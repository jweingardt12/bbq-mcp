/**
 * Authentication-related Zod schemas for ThermoWorks integration
 */
import { z } from "zod";
/**
 * Schema for authenticating with ThermoWorks Cloud
 */
export declare const AuthenticateSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    use_legacy_smoke: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password: string;
    use_legacy_smoke: boolean;
}, {
    email: string;
    password: string;
    use_legacy_smoke?: boolean | undefined;
}>;
export type AuthenticateInput = z.infer<typeof AuthenticateSchema>;
/**
 * Schema for getting connected devices
 */
export declare const GetDevicesSchema: z.ZodObject<{
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
}, {
    response_format?: "markdown" | "json" | undefined;
}>;
export type GetDevicesInput = z.infer<typeof GetDevicesSchema>;
/**
 * Schema for getting live device readings
 */
export declare const GetLiveReadingsSchema: z.ZodObject<{
    device_serial: z.ZodOptional<z.ZodString>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    response_format: "markdown" | "json";
    device_serial?: string | undefined;
}, {
    response_format?: "markdown" | "json" | undefined;
    device_serial?: string | undefined;
}>;
export type GetLiveReadingsInput = z.infer<typeof GetLiveReadingsSchema>;
/**
 * Schema for analyzing live temperature from connected device
 */
export declare const AnalyzeLiveTemperatureSchema: z.ZodObject<{
    device_serial: z.ZodString;
    probe_id: z.ZodDefault<z.ZodString>;
    protein_type: z.ZodString;
    target_temp: z.ZodOptional<z.ZodNumber>;
    response_format: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
}, "strict", z.ZodTypeAny, {
    protein_type: string;
    response_format: "markdown" | "json";
    probe_id: string;
    device_serial: string;
    target_temp?: number | undefined;
}, {
    protein_type: string;
    device_serial: string;
    response_format?: "markdown" | "json" | undefined;
    target_temp?: number | undefined;
    probe_id?: string | undefined;
}>;
export type AnalyzeLiveTemperatureInput = z.infer<typeof AnalyzeLiveTemperatureSchema>;
/**
 * Schema for checking authentication status
 */
export declare const CheckAuthStatusSchema: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
export type CheckAuthStatusInput = z.infer<typeof CheckAuthStatusSchema>;
//# sourceMappingURL=auth.d.ts.map