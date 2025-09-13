import { useCallback, useEffect, useRef } from "react";
import type { Listing } from "@/types/listings";

export const useKeyboardNavigation = (
	filteredListings: Listing[],
	selectedListingId: string | null,
	setSelectedListingId: (id: string) => void,
) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const filteredRef = useRef<Listing[]>([]);

	// keep filtered list ref fresh for handlers
	useEffect(() => {
		filteredRef.current = filteredListings;
	}, [filteredListings]);

	const registerItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
		itemRefs.current[id] = el;
	}, []);

	// scroll selected item into view on change
	useEffect(() => {
		if (selectedListingId && itemRefs.current[selectedListingId]) {
			itemRefs.current[selectedListingId]?.scrollIntoView({
				behavior: "auto",
				block: "nearest",
			});
		}
	}, [selectedListingId]);

	const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
		const currentFiltered = filteredRef.current;
		if (!currentFiltered.length) return;

		if (
			e.key === "ArrowDown" ||
			e.key === "ArrowUp" ||
			e.key === "PageUp" ||
			e.key === "PageDown" ||
			e.key === "Home" ||
			e.key === "End"
		) {
			e.preventDefault();

			const currentIndex = selectedListingId
				? currentFiltered.findIndex((l) => l.Id === selectedListingId)
				: -1;

			// estimate page size
			const container = containerRef.current;
			let pageSize = 5;
			if (container) {
				const containerHeight = container.clientHeight;
				const sampleItem = Object.values(itemRefs.current).find((ref) => ref !== null) as HTMLDivElement | undefined;
				if (sampleItem) {
					const itemHeight = sampleItem.clientHeight;
					pageSize = Math.max(1, Math.floor(containerHeight / Math.max(1, itemHeight)));
				}
			}

			if (e.key === "ArrowDown") {
				if (currentIndex < currentFiltered.length - 1) {
					setSelectedListingId(currentFiltered[currentIndex + 1].Id);
				}
			} else if (e.key === "ArrowUp") {
				if (currentIndex > 0) {
					setSelectedListingId(currentFiltered[currentIndex - 1].Id);
				}
			} else if (e.key === "PageDown") {
				if (currentIndex < currentFiltered.length - 1) {
					const nextIndex = Math.min(currentIndex + pageSize, currentFiltered.length - 1);
					setSelectedListingId(currentFiltered[nextIndex].Id);
				}
			} else if (e.key === "PageUp") {
				if (currentIndex > 0) {
					const prevIndex = Math.max(currentIndex - pageSize, 0);
					setSelectedListingId(currentFiltered[prevIndex].Id);
				}
			} else if (e.key === "Home") {
				if (currentFiltered.length > 0) {
					setSelectedListingId(currentFiltered[0].Id);
				}
			} else if (e.key === "End") {
				if (currentFiltered.length > 0) {
					setSelectedListingId(currentFiltered[currentFiltered.length - 1].Id);
				}
			}
		}
	}, [selectedListingId, setSelectedListingId]);

	return { onKeyDown, registerItemRef, containerRef } as const;
};
