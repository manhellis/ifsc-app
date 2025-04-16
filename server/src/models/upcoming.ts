import { getDb } from "../db";

// Create a cache using a Map where the key is a string (based on URL and options)
// and the value contains the timestamp when the data was cached and the cached data.
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

const apiWrapper = async (url: string, options: RequestInit) => {
    // Create a cache key based on URL and options. Adjust if needed.
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    // Check if we have a cached value that is still valid.
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        // Return cached data if within TTL.
        return cached.data;
    }

    // No valid cache exists, so perform the API request.
    const headers = {
        ...options.headers,
        Referer: "https://ifsc.results.info",
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    // Cache the fresh response with a current timestamp.
    cache.set(cacheKey, { timestamp: Date.now(), data });
    console.log(`Cache refreshed for: ${url}`);
    return data;
};

export const getRegistrationActive = async (id: number) => {
    const registrations = await apiWrapper(
        `https://ifsc.results.info/api/v1/events/${id}/registrations/`,
        {
            method: "GET",
        }
    );
    return registrations;
};
