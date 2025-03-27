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
			className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
				isSelected ? "bg-[#f0f7ff] border-l-[#0077da]" : "border-l-transparent"
			} ${className}`}
			onClick={onClick}
			ref={ref}
		>
			<h3 className="font-medium text-gray-900 truncate">{listing.Name}</h3>
			
			<div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
				<div className="grid grid-cols-[60px_1fr]">
					<span className="text-gray-500">Due:</span>
					<span className="font-medium text-left">{formatDueDate()}</span>
				</div>
				<div className="grid grid-cols-[60px_1fr]">
					<span className="text-gray-500">Type:</span>
					<span className="font-medium text-left">{listing.Listing_Type}</span>
				</div>
				<div className="grid grid-cols-[60px_1fr]">
					<span className="text-gray-500">Status:</span>
					<span className="font-medium text-left">{listing.Status}</span>
				</div>
				<div className="grid grid-cols-[60px_1fr]">
					<span className="text-gray-500">Tenure:</span>
					<span className="font-medium text-left">{listing.Tenure}</span>
				</div>
				<div className="grid grid-cols-[60px_1fr]">
					<span className="text-gray-500">Units:</span>
					<span className="font-medium text-left">{listing.Units_Available}</span>
				</div>
			</div>
		</div>
	);
});

// Add display name for better debugging
ListingItem.displayName = "ListingItem";

export default ListingItem;
