import { ListingsResponse } from "@/types/listings";

const LISTINGS_API_URL = "/api/listings";
const STORAGE_KEY = "housing-listings-data";

/**
 * get listings data from localStorage if available
 */
export const getCachedListings = (): ListingsResponse | null => {
	if (typeof window === "undefined") return null;
	
	const cachedData = localStorage.getItem(STORAGE_KEY);
	if (cachedData) {
		try {
			console.log("Using cached listings data from localStorage");
			return JSON.parse(cachedData) as ListingsResponse;
		} catch (error) {
			console.error("Error parsing cached listings data:", error);
			return null;
		}
	}
	return null;
};

/**
 * store listings data in localStorage
 */
export const cacheListings = (data: ListingsResponse): void => {
	if (typeof window === "undefined") return;
	
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		console.log("Listings data cached to localStorage");
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
