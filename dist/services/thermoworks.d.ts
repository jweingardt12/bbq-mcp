/**
 * ThermoWorks Cloud Service
 *
 * Handles authentication and data retrieval from ThermoWorks Cloud.
 * ThermoWorks uses Firebase as their backend, so we use the Firebase REST API
 * for authentication and real-time database access.
 *
 * AUTHENTICATION FLOW:
 * 1. User provides their ThermoWorks account email/password
 * 2. We authenticate via Firebase REST API using ThermoWorks' Firebase project
 * 3. We receive an ID token that grants access to user's device data
 * 4. We can then query the Firebase Realtime Database for device readings
 *
 * SECURITY CONSIDERATIONS:
 * - Credentials are only used for authentication, never stored
 * - ID tokens expire after 1 hour and can be refreshed
 * - All communication is over HTTPS
 * - Users should use environment variables for credentials in production
 */
export interface ThermoWorksCredentials {
    email: string;
    password: string;
}
export interface FirebaseAuthResponse {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}
export interface ThermoWorksDevice {
    serial: string;
    name: string;
    type: string;
    lastUpdated: Date;
}
export interface ProbeData {
    temp: number;
    alarm_high: number | null;
    alarm_low: number | null;
    name: string;
}
export interface DeviceReading {
    serial: string;
    name: string;
    probes: Record<string, ProbeData>;
    timestamp: Date;
    unit: "F" | "C";
}
/**
 * Authenticate with ThermoWorks Cloud using Firebase REST API
 */
export declare function authenticateWithThermoWorks(credentials: ThermoWorksCredentials, useSmokeLegacy?: boolean): Promise<FirebaseAuthResponse>;
/**
 * Refresh an expired ID token
 */
export declare function refreshIdToken(refreshToken: string, useSmokeLegacy?: boolean): Promise<{
    idToken: string;
    refreshToken: string;
    expiresIn: string;
}>;
/**
 * Get list of devices registered to the user
 */
export declare function getDevices(idToken: string, userId: string, useSmokeLegacy?: boolean): Promise<ThermoWorksDevice[]>;
/**
 * Get current readings for a specific device
 */
export declare function getDeviceReadings(idToken: string, userId: string, serial: string, useSmokeLegacy?: boolean): Promise<DeviceReading | null>;
/**
 * Get all device readings for a user
 */
export declare function getAllDeviceReadings(idToken: string, userId: string, useSmokeLegacy?: boolean): Promise<DeviceReading[]>;
/**
 * Subscribe to real-time temperature updates via Firebase REST streaming
 * Note: This is a simplified version. For production, use the Firebase SDK
 * or implement proper SSE (Server-Sent Events) handling.
 */
export declare function subscribeToDeviceUpdates(idToken: string, userId: string, serial: string, onUpdate: (reading: DeviceReading) => void, useSmokeLegacy?: boolean): Promise<{
    unsubscribe: () => void;
}>;
/**
 * ThermoWorks Cloud Client
 *
 * A stateful client that manages authentication and provides easy access
 * to device data. Handles token refresh automatically.
 */
export declare class ThermoWorksClient {
    private idToken;
    private refreshToken;
    private userId;
    private tokenExpiry;
    private useSmokeLegacy;
    constructor(useSmokeLegacy?: boolean);
    /**
     * Authenticate with ThermoWorks Cloud
     */
    authenticate(credentials: ThermoWorksCredentials): Promise<void>;
    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Ensure we have a valid token, refreshing if needed
     */
    private ensureValidToken;
    /**
     * Get all devices
     */
    getDevices(): Promise<ThermoWorksDevice[]>;
    /**
     * Get readings for a specific device
     */
    getDeviceReadings(serial: string): Promise<DeviceReading | null>;
    /**
     * Get all device readings
     */
    getAllReadings(): Promise<DeviceReading[]>;
    /**
     * Get authentication info for debugging
     */
    getAuthInfo(): {
        userId: string | null;
        tokenExpiry: Date | null;
    };
}
export declare function getThermoWorksClient(useSmokeLegacy?: boolean): ThermoWorksClient;
export declare function resetThermoWorksClient(): void;
//# sourceMappingURL=thermoworks.d.ts.map