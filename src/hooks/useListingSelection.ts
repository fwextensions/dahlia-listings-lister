import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/types/listings";

export const useListingSelection = (
	listings: Listing[],
	filteredListings: Listing[],
) => {
	const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

	// keep selection valid against the full list
	useEffect(() => {
		if (!listings || listings.length === 0) {
			setSelectedListingId(null);
			return;
		}
		if (!selectedListingId) {
			setSelectedListingId(listings[0].Id);
			return;
		}
		const exists = listings.some((l) => l.Id === selectedListingId);
		if (!exists) {
			setSelectedListingId(listings[0].Id);
		}
	}, [listings, selectedListingId]);

	// keep selection valid against the filtered list
	useEffect(() => {
		if (!filteredListings || filteredListings.length === 0) {
			setSelectedListingId(null);
			return;
		}
		if (selectedListingId && !filteredListings.some((l) => l.Id === selectedListingId)) {
			setSelectedListingId(filteredListings[0].Id);
		}
	}, [filteredListings, selectedListingId]);

	const currentSelectedListing = useMemo(() => {
		if (!selectedListingId) return null;
		return listings.find((l) => l.Id === selectedListingId) ?? null;
	}, [listings, selectedListingId]);

	return { selectedListingId, setSelectedListingId, currentSelectedListing } as const;
};
