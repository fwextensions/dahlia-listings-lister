/* eslint-disable @typescript-eslint/no-explicit-any */
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
	buildingLat?: number;
	buildingLng?: number;
}

const MAP_HEIGHT_PX = 420;

const NrhpMap = ({ projectId, address, isMatch, lat, lng, viewport, markerEnabled = true, buildingLat, buildingLng }: NrhpMapProps) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<any>(null);
	const markerRef = useRef<any>(null);
	const buildingMarkerRef = useRef<any>(null);
	const lastProjectIdRef = useRef<string | null>(null);
	const hasFittedPolygonRef = useRef<boolean>(false);
	const [mapsError, setMapsError] = useState<string | null>(null);
	const [mapsReady, setMapsReady] = useState(false);

	const { data: geojson, isLoading, error } = useNrhpGeometry(projectId);

	const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", []);
	const mapId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID", []);

	// load the Google Maps JavaScript API lazily
	useEffect(() => {
		if (!containerRef.current) return;
		if (!apiKey) {
			setMapsError("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
			return;
		}

		let cancelled = false;

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
						mapId,
					});
				}
				setMapsReady(true);
			})
			.catch((err) => {
				if (!cancelled) setMapsError(err?.message || "Failed to load Google Maps");
			});
		return () => {
			cancelled = true;
		};
	}, [apiKey, mapId]);

	// render/refresh layers and marker; avoid zooming on mere address input edits
	useEffect(() => {
		const google = (window as any).google as any;
		const map = mapRef.current;
		if (!google || !map || !mapsReady) return;

		// reset polygon-fit guard when project changes, and suppress building marker for this tick to avoid flicker
		let suppressBuildingThisRun = false;
		if (lastProjectIdRef.current !== projectId) {
			lastProjectIdRef.current = projectId;
			hasFittedPolygonRef.current = false;
			suppressBuildingThisRun = true;
			// proactively clear previous building marker so old coords don't flash
			if (buildingMarkerRef.current) {
				try { buildingMarkerRef.current.map = null; } catch {}
				buildingMarkerRef.current = null;
			}
		}

		// clear existing data layer features before re-adding
		try {
			map.data.forEach((f: any) => map.data.remove(f));
		} catch {}

		const bounds = new google.maps.LatLngBounds();

		// add geojson if available
		if (geojson && geojson.type === "FeatureCollection") {
			let extendedByPolygon = false;
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
						geom.forEachLatLng((latLng: any) => { bounds.extend(latLng); extendedByPolygon = true; });
					} catch {}
				});
				// removed debug featuresCount
			} catch {
				// swallow malformed geojson errors but keep map usable
			}
			// fit to polygon only once per project (prevents zoom on address edits)
			if (extendedByPolygon && !hasFittedPolygonRef.current && !viewport && (typeof lat !== "number" || typeof lng !== "number")) {
				try {
					if (!bounds.isEmpty()) {
						map.fitBounds(bounds);
						google.maps.event.addListenerOnce(map, "bounds_changed", () => {
							if (map.getZoom() > 18) map.setZoom(18);
						});
						hasFittedPolygonRef.current = true;
					}
				} catch {}
			}
		}

		// if viewport from server is available, include it in bounds to guide initial zoom
		if (viewport) {
			try {
				bounds.extend(new google.maps.LatLng(viewport.north, viewport.east));
				bounds.extend(new google.maps.LatLng(viewport.south, viewport.west));
			} catch {}
		}

		// place marker only when server-provided lat/lng are available
		const placeMarker = () => {
			// if marker is disabled, remove existing marker and do nothing
			if (!markerEnabled) {
				if (markerRef.current) {
					try {
						// AdvancedMarkerElement: remove by detaching from map
						markerRef.current.map = null;
					} catch {}
					markerRef.current = null;
				}
				return Promise.resolve<void>(undefined);
			}
			// require explicit lat/lng; if absent, clear marker and do nothing
			if (typeof lat !== "number" || typeof lng !== "number") {
				if (markerRef.current) {
					try {
						// AdvancedMarkerElement: remove by detaching from map
						markerRef.current.map = null;
					} catch {}
					markerRef.current = null;
				}
				return Promise.resolve<void>(undefined);
			}
			const loc = new google.maps.LatLng(lat, lng);
			if (!markerRef.current) {
				// use AdvancedMarkerElement per Google deprecation notice, with colored Pin for address
				const addressPinColor = isMatch === true ? "#16a34a" : isMatch === false ? "#d97706" : "#2563eb";
				const addressPin = new google.maps.marker.PinElement({
					background: addressPinColor,
					borderColor: "#111827",
					glyphColor: "#ffffff",
				});
				markerRef.current = new google.maps.marker.AdvancedMarkerElement({
					map,
					position: loc,
					content: addressPin.element,
					zIndex: 10,
				});
			} else {
				// update position and ensure it's attached to the current map
				markerRef.current.position = loc;
				if (markerRef.current.map !== map) markerRef.current.map = map;
			}
			bounds.extend(loc);
			return Promise.resolve<void>(undefined);
		};

		// place building marker only when buildingLat/buildingLng are available; no polygon-center fallback
		const placeBuildingMarker = () => {
			if (suppressBuildingThisRun) return;
			let loc: any = null;
			if (typeof buildingLat === "number" && typeof buildingLng === "number") {
				loc = new google.maps.LatLng(buildingLat, buildingLng);
			}
			if (!loc) {
				if (buildingMarkerRef.current) {
					try {
						buildingMarkerRef.current.map = null;
					} catch {}
					buildingMarkerRef.current = null;
				}
				return;
			}
			if (!buildingMarkerRef.current) {
				const buildingPin = new google.maps.marker.PinElement({
					background: "#7c3aed", // purple for building
					borderColor: "#111827",
					glyphColor: "#ffffff",
				});
				buildingMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
					map,
					position: loc,
					title: "Building location",
					content: buildingPin.element,
					zIndex: 20,
				});
			} else {
				buildingMarkerRef.current.position = loc;
				if (buildingMarkerRef.current.map !== map) buildingMarkerRef.current.map = map;
			}
			bounds.extend(loc);
		};

		placeMarker().then(() => {
			// place building marker after address marker; do not auto-fit on address results
			placeBuildingMarker();
		});
	}, [mapsReady, geojson, isMatch, lat, lng, viewport, markerEnabled, buildingLat, buildingLng, projectId]);

	// keep marker title in sync with address without retriggering heavy map effect
	useEffect(() => {
		try { markerRef.current.title = address; } catch {}
	}, [address]);

	return (
		<div>
			{(mapsError || error) && (
				<div className="mt-2 p-2 text-sm rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700">
					{mapsError || (error as any)?.message || "Failed to load map"}
				</div>
			)}

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
