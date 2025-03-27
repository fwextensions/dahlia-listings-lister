"use client";

import { useEffect, useState, useRef, KeyboardEvent as ReactKeyboardEvent, useCallback } from "react";
import Layout from "@/components/Layout";
import SearchBox from "@/components/SearchBox";
import ListingItem from "@/components/ListingItem";
import ListingDetails from "@/components/ListingDetails";
import FilterBar, { ListingFilter } from "@/components/FilterBar";
import { Listing } from "@/types/listings";

export default function Home() {
  const [directListings, setDirectListings] = useState<Listing[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(true);
  const [directError, setDirectError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilter, setCurrentFilter] = useState<ListingFilter>("All");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Keep track of the current filtered listings for keyboard navigation
  const filteredListingsRef = useRef<Listing[]>([]);
  // Track previous search term to detect changes
  const prevSearchTermRef = useRef<string>("");
  // Track if initial data has been loaded
  const initialDataLoadedRef = useRef<boolean>(false);

  // Add direct fetch for debugging and actual display - only run once
  useEffect(() => {
    // Skip if we've already loaded the data
    if (initialDataLoadedRef.current) return;
    
    console.log("Page component mounted - fetching data");
    
    const fetchDirectly = async () => {
      try {
        setIsDirectLoading(true);
        console.log("Directly fetching listings.json");
        const response = await fetch("/listings.json");
        if (!response.ok) {
          throw new Error(`Direct fetch failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log("Direct fetch succeeded:", data);
        
        if (data && data.listings && Array.isArray(data.listings)) {
          setDirectListings(data.listings);
          
          // Select the first listing by default if no selection exists
          if (data.listings.length > 0 && !selectedListingId) {
            setSelectedListingId(data.listings[0].Id);
          }
          
          // Mark that we've loaded the initial data
          initialDataLoadedRef.current = true;
        } else {
          console.error("Invalid data format:", data);
          setDirectError(new Error("Invalid data format"));
        }
      } catch (error) {
        console.error("Direct fetch error:", error);
        setDirectError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsDirectLoading(false);
      }
    };
    
    fetchDirectly();
  }, [selectedListingId]); // Include selectedListingId to fix the lint warning

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
    if (!searchTerm) {
      // Sort by application due date descending
      filtered = [...typeFiltered].sort(compareDates);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      
      filtered = typeFiltered.filter((listing) => {
        // For Id, only match exactly
        if (listing.Id === searchTerm) {
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
  }, [directListings, searchTerm, currentFilter]); // Add currentFilter as a dependency

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
    if (searchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = searchTerm;
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
  }, [searchTerm, currentFilter, isDirectLoading, selectedListingId]);

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
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedListingId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    const currentFiltered = filteredListingsRef.current;
    if (!currentFiltered.length) return;
    
    // Get current index in the filtered list
    const currentIndex = selectedListingId 
      ? currentFiltered.findIndex(listing => listing.Id === selectedListingId)
      : -1;
    
    if (e.key === "ArrowDown") {
      e.preventDefault(); // Prevent scrolling
      
      // Move selection down
      if (currentIndex < currentFiltered.length - 1) {
        const nextIndex = currentIndex + 1;
        setSelectedListingId(currentFiltered[nextIndex].Id);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); // Prevent scrolling
      
      // Move selection up
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        setSelectedListingId(currentFiltered[prevIndex].Id);
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
      if (searchTerm && currentFilter !== "All") {
        return `No listings match "${searchTerm}" with filter: ${currentFilter}`;
      } else if (searchTerm) {
        return `No listings match "${searchTerm}"`;
      } else if (currentFilter !== "All") {
        return `No ${currentFilter} listings found`;
      } else {
        return "No listings found";
      }
    }
    
    if (searchTerm && currentFilter !== "All") {
      return `${filteredCount} ${currentFilter} listings match "${searchTerm}"`;
    } else if (searchTerm) {
      return `${filteredCount} listings match "${searchTerm}"`;
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

  // Debug: Log the state in the component
  console.log("Page component - filteredListings:", currentFilteredListings.length);
  console.log("Page component - isDirectLoading:", isDirectLoading);
  console.log("Page component - directError:", directError);

  return (
    <Layout>
      <div className="flex h-full">
        {/* Finder Pane (30% width) */}
        <div 
          className="w-full md:w-1/3 border-r flex flex-col h-full"
          onKeyDown={handleKeyDown}
          tabIndex={0} // Make the container focusable
        >
          <div className="p-4 border-b">
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
            {!isDirectLoading && (
              <div className="mt-2 text-sm text-gray-500">
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
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#0077da] rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading listings...</p>
              </div>
            ) : directError ? (
              <div className="p-4 text-center text-red-500">
                <p>Error loading listings: {directError.message}</p>
              </div>
            ) : currentFilteredListings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No listings found matching your search.</p>
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
            <ListingDetails listing={currentSelectedListing} />
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No listing selected.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
