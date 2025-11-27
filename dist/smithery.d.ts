/**
 * BBQ MCP Server - Smithery-compatible Entry Point
 */
import { z } from "zod";
/**
 * Configuration schema for Smithery deployment
 */
export declare const configSchema: z.ZodObject<{
    thermoworksEmail: z.ZodOptional<z.ZodString>;
    thermoworksPassword: z.ZodOptional<z.ZodString>;
    useLegacySmoke: z.ZodDefault<z.ZodBoolean>;
    defaultTempUnit: z.ZodDefault<z.ZodEnum<["fahrenheit", "celsius"]>>;
}, "strip", z.ZodTypeAny, {
    useLegacySmoke: boolean;
    defaultTempUnit: "fahrenheit" | "celsius";
    thermoworksEmail?: string | undefined;
    thermoworksPassword?: string | undefined;
}, {
    thermoworksEmail?: string | undefined;
    thermoworksPassword?: string | undefined;
    useLegacySmoke?: boolean | undefined;
    defaultTempUnit?: "fahrenheit" | "celsius" | undefined;
}>;
export type ServerConfig = z.infer<typeof configSchema>;
/**
 * Create and configure the BBQ MCP Server for Smithery
 */
export default function createServer({ config }: {
    config: ServerConfig;
}): import("@modelcontextprotocol/sdk/server").Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}>;
//# sourceMappingURL=smithery.d.ts.map