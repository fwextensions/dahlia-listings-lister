"use client";

import { useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SearchBox from "@/components/SearchBox";
import ListingItem from "@/components/ListingItem";
import ListingDetails from "@/components/ListingDetails";
import FilterBar, { ListingFilter } from "@/components/FilterBar";
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

  return (
    <Layout isRefreshing={isFetching}>
      <div className="flex h-full">
        {/* Finder Pane (30% width) */}
        <div
          className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
          onKeyDown={onKeyDown}
          tabIndex={0} // Make the container focusable
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SearchBox
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              inputRef={searchInputRef}
              onKeyDown={onKeyDown}
            />
            <FilterBar
              currentFilter={currentFilter}
              onFilterChange={handleFilterChange}
            />
            {!isLoading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {getResultsCountText()}
              </div>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto"
            ref={containerRef}
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#0077da] dark:text-blue-400 rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading listings...</p>
              </div>
            ) : listingsError && !directListings.length ? (
              <div className="p-4 text-center text-red-500 dark:text-red-400">
                Error loading listings: {listingsError.message}
              </div>
            ) : currentFilteredListings.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No listings found matching your criteria
              </div>
            ) : (
              currentFilteredListings.map((listing) => (
                <ListingItem
                  key={listing.Id}
                  listing={listing}
                  isSelected={listing.Id === selectedListingId}
                  onClick={() => setSelectedListingId(listing.Id)}
                  className="listing-item"
                  ref={(el: HTMLDivElement | null) => registerItemRef(listing.Id, el)}
                />
              ))
            )}
          </div>
        </div>

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
