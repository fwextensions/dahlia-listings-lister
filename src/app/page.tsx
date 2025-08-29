"use client";

import { useEffect, useState, useRef, KeyboardEvent as ReactKeyboardEvent, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SearchBox from "@/components/SearchBox";
import ListingItem from "@/components/ListingItem";
import ListingDetails from "@/components/ListingDetails";
import FilterBar, { ListingFilter } from "@/components/FilterBar";
import { useDebounce } from "@/hooks/useDebounce";
import { Listing, LotteryBucket } from "@/types/listings"; // Import LotteryBucket
import { fetchListings, getCachedListings } from "@/utils/api"; // Import getCachedListings

export default function Home() {
	const [directListings, setDirectListings] = useState<Listing[]>([]);
	const [isDirectLoading, setIsDirectLoading] = useState<boolean>(false);
	const [directError, setDirectError] = useState<Error | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 250); // Debounce the search term with 250ms delay
	const [currentFilter, setCurrentFilter] = useState<ListingFilter>("All");
	const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  // while we determine if cache exists on the client, avoid showing spinner or empty state
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Keep track of the current filtered listings for keyboard navigation
  const filteredListingsRef = useRef<Listing[]>([]);
  // Track previous search term to detect changes
  const prevSearchTermRef = useRef<string>("");
  // Track if initial data has been loaded
  const initialDataLoadedRef = useRef<boolean>(false);
  // Track if we're refreshing data
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for preferences
  // handled via react-query below

  // Focus the search box when the page loads
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // load saved filter from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("listingFilter");
      if (saved === "All" || saved === "Rental" || saved === "Sales") {
        setCurrentFilter(saved as ListingFilter);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // persist filter to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("listingFilter", currentFilter);
    } catch {
      // ignore storage errors
    }
  }, [currentFilter]);


  // Function to fetch fresh data - use useCallback to avoid dependency issues
  const fetchFreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log("Fetching fresh listings data");

      // Use the fetchListings function from the API utility
      const data = await fetchListings();

      if (data && data.listings && Array.isArray(data.listings)) {
        console.log("Fresh listings data loaded");
        setDirectListings(data.listings);

        // Select the first listing by default if no selection exists
        if (data.listings.length > 0 && !selectedListingId) {
          setSelectedListingId(data.listings[0].Id);
        }

        initialDataLoadedRef.current = true;
      } else {
        console.error("Invalid data format:", data);
        setDirectError(new Error("Invalid data format"));
      }
    } catch (error) {
      console.error("Error fetching fresh data:", error);
      if (!initialDataLoadedRef.current) {
        // Only set error if we don't have cached data
        setDirectError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setIsDirectLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedListingId]); // Add selectedListingId as dependency

  // on mount, load cache (if any) to avoid spinner, then fetch fresh
  useEffect(() => {
    const cached = getCachedListings();
    if (cached && Array.isArray(cached.listings) && cached.listings.length > 0) {
      console.log("Hydrating from cached listings on mount");
      setDirectListings(cached.listings);
      initialDataLoadedRef.current = true;
      if (!selectedListingId) {
        setSelectedListingId(cached.listings[0].Id);
      }
      // keep isDirectLoading false to prevent spinner while we refresh
    } else {
      // no cache; show spinner while fetching
      setIsDirectLoading(true);
    }
    fetchFreshData();
    setIsBootstrapping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Helper function to compare dates for sorting
  const compareDates = (a: Listing, b: Listing) => {
    // If either date is missing, put it at the end
    if (!a.Application_Due_Date) return 1;
    if (!b.Application_Due_Date) return -1;

    // Parse dates
    const dateA = new Date(a.Application_Due_Date);
    const dateB = new Date(b.Application_Due_Date);

    // Check for invalid dates
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    // Sort descending (most recent first)
    return dateB.getTime() - dateA.getTime();
  };

  // Filter listings based on search term - memoized to prevent unnecessary recalculations
  const filteredListings = useCallback(() => {
    if (!directListings.length) return [];

    let filtered: Listing[];

    // First apply the type filter
    let typeFiltered = directListings;
    if (currentFilter !== "All") {
      typeFiltered = directListings.filter((listing) => {
        if (currentFilter === "Rental") {
          return listing.RecordType && listing.RecordType.Name === "Rental";
        } else if (currentFilter === "Sales") {
          return listing.RecordType && listing.RecordType.Name === "Ownership";
        }
        return true;
      });
    }

    // Then apply the search term filter
    if (!debouncedSearchTerm) {
      // Sort by application due date descending
      filtered = [...typeFiltered].sort(compareDates);
    } else {
      const searchTermLower = debouncedSearchTerm.toLowerCase();

      filtered = typeFiltered.filter((listing) => {
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
      }).sort(compareDates); // Sort filtered results by application due date descending
    }

    return filtered;
  }, [directListings, debouncedSearchTerm, currentFilter]); // Use debouncedSearchTerm instead of searchTerm

  // Memoize the filtered listings to prevent recalculation on every render
  const currentFilteredListings = filteredListings();

  // Track when filtered listings change
  useEffect(() => {
    // Update the ref with the current filtered listings
    filteredListingsRef.current = currentFilteredListings;
  }, [currentFilteredListings]);

  // Update selected listing when search term or filter changes
  useEffect(() => {
    // Skip if nothing has loaded yet
    if (isDirectLoading) return;

    // Check if search term has changed
    if (debouncedSearchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = debouncedSearchTerm;
    }

    // Get the current filtered listings
    const currentFiltered = filteredListingsRef.current;

    // If no results match, clear the selection
    if (currentFiltered.length === 0) {
      setSelectedListingId(null);
      return;
    }

    // Check if current selection is still in filtered results
    const isCurrentSelectionInFiltered = selectedListingId &&
      currentFiltered.some(listing => listing.Id === selectedListingId);

    // If not, select the first item in the filtered results
    if (!isCurrentSelectionInFiltered && currentFiltered.length > 0) {
      setSelectedListingId(currentFiltered[0].Id);
    }
  }, [debouncedSearchTerm, currentFilter, isDirectLoading, selectedListingId]); // Use debouncedSearchTerm instead of searchTerm

  // Get the selected listing - memoized to prevent unnecessary lookups
  const selectedListing = useCallback(() => {
    if (!selectedListingId) return null;

    // If there are no filtered results, return null
    if (currentFilteredListings.length === 0) return null;

    return directListings.find(listing => listing.Id === selectedListingId) || null;
  }, [directListings, selectedListingId, currentFilteredListings.length]); // Include filtered listings length as dependency

  // Current selected listing
  const currentSelectedListing = selectedListing();

  // Scroll selected item into view when selection changes
  useEffect(() => {
    if (selectedListingId && listItemRefs.current[selectedListingId]) {
      listItemRefs.current[selectedListingId]?.scrollIntoView({
        behavior: "auto",
        block: "nearest",
      });
    }
  }, [selectedListingId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    const currentFiltered = filteredListingsRef.current;
    if (!currentFiltered.length) return;

    // Only process navigation keys
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End") {
      e.preventDefault(); // Prevent scrolling

      // Get current index in the filtered list
      const currentIndex = selectedListingId
        ? currentFiltered.findIndex(listing => listing.Id === selectedListingId)
        : -1;

      // Calculate number of items visible in the viewport (approximate page size)
      const listingsContainer = listingsContainerRef.current;
      let pageSize = 5; // Default page size if we can't calculate

      if (listingsContainer) {
        const containerHeight = listingsContainer.clientHeight;
        // Estimate item height (assuming all items have roughly the same height)
        const sampleItem = Object.values(listItemRefs.current).find(ref => ref !== null);
        if (sampleItem) {
          const itemHeight = sampleItem.clientHeight;
          pageSize = Math.max(1, Math.floor(containerHeight / itemHeight));
        }
      }

      if (e.key === "ArrowDown") {
        // Move selection down
        if (currentIndex < currentFiltered.length - 1) {
          const nextIndex = currentIndex + 1;
          setSelectedListingId(currentFiltered[nextIndex].Id);
        }
      } else if (e.key === "ArrowUp") {
        // Move selection up
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          setSelectedListingId(currentFiltered[prevIndex].Id);
        }
      } else if (e.key === "PageDown") {
        // Move selection down by a page
        if (currentIndex < currentFiltered.length - 1) {
          const nextIndex = Math.min(currentIndex + pageSize, currentFiltered.length - 1);
          setSelectedListingId(currentFiltered[nextIndex].Id);
        }
      } else if (e.key === "PageUp") {
        // Move selection up by a page
        if (currentIndex > 0) {
          const prevIndex = Math.max(currentIndex - pageSize, 0);
          setSelectedListingId(currentFiltered[prevIndex].Id);
        }
      } else if (e.key === "Home") {
        // Move to the first item in the list
        if (currentFiltered.length > 0) {
          setSelectedListingId(currentFiltered[0].Id);
        }
      } else if (e.key === "End") {
        // Move to the last item in the list
        if (currentFiltered.length > 0) {
          setSelectedListingId(currentFiltered[currentFiltered.length - 1].Id);
        }
      }
    }
  };

  // Function to set ref for a listing item
  const setListItemRef = (id: string, element: HTMLDivElement | null) => {
    listItemRefs.current[id] = element;
  };

  // Get text for results count
  const getResultsCountText = () => {
    const filteredCount = currentFilteredListings.length;

    if (isDirectLoading) {
      return "Loading listings...";
    }

    if (directError) {
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
    <Layout isRefreshing={isRefreshing}>
      <div className="flex h-full">
        {/* Finder Pane (30% width) */}
        <div
          className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
          onKeyDown={handleKeyDown}
          tabIndex={0} // Make the container focusable
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <SearchBox
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              inputRef={searchInputRef}
              onKeyDown={handleKeyDown}
            />
            <FilterBar
              currentFilter={currentFilter}
              onFilterChange={handleFilterChange}
            />
            {!isBootstrapping && !isDirectLoading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {getResultsCountText()}
              </div>
            )}
          </div>
          <div
            className="flex-1 overflow-y-auto"
            ref={listingsContainerRef}
          >
            {isDirectLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#0077da] dark:text-blue-400 rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading listings...</p>
              </div>
            ) : directError && !directListings.length ? (
              <div className="p-4 text-center text-red-500 dark:text-red-400">
                Error loading listings: {directError.message}
              </div>
            ) : currentFilteredListings.length === 0 && !isBootstrapping ? (
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
                  ref={(el: HTMLDivElement | null) => setListItemRef(listing.Id, el)}
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
