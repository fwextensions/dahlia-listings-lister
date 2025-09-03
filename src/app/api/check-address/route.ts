// File: src/app/api/check-address/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface ApiError {
	message: string;
}

interface GisData {
	boundary_match: boolean | null;
	address?: string;
	location?: {
		x: number; // Web Mercator meters (EPSG:3857)
		y: number; // Web Mercator meters (EPSG:3857)
	};
	extent?: {
		xmin: number;
		ymin: number;
		xmax: number;
		ymax: number;
	};
}

interface ExternalApiResponse {
	gis_data?: GisData;
	// Add other top-level fields if needed
}

interface ApiResponse {
	isMatch: boolean;
	message: string;
	lat?: number;
	lng?: number;
	viewport?: { north: number; south: number; east: number; west: number };
}

// minimal shape of Google Geocoding API response used in this route
interface GoogleGeocodingResponse {
	status: string;
	results: Array<{
		geometry?: {
			location?: { lat: number; lng: number };
			viewport?: {
				northeast?: { lat: number; lng: number };
				southwest?: { lat: number; lng: number };
			};
		};
	}>;
}

// convert Web Mercator (EPSG:3857) meters to WGS84 lat/lng (EPSG:4326)
const webMercatorToLatLng = (x: number, y: number): { lat: number; lng: number } => {
	const R = 6378137;
	const lng = (x / R) * (180 / Math.PI);
	const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
	return { lat, lng };
};

// Define interfaces for expected request body structure
interface RequestAddress {
	address1: string;
	city: string;
	state: string;
	zip: string;
}

interface RequestListing {
	Id: string;
	Name: string;
	Project_ID?: string;
}

interface RequestBody {
	address: RequestAddress;
	listing: RequestListing;
}

// payload type for the external API request
interface ExternalPayload {
	address: RequestAddress;
	listing: {
		Id: string;
		Name: string;
	};
	project_id: string;
	member: {
		firstName: string;
		lastName: string;
		dob: string;
	};
	applicant: {
		firstName: string;
		lastName: string;
		dob: string;
	};
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse | ApiError>> {
	let address: RequestAddress;
	let listing: RequestListing;

	try {
		// Type the parsed body
		const body: RequestBody = await req.json();
		address = body.address;
		listing = body.listing;
	} catch (error) {
		console.warn("Failed to parse request body:", error);
		return NextResponse.json({ message: "Failed to parse request body" }, { status: 400 });
	}

	if (!address || !listing) {
		return NextResponse.json({ message: "Missing address or listing data in request body" }, { status: 400 });
	}

	// Validate address structure (basic check)
	if (!address.address1 || !address.city || !address.state || !address.zip) {
		return NextResponse.json({ message: "Invalid address format" }, { status: 400 });
	}
	// Validate listing structure (basic check)
	if (!listing.Id || !listing.Name) {
		return NextResponse.json({ message: "Invalid listing format" }, { status: 400 });
	}

	const externalApiUrl = "https://housing.sfgov.org/api/v1/addresses/gis-data.json";

	// Construct the payload for the external API
	const externalPayload: ExternalPayload = {
		address,
		listing: {
			Id: listing.Id,
			Name: listing.Name
			// Project_ID will be added conditionally below
		},
		project_id: "",
		member: {
			firstName: "First", // Hardcoded test data
			lastName: "Last",  // Hardcoded test data
			dob: "1960-01-01", // Hardcoded test data
		},
		applicant: {
			firstName: "First", // Hardcoded test data
			lastName: "Last",  // Hardcoded test data
			dob: "1960-01-01", // Hardcoded test data
		},
	};

	// If Project_ID is provided in the request's listing object, use it
	if (listing.Project_ID) {
		externalPayload.project_id = listing.Project_ID;
	}

	try {
		const externalResponse = await fetch(externalApiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// Add any other required headers for the external API if necessary
			},
			body: JSON.stringify(externalPayload), // Use the enhanced payload
		});

		if (!externalResponse.ok) {
			// Attempt to read error body from external API
			let errorBody = "External API request failed";
			try {
				errorBody = await externalResponse.text(); // or .json() if it returns JSON errors
			} catch (parseError) {
				// Ignore if error body can't be parsed
				console.warn("Could not parse error body from external API:", parseError);
			}
			console.error(`External API Error (${externalResponse.status}): ${errorBody}`);
			throw new Error(`External API request failed with status ${externalResponse.status}`);
		}

		const data: ExternalApiResponse = await externalResponse.json();

		if (!data.gis_data) {
			console.error("Missing 'gis_data' in external API response:", data);
			throw new Error("Invalid response format from external API (missing gis_data)");
		}

		const g = data.gis_data;
		const boundaryMatch = g.boundary_match;
		let isMatch = false;
		let message = "Could not determine boundary match from API response (null or invalid value received).";
		if (typeof boundaryMatch === "boolean") {
			isMatch = boundaryMatch;
			message = boundaryMatch
				? "✅ Address is within the listing boundary."
				: "❌ Address is NOT within the listing boundary.";
		} else {
			console.warn("External API returned non-boolean 'boundary_match':", boundaryMatch);
		}

		let lat: number | undefined;
		let lng: number | undefined;
		let viewport: { north: number; south: number; east: number; west: number } | undefined;

		// Prefer Google Geocoding for accurate map coordinates
		const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
		const formattedAddress = `${address.address1}, ${address.city}, ${address.state} ${address.zip}`;
		if (apiKey) {
			try {
				const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formattedAddress)}&key=${encodeURIComponent(apiKey)}`;
				const geoRes = await fetch(url, { method: "GET" });
				if (geoRes.ok) {
					const geoJson: GoogleGeocodingResponse = await geoRes.json();
					if (geoJson.status === "OK" && Array.isArray(geoJson.results) && geoJson.results.length > 0) {
						const r = geoJson.results[0];
						if (r.geometry?.location && typeof r.geometry.location.lat === "number" && typeof r.geometry.location.lng === "number") {
							lat = r.geometry.location.lat;
							lng = r.geometry.location.lng;
						}
						if (r.geometry?.viewport?.northeast && r.geometry?.viewport?.southwest) {
							viewport = {
								north: r.geometry.viewport.northeast.lat,
								east: r.geometry.viewport.northeast.lng,
								south: r.geometry.viewport.southwest.lat,
								west: r.geometry.viewport.southwest.lng,
							};
						}
					}
				} else {
					console.warn("Google Geocoding API request failed", geoRes.status, await geoRes.text());
				}
			} catch (geErr) {
				console.warn("Google Geocoding API error:", geErr);
			}
		} else {
			console.warn("Google Maps API key not configured for geocoding; set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
		}

		// Fallback viewport from GIS extent if geocode viewport missing
		if (!viewport && g.extent) {
			const sw = webMercatorToLatLng(g.extent.xmin, g.extent.ymin);
			const ne = webMercatorToLatLng(g.extent.xmax, g.extent.ymax);
			viewport = { north: ne.lat, south: sw.lat, east: ne.lng, west: sw.lng };
		}

		return NextResponse.json({ isMatch, message, lat, lng, viewport });
	} catch (error) {
		console.error("Error in /api/check-address:", error);
		const message = error instanceof Error ? error.message : "An unknown error occurred while checking the address.";
		return NextResponse.json({ message }, { status: 500 });
	}
}
