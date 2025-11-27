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
// ThermoWorks Firebase configuration
// These are public Firebase web app credentials (safe to include in client code)
// They identify the Firebase project but don't grant access without user auth
const THERMOWORKS_FIREBASE_CONFIG = {
    apiKey: "AIzaSyD2yFM0v99PKT6Lk3vvS6mVMYLgnlSJ-80", // ThermoWorks Cloud web API key
    authDomain: "thermoworks-cloud-production.firebaseapp.com",
    databaseURL: "https://thermoworks-cloud-production.firebaseio.com",
    projectId: "thermoworks-cloud-production",
    storageBucket: "thermoworks-cloud-production.appspot.com",
};
// Alternative: ThermoWorks Smoke Gateway (older devices)
const THERMOWORKS_SMOKE_FIREBASE_CONFIG = {
    apiKey: "AIzaSyD5mx6YuRrXxHPghsAKy9BPJh6YH0hNedw",
    authDomain: "smoke-cloud.firebaseapp.com",
    databaseURL: "https://smoke-cloud.firebaseio.com",
    projectId: "smoke-cloud",
};
/**
 * Authenticate with ThermoWorks Cloud using Firebase REST API
 */
export async function authenticateWithThermoWorks(credentials, useSmokeLegacy = false) {
    const config = useSmokeLegacy ? THERMOWORKS_SMOKE_FIREBASE_CONFIG : THERMOWORKS_FIREBASE_CONFIG;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            returnSecureToken: true,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || "Authentication failed";
        // Provide user-friendly error messages
        if (errorMessage.includes("EMAIL_NOT_FOUND")) {
            throw new Error("Email not found. Make sure you're using the email registered with the ThermoWorks app.");
        }
        else if (errorMessage.includes("INVALID_PASSWORD")) {
            throw new Error("Invalid password. Please check your ThermoWorks account password.");
        }
        else if (errorMessage.includes("USER_DISABLED")) {
            throw new Error("This account has been disabled.");
        }
        else if (errorMessage.includes("TOO_MANY_ATTEMPTS")) {
            throw new Error("Too many failed attempts. Please try again later.");
        }
        throw new Error(`Authentication failed: ${errorMessage}`);
    }
    return response.json();
}
/**
 * Refresh an expired ID token
 */
export async function refreshIdToken(refreshToken, useSmokeLegacy = false) {
    const config = useSmokeLegacy ? THERMOWORKS_SMOKE_FIREBASE_CONFIG : THERMOWORKS_FIREBASE_CONFIG;
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    });
    if (!response.ok) {
        throw new Error("Failed to refresh token. Please re-authenticate.");
    }
    const data = await response.json();
    return {
        idToken: data.id_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
    };
}
/**
 * Get list of devices registered to the user
 */
export async function getDevices(idToken, userId, useSmokeLegacy = false) {
    const config = useSmokeLegacy ? THERMOWORKS_SMOKE_FIREBASE_CONFIG : THERMOWORKS_FIREBASE_CONFIG;
    // ThermoWorks stores device data under the user's ID
    const response = await fetch(`${config.databaseURL}/users/${userId}/devices.json?auth=${idToken}`);
    if (!response.ok) {
        throw new Error("Failed to fetch devices. Token may be expired.");
    }
    const data = await response.json();
    if (!data) {
        return [];
    }
    // Convert Firebase object to array
    return Object.entries(data).map(([serial, device]) => {
        const d = device;
        return {
            serial,
            name: d.name || serial,
            type: d.type || "Unknown",
            lastUpdated: new Date(),
        };
    });
}
/**
 * Get current readings for a specific device
 */
export async function getDeviceReadings(idToken, userId, serial, useSmokeLegacy = false) {
    const config = useSmokeLegacy ? THERMOWORKS_SMOKE_FIREBASE_CONFIG : THERMOWORKS_FIREBASE_CONFIG;
    // Device readings are typically stored under a readings or data path
    const response = await fetch(`${config.databaseURL}/users/${userId}/devices/${serial}/readings.json?auth=${idToken}&orderBy="$key"&limitToLast=1`);
    if (!response.ok) {
        throw new Error("Failed to fetch device readings.");
    }
    const data = await response.json();
    if (!data) {
        return null;
    }
    // Get the most recent reading
    const entries = Object.entries(data);
    if (entries.length === 0) {
        return null;
    }
    const [timestamp, reading] = entries[0];
    return {
        serial,
        name: reading.name || serial,
        probes: reading.probes || {},
        timestamp: new Date(parseInt(timestamp)),
        unit: reading.unit || "F",
    };
}
/**
 * Get all device readings for a user
 */
export async function getAllDeviceReadings(idToken, userId, useSmokeLegacy = false) {
    const devices = await getDevices(idToken, userId, useSmokeLegacy);
    const readings = [];
    for (const device of devices) {
        const reading = await getDeviceReadings(idToken, userId, device.serial, useSmokeLegacy);
        if (reading) {
            readings.push(reading);
        }
    }
    return readings;
}
/**
 * Subscribe to real-time temperature updates via Firebase REST streaming
 * Note: This is a simplified version. For production, use the Firebase SDK
 * or implement proper SSE (Server-Sent Events) handling.
 */
export async function subscribeToDeviceUpdates(idToken, userId, serial, onUpdate, useSmokeLegacy = false) {
    const config = useSmokeLegacy ? THERMOWORKS_SMOKE_FIREBASE_CONFIG : THERMOWORKS_FIREBASE_CONFIG;
    // Firebase supports SSE for real-time updates
    const url = `${config.databaseURL}/users/${userId}/devices/${serial}/readings.json?auth=${idToken}`;
    const controller = new AbortController();
    // Note: This requires EventSource or manual SSE handling
    // For MCP server context, we'll use polling instead
    const pollInterval = setInterval(async () => {
        try {
            const reading = await getDeviceReadings(idToken, userId, serial, useSmokeLegacy);
            if (reading) {
                onUpdate(reading);
            }
        }
        catch {
            console.error("Error polling device readings");
        }
    }, 5000); // Poll every 5 seconds
    return {
        unsubscribe: () => {
            clearInterval(pollInterval);
            controller.abort();
        },
    };
}
/**
 * ThermoWorks Cloud Client
 *
 * A stateful client that manages authentication and provides easy access
 * to device data. Handles token refresh automatically.
 */
export class ThermoWorksClient {
    idToken = null;
    refreshToken = null;
    userId = null;
    tokenExpiry = null;
    useSmokeLegacy;
    constructor(useSmokeLegacy = false) {
        this.useSmokeLegacy = useSmokeLegacy;
    }
    /**
     * Authenticate with ThermoWorks Cloud
     */
    async authenticate(credentials) {
        const auth = await authenticateWithThermoWorks(credentials, this.useSmokeLegacy);
        this.idToken = auth.idToken;
        this.refreshToken = auth.refreshToken;
        this.userId = auth.localId;
        this.tokenExpiry = new Date(Date.now() + parseInt(auth.expiresIn) * 1000);
    }
    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return this.idToken !== null && this.userId !== null;
    }
    /**
     * Ensure we have a valid token, refreshing if needed
     */
    async ensureValidToken() {
        if (!this.idToken || !this.refreshToken) {
            throw new Error("Not authenticated. Call authenticate() first.");
        }
        // Refresh token if expired or expiring within 5 minutes
        if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
            const refreshed = await refreshIdToken(this.refreshToken, this.useSmokeLegacy);
            this.idToken = refreshed.idToken;
            this.refreshToken = refreshed.refreshToken;
            this.tokenExpiry = new Date(Date.now() + parseInt(refreshed.expiresIn) * 1000);
        }
    }
    /**
     * Get all devices
     */
    async getDevices() {
        await this.ensureValidToken();
        return getDevices(this.idToken, this.userId, this.useSmokeLegacy);
    }
    /**
     * Get readings for a specific device
     */
    async getDeviceReadings(serial) {
        await this.ensureValidToken();
        return getDeviceReadings(this.idToken, this.userId, serial, this.useSmokeLegacy);
    }
    /**
     * Get all device readings
     */
    async getAllReadings() {
        await this.ensureValidToken();
        return getAllDeviceReadings(this.idToken, this.userId, this.useSmokeLegacy);
    }
    /**
     * Get authentication info for debugging
     */
    getAuthInfo() {
        return {
            userId: this.userId,
            tokenExpiry: this.tokenExpiry,
        };
    }
}
// Export a singleton for convenience in MCP context
let globalClient = null;
export function getThermoWorksClient(useSmokeLegacy = false) {
    if (!globalClient) {
        globalClient = new ThermoWorksClient(useSmokeLegacy);
    }
    return globalClient;
}
export function resetThermoWorksClient() {
    globalClient = null;
}
//# sourceMappingURL=thermoworks.js.map