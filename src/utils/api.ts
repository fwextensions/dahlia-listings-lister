import type { ListingsResponse } from "@/types/listings";

const LISTINGS_API_URL = "/api/listings";
const STORAGE_KEY = "housing-listings-data";

// memoize localStorage snapshot to avoid repeated reads during re-renders
let __cachedSnapshot: ListingsResponse | null = null;
let __didInitFromLocalStorage = false;

/**
 * get listings data from localStorage if available
 */
export const getCachedListings = (): ListingsResponse | null => {
	if (typeof window === "undefined") return null;

	// return memoized result if we've already attempted initialization
	if (__didInitFromLocalStorage) {
		return __cachedSnapshot;
	}

	const cachedData = localStorage.getItem(STORAGE_KEY);
	if (cachedData) {
		try {
			if (process.env.NODE_ENV !== "production") {
				console.log("Using cached listings data from localStorage");
			}
			__cachedSnapshot = JSON.parse(cachedData) as ListingsResponse;
		} catch (error) {
			console.error("Error parsing cached listings data:", error);
			__cachedSnapshot = null;
		}
	}

	__didInitFromLocalStorage = true;
	return __cachedSnapshot;
};

/**
 * store listings data in localStorage
 */
export const cacheListings = (data: ListingsResponse): void => {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		console.log("Listings data cached to localStorage");
		// update memoized snapshot for subsequent reads
		__cachedSnapshot = data;
		__didInitFromLocalStorage = true;
	} catch (error) {
		console.error("Error caching listings data:", error);
	}
};

/**
 * fetch fresh listings data from the API
 */
export const fetchListings = async (): Promise<ListingsResponse> => {
	console.log("Fetching fresh listings data...");
	try {
		// Fetch from our Next.js API route that proxies the request
		console.log("Fetching listings via API route");
		const response = await fetch(LISTINGS_API_URL);
		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}
		const data = await response.json();
		console.log("Fresh listings data fetched successfully");

		// Store in localStorage for offline access
		cacheListings(data);

		return data as ListingsResponse;
	} catch (error) {
		console.error("Error fetching listings:", error);

		// Try to get data from localStorage if API request fails
		const cachedData = getCachedListings();
		if (cachedData) {
			return cachedData;
		}

		throw error;
	}
};
