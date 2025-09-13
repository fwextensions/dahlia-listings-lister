"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ListingDetails from "@/components/ListingDetails";
import FinderPane from "@/components/FinderPane";
import type { ListingFilter } from "@/components/FilterBar";
import { useSearchTerm } from "@/hooks/useSearchTerm";
import { useListingFilter } from "@/hooks/useListingFilter";
import { useFilteredListings } from "@/hooks/useFilteredListings";
import { useListingSelection } from "@/hooks/useListingSelection";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { Listing, LotteryBucket } from "@/types/listings";
import { useListingsQuery } from "@/hooks/useListingsQuery";

export default function Home() {
	const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearchTerm("");
	const { currentFilter, setCurrentFilter } = useListingFilter();
	const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

	// listings query via React Query seeded from localStorage
	const { data: listingsData, isLoading, isFetching, error: listingsError } = useListingsQuery();
	const directListings = useMemo(() => (listingsData?.listings ?? []) as Listing[], [listingsData]);

  // State for preferences
  // handled via react-query below

  // Focus the search box when the page loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setIsMounted(true);
  }, []);

  // filter persistence is handled by useListingFilter hook

  // derive filtered + sorted listings
  const currentFilteredListings = useFilteredListings(directListings, debouncedSearchTerm, currentFilter);

  // selection managed by hook
  const { selectedListingId, setSelectedListingId, currentSelectedListing } = useListingSelection(
    directListings,
    currentFilteredListings,
  );

  // keyboard nav hook
  const { onKeyDown, registerItemRef, containerRef } = useKeyboardNavigation(
    currentFilteredListings,
    selectedListingId,
    (id: string) => setSelectedListingId(id),
  );

  // Preferences query keyed by selected listing; auto-updates on change
  const {
    data: preferences,
    isLoading: prefsIsLoading,
    isFetching: prefsIsFetching,
    error: preferencesError,
  } = useQuery<LotteryBucket[], Error>({
    queryKey: ["preferences", selectedListingId],
    enabled: !!selectedListingId,
    queryFn: async ({ signal }) => {
      const id = selectedListingId as string;
      const response = await fetch(`/api/preferences/${id}`, { signal });
      if (!response.ok) {
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          // ignore parse errors
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !Array.isArray(data.preferences)) {
        throw new Error("Invalid preferences data format received from server");
      }
      return data.preferences as LotteryBucket[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const isPreferencesLoading = prefsIsLoading || prefsIsFetching;

  // Get text for results count
  const getResultsCountText = () => {
    const filteredCount = currentFilteredListings.length;

    if (isLoading) {
      return "Loading listings...";
    }

    if (listingsError) {
      return "Error loading listings";
    }

    if (filteredCount === 0) {
      if (debouncedSearchTerm && currentFilter !== "All") {
        return `No listings match "${debouncedSearchTerm}" with filter: ${currentFilter}`;
      } else if (debouncedSearchTerm) {
        return `No listings match "${debouncedSearchTerm}"`;
      } else if (currentFilter !== "All") {
        return `No ${currentFilter} listings found`;
      } else {
        return "No listings found";
      }
    }

    if (debouncedSearchTerm && currentFilter !== "All") {
      return `${filteredCount} ${currentFilter} listings match "${debouncedSearchTerm}"`;
    } else if (debouncedSearchTerm) {
      return `${filteredCount} listings match "${debouncedSearchTerm}"`;
    } else if (currentFilter !== "All") {
      return `${filteredCount} ${currentFilter} listings`;
    } else {
      return `${filteredCount} listings`;
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: ListingFilter) => {
    setCurrentFilter(filter);
  };

  const isLoadingEffective = !isMounted || isLoading;
  const isFetchingEffective = isMounted && isFetching;

  return (
    <Layout isRefreshing={isFetchingEffective}>
      <div className="flex h-full">
        {/* Finder Pane (30% width) */}
        <FinderPane
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          inputRef={searchInputRef}
          onKeyDown={onKeyDown}
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
          listings={currentFilteredListings}
          selectedListingId={selectedListingId}
          onSelect={(id: string) => setSelectedListingId(id)}
          registerItemRef={registerItemRef}
          containerRef={containerRef}
          isLoading={isLoadingEffective}
          error={listingsError}
          resultsText={getResultsCountText()}
        />

        {/* Details Pane (70% width) */}
        <div className="hidden md:block md:w-2/3 p-6 overflow-y-auto">
          {currentSelectedListing ? (
            <ListingDetails
              listing={currentSelectedListing}
              preferences={preferences ?? null}
              isPreferencesLoading={isPreferencesLoading}
              preferencesError={preferencesError}
            />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No listing selected.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
