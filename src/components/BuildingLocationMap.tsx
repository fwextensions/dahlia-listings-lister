"use client";

import { useMemo } from "react";
import NrhpMap from "@/components/NrhpMap";
import type { Listing } from "@/types/listings";
import { useBuildingGeocode } from "@/hooks/useBuildingGeocode";

interface BuildingLocationMapProps {
	listing: Listing;
	isDetailsLoading: boolean;
}

export default function BuildingLocationMap({ listing, isDetailsLoading }: BuildingLocationMapProps) {
	const address1 = useMemo(() => listing.Building_Street_Address || "", [listing.Building_Street_Address]);
	const city = useMemo(() => listing.Building_City || "San Francisco", [listing.Building_City]);
	const state = useMemo(() => listing.Building_State || "CA", [listing.Building_State]);
	const zip = useMemo(() => listing.Building_Zip_Code || "00000", [listing.Building_Zip_Code]);

	const { data: geocode, error } = useBuildingGeocode(
		isDetailsLoading ? null : (listing?.Id ?? null),
		{ address1, city, state, zip },
	);

	const fullAddress = `${address1}, ${city}, ${state} ${zip}`;

	return (
		<div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
			<h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Location</h3>
			{error && (
				<div className="mb-2 p-2 text-sm rounded border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700">{error.message}</div>
			)}
			<NrhpMap
				projectId={null}
				address={fullAddress}
				viewport={geocode?.viewport}
				markerEnabled={false}
				buildingLat={geocode?.lat}
				buildingLng={geocode?.lng}
			/>
		</div>
	);
}
