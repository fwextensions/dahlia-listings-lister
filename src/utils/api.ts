import { ListingsResponse } from "@/types/listings";

const LISTINGS_API_URL = "https://housing.sfgov.org/api/v1/listings.json";
const LOCAL_LISTINGS_URL = "/listings.json";
const STORAGE_KEY = "housing-listings-data";

/**
 * fetch listings data from the API
 */
export const fetchListings = async (): Promise<ListingsResponse> => {
	console.log("Fetching listings data...", process.env.NODE_ENV);
	try {
		// During development, use the local JSON file
		if (process.env.NODE_ENV === "development") {
			// Fetch the local JSON file from the public directory
			console.log("Fetching local listings data...");
			const response = await fetch(LOCAL_LISTINGS_URL);
			if (!response.ok) {
				throw new Error(`Local file request failed with status ${response.status}`);
			}
			const data = await response.json();
			console.log("Local listings data fetched, first listing:", data.listings[0]);
			
			// Store in localStorage for offline access
			if (typeof window !== "undefined") {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			}
			
			return data as ListingsResponse;
		}
		
		// In production, fetch from the actual API
		console.log("Fetching remote listings data...");
		const response = await fetch(LISTINGS_API_URL);
		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}
		const data = await response.json();
		console.log("Remote listings data fetched:", data);
		
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
				const parsedData = JSON.parse(cachedData);
				console.log("Using cached listings data:", parsedData);
				return parsedData as ListingsResponse;
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
