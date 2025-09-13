import { useMemo } from "react";
import type { Listing } from "@/types/listings";
import type { ListingFilter } from "@/components/FilterBar";
import { compareDates } from "@/utils/listingSort";

export const useFilteredListings = (
	listings: Listing[],
	term: string,
	filter: ListingFilter,
) => {
	return useMemo(() => {
		if (!listings || listings.length === 0) return [] as Listing[];

		let typeFiltered = listings;
		if (filter !== "All") {
			typeFiltered = listings.filter((listing) => {
				if (filter === "Rental") {
					return listing.RecordType && listing.RecordType.Name === "Rental";
				} else if (filter === "Sales") {
					return listing.RecordType && listing.RecordType.Name === "Ownership";
				}
				return true;
			});
		}

		if (!term) {
			return [...typeFiltered].sort(compareDates);
		}

		const searchTermLower = term.toLowerCase();
		return typeFiltered
			.filter((listing) => {
				if (listing.Id === term) return true; // exact id match
				return (
					listing.Name.toLowerCase().includes(searchTermLower) ||
					(listing.Tenure && listing.Tenure.toLowerCase().includes(searchTermLower)) ||
					(listing.Status && listing.Status.toLowerCase().includes(searchTermLower)) ||
					(listing.Listing_Type && listing.Listing_Type.toLowerCase().includes(searchTermLower)) ||
					(listing.RecordType && listing.RecordType.Name && listing.RecordType.Name.toLowerCase().includes(searchTermLower))
				);
			})
			.sort(compareDates);
	}, [listings, term, filter]);
};
