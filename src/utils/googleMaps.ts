/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/utils/googleMaps.ts
import { Loader } from "@googlemaps/js-api-loader";

let loader: Loader | null = null;
const moduleCache: Record<string, Promise<any>> = {};

export type GoogleMapsLibrary = "core" | "maps" | "marker" | "geometry" | "places" | "geocoding";

export const loadGoogleMapsApi = (apiKey: string, libs: GoogleMapsLibrary[]): Promise<any[]> => {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("google maps can only load in the browser"));
	}

	if (!loader) {
		loader = new Loader({
			apiKey,
			version: "weekly",
		});
	}

	const ensureLib = (name: GoogleMapsLibrary) => {
		if (!moduleCache[name]) {
			moduleCache[name] = loader!.importLibrary(name as any);
		}
		
		return moduleCache[name];
	};

	return Promise.all(libs.map((l) => ensureLib(l)));
};
