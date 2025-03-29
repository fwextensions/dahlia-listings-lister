import { ListingsResponse } from "@/types/listings";

const LISTINGS_API_URL = "/api/listings";
const STORAGE_KEY = "housing-listings-data";

/**
 * fetch listings data from the API
 */
export const fetchListings = async (): Promise<ListingsResponse> => {
	console.log("Fetching listings data...");
	try {
		// Fetch from our Next.js API route that proxies the request
		console.log("Fetching listings via API route");
		const response = await fetch(LISTINGS_API_URL);
		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}
		const data = await response.json();
		console.log("Listings data fetched successfully");
		
		// Store in localStorage for offline access
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		}
		
		return data as ListingsResponse;
	} catch (error) {
		console.error("Error fetching listings:", error);
		
		// Try to get data from localStorage if API request fails
		if (typeof window !== "undefined") {
			const cachedData = localStorage.getItem(STORAGE_KEY);
			if (cachedData) {
				console.log("Using cached listings data from localStorage");
				return JSON.parse(cachedData) as ListingsResponse;
			}
		}
		
		throw error;
	}
};

/**
 * get listings data from localStorage if available
 */
export const getLocalStorageListings = (): ListingsResponse | null => {
	if (typeof window === "undefined") return null;
	
	const cachedData = localStorage.getItem(STORAGE_KEY);
	if (cachedData) {
		try {
			const parsedData = JSON.parse(cachedData);
			console.log("Retrieved listings data from localStorage:", parsedData);
			return parsedData as ListingsResponse;
		} catch (error) {
			console.error("Error parsing cached listings data:", error);
			return null;
		}
	}
	
	return null;
};
