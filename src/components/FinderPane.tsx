"use client";

import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import SearchBox from "@/components/SearchBox";
import FilterBar, { ListingFilter } from "@/components/FilterBar";
import ListingItem from "@/components/ListingItem";
import type { ListingSummary } from "@/types/listing-summary";

interface FinderPaneProps {
	// search
	searchTerm: string;
	onSearchChange: (value: string) => void;
	inputRef?: RefObject<HTMLInputElement | null>;
	onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement | HTMLInputElement>) => void;

	// filter
	currentFilter: ListingFilter;
	onFilterChange: (filter: ListingFilter) => void;

	// list
	listings: ListingSummary[];
	selectedListingId: string | null;
	onSelect: (id: string) => void;
	registerItemRef: (id: string, el: HTMLDivElement | null) => void;
	containerRef: RefObject<HTMLDivElement | null>;

	// status
	isLoading: boolean;
	error: Error | null | undefined;

	// helper text
	resultsText: string;
}

export default function FinderPane({
	searchTerm,
	onSearchChange,
	inputRef,
	onKeyDown,
	currentFilter,
	onFilterChange,
	listings,
	selectedListingId,
	onSelect,
	registerItemRef,
	containerRef,
	isLoading,
	error,
	resultsText,
}: FinderPaneProps) {
	return (
		<div
			className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
			onKeyDown={onKeyDown}
			tabIndex={0}
		>
			<div className="p-4 border-b border-gray-200 dark:border-gray-700">
				<SearchBox
					searchTerm={searchTerm}
					onSearchChange={onSearchChange}
					inputRef={inputRef}
					onKeyDown={onKeyDown}
				/>
				<FilterBar
					currentFilter={currentFilter}
					onFilterChange={onFilterChange}
				/>
				{!isLoading && (
					<div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						{resultsText}
					</div>
				)}
			</div>
			<div className="flex-1 overflow-y-auto" ref={containerRef}>
				{isLoading ? (
					<div className="p-4 text-center">
						<div
							className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#0077da] dark:text-blue-400 rounded-full"
							role="status"
						>
							<span className="sr-only">Loading...</span>
						</div>
						<p className="mt-2 text-gray-500 dark:text-gray-400">Loading listings...</p>
					</div>
				) : error && !listings.length ? (
					<div className="p-4 text-center text-red-500 dark:text-red-400">
						Error loading listings: {error.message}
					</div>
				) : listings.length === 0 ? (
					<div className="p-4 text-center text-gray-500 dark:text-gray-400">
						No listings found matching your criteria
					</div>
				) : (
					listings.map((listing) => (
						<ListingItem
							key={listing.Id}
							listing={listing}
							isSelected={listing.Id === selectedListingId}
							onClick={() => onSelect(listing.Id)}
							className="listing-item"
							ref={(el: HTMLDivElement | null) => registerItemRef(listing.Id, el)}
						/>
					))
				)}
			</div>
		</div>
	);
}
