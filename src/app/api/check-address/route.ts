// File: src/app/api/check-address/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface ApiError {
	message: string;
}

interface GisData {
	boundary_match: boolean;
	// Add other fields from the external API if needed later
}

interface ExternalApiResponse {
	gis_data?: GisData;
	// Add other top-level fields if needed
}

interface ApiResponse {
	isMatch: boolean;
	message: string;
}

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
}

interface RequestBody {
	address: RequestAddress;
	listing: RequestListing;
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

	const externalApiUrl = "https://dahlia-full.herokuapp.com/api/v1/addresses/gis-data.json";

	// Construct the payload for the external API
	const externalPayload = {
		address,
		listing,
		project_id: "2016-095", // Hardcoded for testing
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

		if (data.gis_data) {
			const boundaryMatch = data.gis_data.boundary_match;
			if (typeof boundaryMatch === "boolean") {
				// Handle boolean true/false
				return NextResponse.json({
					isMatch: boundaryMatch,
					message: boundaryMatch
						? "Address is within the listing boundary."
						: "Address is NOT within the listing boundary.",
				});
			} else {
				// Handle null or other non-boolean types for boundary_match
				console.warn("External API returned non-boolean 'boundary_match':", boundaryMatch);
				return NextResponse.json({
					isMatch: false, // Treat null/undefined as not a match for simplicity
					message: "Could not determine boundary match from API response (null or invalid value received).",
				});
			}
		} else {
			console.error("Missing 'gis_data' in external API response:", data);
			throw new Error("Invalid response format from external API (missing gis_data)");
		}
	} catch (error) {
		console.error("Error in /api/check-address:", error);
		const message = error instanceof Error ? error.message : "An unknown error occurred while checking the address.";
		return NextResponse.json({ message }, { status: 500 });
	}
}
