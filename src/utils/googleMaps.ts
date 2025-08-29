/* eslint-disable @typescript-eslint/no-explicit-any */
// File: src/utils/googleMaps.ts
let mapsLoaderPromise: Promise<any> | null = null;

export const loadGoogleMapsApi = (apiKey: string): Promise<any> => {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("google maps can only load in the browser"));
	}
	if ((window as any).google && (window as any).google.maps) {
		return Promise.resolve((window as any).google);
	}
	if (mapsLoaderPromise) return mapsLoaderPromise;

	mapsLoaderPromise = new Promise((resolve, reject) => {
		const existing = document.getElementById("gmaps-js");
		if (existing) {
			existing.addEventListener("load", () => resolve((window as any).google));
			existing.addEventListener("error", () => reject(new Error("failed to load google maps script")));
			return;
		}
		const script = document.createElement("script");
		script.id = "gmaps-js";
		script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,marker`;
		script.async = true;
		script.defer = true;
		script.onload = () => {
			if ((window as any).google && (window as any).google.maps) {
				resolve((window as any).google);
			} else {
				reject(new Error("google maps loaded but window.google.maps is unavailable"));
			}
		};
		script.onerror = () => reject(new Error("failed to load google maps script"));
		document.head.appendChild(script);
	});

	return mapsLoaderPromise;
};
