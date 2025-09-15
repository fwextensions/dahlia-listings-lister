// File: src/app/api/geocode/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface ApiError {
	message: string;
}

interface ApiResponse {
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

interface RequestAddress {
	address1: string;
	city: string;
	state: string;
	zip: string;
}

interface RequestBody {
	address: RequestAddress;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse | ApiError>> {
	let address: RequestAddress | null = null;

	try {
		const body = (await req.json()) as RequestBody;
		address = body?.address ?? null;
	} catch {
		return NextResponse.json({ message: "failed to parse request body" }, { status: 400 });
	}

	if (!address) {
		return NextResponse.json({ message: "missing address in request body" }, { status: 400 });
	}

	if (!address.address1 || !address.city || !address.state || !address.zip) {
		return NextResponse.json({ message: "invalid address format" }, { status: 400 });
	}

	const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ message: "google maps api key not configured" }, { status: 500 });
	}

	const formatted = `${address.address1}, ${address.city}, ${address.state} ${address.zip}`;

	try {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formatted)}&key=${encodeURIComponent(apiKey)}`;
		const geoRes = await fetch(url, { method: "GET" });
		if (!geoRes.ok) {
			const text = await geoRes.text();
			return NextResponse.json({ message: `google geocoding failed: ${geoRes.status} ${text}` }, { status: 502 });
		}
		const geoJson = (await geoRes.json()) as GoogleGeocodingResponse;
		if (geoJson.status !== "OK" || !Array.isArray(geoJson.results) || geoJson.results.length === 0) {
			return NextResponse.json({ message: `geocoding returned status ${geoJson.status}` }, { status: 404 });
		}
		const r = geoJson.results[0];
		const lat = r.geometry?.location?.lat;
		const lng = r.geometry?.location?.lng;
		const vpNE = r.geometry?.viewport?.northeast;
		const vpSW = r.geometry?.viewport?.southwest;

		const viewport = vpNE && vpSW
			? { north: vpNE.lat, east: vpNE.lng, south: vpSW.lat, west: vpSW.lng }
			: undefined;

		return NextResponse.json({ lat, lng, viewport });
	} catch (err) {
		const message = err instanceof Error ? err.message : "unknown geocoding error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
