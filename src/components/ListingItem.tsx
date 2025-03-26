import { Listing } from "@/types/listings";
import { forwardRef, ForwardedRef } from "react";

interface ListingItemProps {
	listing: Listing;
	isSelected: boolean;
	onClick: () => void;
	className?: string;
}

const ListingItem = forwardRef(({ 
	listing, 
	isSelected, 
	onClick, 
	className = "" 
}: ListingItemProps, ref: ForwardedRef<HTMLDivElement>) => {
	// Format application due date
	const formatDueDate = () => {
		if (!listing.Application_Due_Date) return "No due date";
		
		try {
			// Parse the date string (assuming it's in ISO format or similar)
			const date = new Date(listing.Application_Due_Date);
			
			// Check if the date is valid
			if (isNaN(date.getTime())) return "Invalid date";
			
			// Format the date as YYYY-MM-DD
			return date.toISOString().split("T")[0];
		} catch (error) {
			console.error("Error formatting application due date:", error);
			return "Date error";
		}
	};

	return (
		<div
			className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
				isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
			} ${className}`}
			onClick={onClick}
			ref={ref}
		>
			<h3 className="font-medium text-gray-900 truncate">{listing.Name}</h3>
			<div className="mt-1 text-sm text-gray-500 space-y-1">
				<div className="flex justify-between">
					<span>Type:</span>
					<span className="font-medium">{listing.Listing_Type}</span>
				</div>
				<div className="flex justify-between">
					<span>Status:</span>
					<span className="font-medium">{listing.Status}</span>
				</div>
				<div className="flex justify-between">
					<span>Tenure:</span>
					<span className="font-medium">{listing.Tenure}</span>
				</div>
				<div className="flex justify-between">
					<span>Units:</span>
					<span className="font-medium">{listing.Units_Available}</span>
				</div>
				<div className="flex justify-between">
					<span>Due Date:</span>
					<span className={`font-medium ${!listing.Application_Due_Date ? "text-gray-400 italic" : ""}`}>
						{formatDueDate()}
					</span>
				</div>
			</div>
		</div>
	);
});

// Add display name for better debugging
ListingItem.displayName = "ListingItem";

export default ListingItem;
