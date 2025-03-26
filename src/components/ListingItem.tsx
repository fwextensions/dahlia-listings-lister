import { Listing } from "@/types/listings";

interface ListingItemProps {
	listing: Listing;
	isSelected: boolean;
	onClick: () => void;
}

export default function ListingItem({ listing, isSelected, onClick }: ListingItemProps) {
	return (
		<div
			className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
				isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
			}`}
			onClick={onClick}
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
			</div>
		</div>
	);
}
