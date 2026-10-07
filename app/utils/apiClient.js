// Base configuration for API requests
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Allows AuthContext (or any other module) to register a callback that runs
// whenever a request comes back with a 401 (expired/invalid token), so auth
// state can self-correct app-wide instead of drifting out of sync.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
    onUnauthorized = fn;
}

/**
 * A wrapper around native fetch that acts like an Axios instance.
 * Automatically handles JSON parsing, throwing errors for non-2xx responses,
 * and attaching Authorization tokens.
 */
export async function apiClient(endpoint, options = {}) {
    // 1. Get token from localStorage (only available on client side)
    let token = "";
    if (typeof window !== "undefined") {
        token = localStorage.getItem("token");
    }

    // 2. Setup Headers
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // If uploading files, remove Content-Type so browser sets boundary automatically
    if (options.body instanceof FormData) {
        delete headers["Content-Type"];
    }

    // 3. Setup Fetch Config
    const config = {
        ...options,
        headers
    };

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            // Throw an object that looks somewhat like an Axios error
            throw {
                response: {
                    status: response.status,
                    data: data
                },
                message: data?.message || data?.error || `Request failed with status ${response.status}`,
                // 401 is an expected state (logged out / expired token),
                // not a genuine bug — flag it so the catch block below
                // doesn't log it as a hard error.
                silent: response.status === 401
            };
        }

        return data;
    } catch (error) {
        if (error?.silent || error?.response?.status === 401) {
            // Expected auth failure — warn quietly instead of console.error,
            // and notify anyone listening (e.g. AuthContext) so app-wide
            // auth state can self-correct immediately.
            console.warn(`[API Client] Unauthorized (401): ${options.method || 'GET'} ${url}`);
            if (onUnauthorized) onUnauthorized();
        } else if (!options.silent) {
            console.error(`[API Client Error] ${options.method || 'GET'} ${url}`, error);
        }

        // Handle specific "Failed to fetch" errors which usually mean CORS or Server is down
        if (error.message === "Failed to fetch" || error.name === "TypeError") {
            throw new Error("Network error: The server is unreachable. If this is the first request, the server might be waking up. Please try again in 30 seconds.");
        }

        throw error;
    }
}

// Convenience methods
apiClient.get = (url, options = {}) => apiClient(url, { ...options, method: "GET" });
apiClient.post = (url, body, options = {}) => apiClient(url, { ...options, method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) });
apiClient.put = (url, body, options = {}) => apiClient(url, { ...options, method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body) });
apiClient.delete = (url, options = {}) => apiClient(url, { ...options, method: "DELETE" });