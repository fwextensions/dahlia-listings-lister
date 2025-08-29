// File: src/components/NrhpMap.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNrhpGeometry } from "@/hooks/useNrhpGeometry";
import { loadGoogleMapsApi } from "@/utils/googleMaps";

interface NrhpMapProps {
	projectId: string;
	address: string;
	isMatch: boolean | null;
	lat?: number;
	lng?: number;
	viewport?: { north: number; south: number; east: number; west: number };
	markerEnabled?: boolean;
}

const MAP_HEIGHT_PX = 420;

const NrhpMap = ({ projectId, address, isMatch, lat, lng, viewport, markerEnabled = true }: NrhpMapProps) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const [mapsError, setMapsError] = useState<string | null>(null);
	const [isLoadingMaps, setIsLoadingMaps] = useState(false);
	const [mapsReady, setMapsReady] = useState(false);

	const { data: geojson, isLoading, error } = useNrhpGeometry(projectId);

	const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", []);

	// load the Google Maps JavaScript API lazily
	useEffect(() => {
		if (!containerRef.current) return;
		if (!apiKey) {
			setMapsError("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
			return;
		}
		let cancelled = false;
		setIsLoadingMaps(true);
		loadGoogleMapsApi(apiKey)
			.then((google) => {
				if (cancelled) return;
				if (!mapRef.current && containerRef.current) {
					mapRef.current = new (google as any).maps.Map(containerRef.current, {
						center: { lat: 37.7749, lng: -122.4194 },
						zoom: 12,
						streetViewControl: false,
						mapTypeControl: false,
						fullscreenControl: true,
					});
				}
				setMapsReady(true);
			})
			.catch((err) => {
				if (!cancelled) setMapsError(err?.message || "Failed to load Google Maps");
			})
			.finally(() => {
				if (!cancelled) setIsLoadingMaps(false);
			});
		return () => {
			cancelled = true;
		};
	}, [apiKey]);

	// render/refresh layers and marker when map, data, or address changes
	useEffect(() => {
		const google = (window as any).google as any;
		const map = mapRef.current;
		if (!google || !map || !mapsReady) return;

		// clear existing data layer features before re-adding
		try {
			map.data.forEach((f: any) => map.data.remove(f));
		} catch {}

		const bounds = new google.maps.LatLngBounds();

		// add geojson if available
		if (geojson && geojson.type === "FeatureCollection") {
			try {
				map.data.addGeoJson(geojson as any);
				map.data.setStyle({
					fillColor: isMatch === true ? "#22c55e" : isMatch === false ? "#f59e0b" : "#3b82f6",
					fillOpacity: 0.25,
					strokeColor: isMatch === true ? "#16a34a" : isMatch === false ? "#d97706" : "#2563eb",
					strokeOpacity: 0.9,
					strokeWeight: 2,
				});
				// expand bounds to polygon geometry
				map.data.forEach((feature: any) => {
					const geom = feature.getGeometry();
					if (!geom) return;
					try {
						geom.forEachLatLng((latLng: any) => bounds.extend(latLng));
					} catch {}
				});
				// removed debug featuresCount
			} catch (e) {
				// swallow malformed geojson errors but keep map usable
			}
		}

		// if viewport from server is available, include it in bounds to guide initial zoom
		if (viewport) {
			try {
				bounds.extend(new google.maps.LatLng(viewport.north, viewport.east));
				bounds.extend(new google.maps.LatLng(viewport.south, viewport.west));
			} catch {}
		}

		// place marker using server-provided lat/lng if available, else geocode
		const placeMarker = () => {
			// if marker is disabled, remove existing marker and do nothing
			if (!markerEnabled) {
				if (markerRef.current) {
					try {
						markerRef.current.setMap(null);
					} catch {}
					markerRef.current = null;
				}
				return Promise.resolve<void>(undefined);
			}
			if (typeof lat === "number" && typeof lng === "number") {
				const loc = new google.maps.LatLng(lat, lng);
				if (!markerRef.current) {
					markerRef.current = new google.maps.Marker({
						title: address,
						map,
					});
				}
				markerRef.current.setPosition(loc);
				bounds.extend(loc);
				// removed debug geocode status
				return Promise.resolve<void>(undefined);
			}
			if (!address) return Promise.resolve<void>(undefined);
			return new Promise<void>((resolve) => {
				const geocoder = new google.maps.Geocoder();
				geocoder.geocode({ address, region: "US" }, (results: any, status: string) => {
					if (status === "OK" && results && results[0]) {
						const loc = results[0].geometry.location;
						if (!markerRef.current) {
							markerRef.current = new google.maps.Marker({
								map,
								icon: {
									path: google.maps.SymbolPath.CIRCLE,
									scale: 6,
									fillColor: isMatch ? "#16a34a" : "#d97706",
									fillOpacity: 1,
									strokeColor: "#111827",
									strokeWeight: 1,
								},
							});
						}
						markerRef.current.setPosition(loc);
						bounds.extend(loc);
						// removed debug geocode status
					} else {
						// if geocode fails, clear marker
						if (markerRef.current) {
							markerRef.current.setMap(null);
							markerRef.current = null;
						}
						// removed debug geocode status
					}
					resolve();
				});
			});
		};

		placeMarker().then(() => {
			// fit bounds if we have something; else keep default
			if (!bounds.isEmpty()) {
				map.fitBounds(bounds);
				google.maps.event.addListenerOnce(map, "bounds_changed", () => {
					if (map.getZoom() > 18) map.setZoom(18);
				});
				// remove listener later automatically since addListenerOnce
			}
		});
	}, [mapsReady, geojson, address, isMatch, lat, lng, viewport, markerEnabled]);

	return (
		<div>
			{(isLoadingMaps || isLoading) && (
				<div className="flex items-center justify-center p-3 text-sm text-gray-600 dark:text-gray-300">
					<span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" role="status"></span>
					Loading map...
				</div>
			)}
			{(mapsError || error) && (
				<div className="mt-2 p-2 text-sm rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700">
					{mapsError || (error as any)?.message || "Failed to load map"}
				</div>
			)}
			{/* removed debug labels for features and geocode status */}
			{!isLoading && geojson && Array.isArray(geojson.features) && geojson.features.length === 0 && (
				<div className="mt-2 p-2 text-xs rounded border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-700">
					No NRHP boundary geometry found for this Project_ID.
				</div>
			)}
			<div ref={containerRef} style={{ width: "100%", height: MAP_HEIGHT_PX }} className="mt-2 rounded-md overflow-hidden border border-gray-300 dark:border-gray-700" />
		</div>
	);
};

export default NrhpMap;
