"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import FinderPane from "@/components/FinderPane";
import DetailsPane from "@/components/DetailsPane";
import type { ListingFilter } from "@/components/FilterBar";
import { useSearchTerm } from "@/hooks/useSearchTerm";
import { useListingFilter } from "@/hooks/useListingFilter";
import { useFilteredListings } from "@/hooks/useFilteredListings";
import { useListingSelection } from "@/hooks/useListingSelection";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import type { ListingSummary } from "@/types/listing-summary";
import type { Listing } from "@/types/listings";
import { useListingsQuery } from "@/hooks/useListingsQuery";
import { buildResultsText } from "@/utils/resultsText";

export default function Home() {
	const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearchTerm("");
	const { currentFilter, setCurrentFilter } = useListingFilter();
	const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

	// listings query via React Query seeded from localStorage
	const { data: listingsData, isLoading, isFetching, error: listingsError } = useListingsQuery();
	const directListingsFull = useMemo(() => (listingsData?.listings ?? []) as Listing[], [listingsData]);
	const directListings = useMemo(() => directListingsFull as unknown as ListingSummary[], [directListingsFull]);

  // State for preferences
  // handled via react-query below

  // Focus the search box when the page loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setIsMounted(true);
  }, []);

  // derive filtered + sorted listings
  const currentFilteredListings = useFilteredListings(directListings, debouncedSearchTerm, currentFilter);

  // selection managed by hook (summary)
  const { selectedListingId, setSelectedListingId } = useListingSelection(
    directListings,
    currentFilteredListings,
  );
  const currentSelectedListing = useMemo(() => {
    if (!selectedListingId) return null;
    return directListingsFull.find((l) => l.Id === selectedListingId) ?? null;
  }, [directListingsFull, selectedListingId]);

  // keyboard nav hook
  const { onKeyDown, registerItemRef, containerRef } = useKeyboardNavigation(
    currentFilteredListings,
    selectedListingId,
    (id: string) => setSelectedListingId(id),
  );

  const isLoadingEffective = !isMounted || isLoading;
  const isFetchingEffective = isMounted && isFetching;

  const resultsText = buildResultsText(
    currentFilteredListings.length,
    isLoadingEffective,
    listingsError,
    debouncedSearchTerm,
    currentFilter,
  );

  // Handle filter change
  const handleFilterChange = (filter: ListingFilter) => {
    setCurrentFilter(filter);
  };

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
          resultsText={resultsText}
        />

        {/* Details Pane (70% width) */}
        <div className="hidden md:block md:w-2/3 p-6 overflow-y-auto">
          <DetailsPane listing={currentSelectedListing} />
        </div>
      </div>
    </Layout>
  );
}
