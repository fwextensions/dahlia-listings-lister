import React from "react";

export type ListingFilter = "All" | "Rental" | "Sales";

interface FilterBarProps {
	currentFilter: ListingFilter;
	onFilterChange: (filter: ListingFilter) => void;
}

export default function FilterBar({ currentFilter, onFilterChange }: FilterBarProps) {
	const filters: ListingFilter[] = ["All", "Rental", "Sales"];
	
	return (
		<div className="flex space-x-2 mt-2 mb-3">
			{filters.map((filter) => (
				<button
					key={filter}
					className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
						currentFilter === filter
							? "bg-[#0077da] text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
					}`}
					onClick={() => onFilterChange(filter)}
				>
					{filter}
				</button>
			))}
		</div>
	);
}
