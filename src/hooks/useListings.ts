import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchListings, getLocalStorageListings } from "@/utils/api";

export const useListings = () => {
	console.log("useListings hook initialized");
	
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => {
			clearTimeout(timer);
		};
	}, [searchTerm]);

	// Get cached data from localStorage for initial render
	const initialData = useMemo(() => {
		console.log("Getting initial data from localStorage");
		return getLocalStorageListings();
	}, []);

	// Fetch listings data with React Query
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["listings"],
		queryFn: () => {
			console.log("React Query queryFn executing");
			return fetchListings();
		},
		initialData,
		refetchInterval: 5 * 60 * 1000, // 5 minutes
	});

	// Log when the query state changes
	useEffect(() => {
		console.log("Query state changed - isLoading:", isLoading, "isError:", isError);
	}, [isLoading, isError]);

	// Filter listings based on search term
	const filteredListings = useMemo(() => {
		if (!data || !data.listings || !Array.isArray(data.listings)) {
			console.log("No listings data available or invalid format", data);
			return [];
		}

		console.log(`Found ${data.listings.length} listings`);
		
		if (!debouncedSearchTerm) {
			return [...data.listings].sort((a, b) => a.Name.localeCompare(b.Name));
		}

		return data.listings.filter((listing) => {
			const searchTermLower = debouncedSearchTerm.toLowerCase();
			
			// For Id, only match exactly
			if (listing.Id === debouncedSearchTerm) {
				return true;
			}
			
			// For other fields, do case-insensitive partial matching
			return (
				listing.Name.toLowerCase().includes(searchTermLower) ||
				(listing.Tenure && listing.Tenure.toLowerCase().includes(searchTermLower)) ||
				(listing.Status && listing.Status.toLowerCase().includes(searchTermLower)) ||
				(listing.Listing_Type && listing.Listing_Type.toLowerCase().includes(searchTermLower)) ||
				(listing.RecordType && listing.RecordType.Name && 
				 listing.RecordType.Name.toLowerCase().includes(searchTermLower))
			);
		}).sort((a, b) => a.Name.localeCompare(b.Name));
	}, [data, debouncedSearchTerm]);

	// Debug: Log the data we're receiving
	useEffect(() => {
		console.log("Listings data:", data);
		console.log("Filtered listings:", filteredListings);
	}, [data, filteredListings]);

	// Get the selected listing
	const selectedListing = useMemo(() => {
		if (!selectedListingId || !data?.listings) return null;
		return data.listings.find((listing) => listing.Id === selectedListingId) || null;
	}, [data, selectedListingId]);

	// Select the first listing if none is selected and there are listings available
	useEffect(() => {
		if (!selectedListingId && filteredListings.length > 0) {
			setSelectedListingId(filteredListings[0].Id);
		}
	}, [filteredListings, selectedListingId]);

	// Handle keyboard navigation
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if (!filteredListings.length || !selectedListingId) return;

		const currentIndex = filteredListings.findIndex(
			(listing) => listing.Id === selectedListingId
		);

		if (currentIndex === -1) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const nextIndex = Math.min(currentIndex + 1, filteredListings.length - 1);
			setSelectedListingId(filteredListings[nextIndex].Id);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			const prevIndex = Math.max(currentIndex - 1, 0);
			setSelectedListingId(filteredListings[prevIndex].Id);
		}
	}, [filteredListings, selectedListingId]);

	// Add keyboard event listener
	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	return {
		listings: data?.listings || [],
		filteredListings,
		isLoading,
		isError,
		error,
		searchTerm,
		setSearchTerm,
		selectedListing,
		selectedListingId,
		setSelectedListingId,
	};
};
