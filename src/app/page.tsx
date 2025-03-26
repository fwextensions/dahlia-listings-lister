"use client";

import { useEffect, useState, useRef, KeyboardEvent as ReactKeyboardEvent } from "react";
import Layout from "@/components/Layout";
import SearchBox from "@/components/SearchBox";
import ListingItem from "@/components/ListingItem";
import ListingDetails from "@/components/ListingDetails";
import { Listing } from "@/types/listings";

export default function Home() {
  const [directListings, setDirectListings] = useState<Listing[]>([]);
  const [isDirectLoading, setIsDirectLoading] = useState(true);
  const [directError, setDirectError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listingsContainerRef = useRef<HTMLDivElement>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Keep track of the current filtered listings for keyboard navigation
  const filteredListingsRef = useRef<Listing[]>([]);

  // Add direct fetch for debugging and actual display
  useEffect(() => {
    console.log("Page component mounted");
    
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
          
          // Select the first listing by default
          if (data.listings.length > 0 && !selectedListingId) {
            setSelectedListingId(data.listings[0].Id);
          }
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
  }, [selectedListingId]);

  // Filter listings based on search term
  const filteredListings = (() => {
    if (!directListings.length) return [];
    
    let filtered: Listing[];
    
    if (!searchTerm) {
      filtered = [...directListings].sort((a, b) => a.Name.localeCompare(b.Name));
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      
      filtered = directListings.filter((listing) => {
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
      }).sort((a, b) => a.Name.localeCompare(b.Name));
    }
    
    // Update the ref with the current filtered listings
    filteredListingsRef.current = filtered;
    
    return filtered;
  })();

  // Get the selected listing
  const selectedListing = selectedListingId 
    ? directListings.find(listing => listing.Id === selectedListingId) || null
    : null;

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

  // Debug: Log the state in the component
  console.log("Page component - filteredListings:", filteredListings.length);
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
          </div>
          <div 
            className="flex-1 overflow-y-auto" 
            ref={listingsContainerRef}
          >
            {isDirectLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading listings...</p>
              </div>
            ) : directError ? (
              <div className="p-4 text-center text-red-500">
                <p>Error loading listings: {directError.message}</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No listings found matching your search.</p>
              </div>
            ) : (
              filteredListings.map((listing) => (
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
          <ListingDetails listing={selectedListing} />
        </div>
      </div>
    </Layout>
  );
}
