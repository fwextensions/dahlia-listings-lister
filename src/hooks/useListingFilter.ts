import { useEffect, useRef, useState } from "react";
import type { ListingFilter } from "@/components/FilterBar";

const STORAGE_KEY = "listingFilter";

export const useListingFilter = () => {
	const [currentFilter, setCurrentFilter] = useState<ListingFilter>("All");
	const hasHydratedRef = useRef(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === "All" || saved === "Rental" || saved === "Sales") {
				setCurrentFilter(saved as ListingFilter);
			}
		} catch {
			// ignore storage errors
		}
		hasHydratedRef.current = true;
	}, []);

	useEffect(() => {
		if (!hasHydratedRef.current) {
			return;
		}
		try {
			localStorage.setItem(STORAGE_KEY, currentFilter);
		} catch {
			// ignore storage errors
		}
	}, [currentFilter]);

	return { currentFilter, setCurrentFilter } as const;
};
