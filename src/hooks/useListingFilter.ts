import { useEffect, useState } from "react";
import type { ListingFilter } from "@/components/FilterBar";

const STORAGE_KEY = "listingFilter";

export const useListingFilter = () => {
	const [currentFilter, setCurrentFilter] = useState<ListingFilter>(() => {
		if (typeof window === "undefined") return "All";
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === "All" || saved === "Rental" || saved === "Sales") {
				return saved as ListingFilter;
			}
		} catch {
			// ignore storage errors
		}
		return "All";
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, currentFilter);
		} catch {
			// ignore storage errors
		}
	}, [currentFilter]);

	return { currentFilter, setCurrentFilter } as const;
};
