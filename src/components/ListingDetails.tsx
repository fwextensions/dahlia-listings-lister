import { Listing } from "@/types/listings";
import ImageCarousel from "./ImageCarousel";

interface ListingDetailsProps {
	listing: Listing | null;
}

export default function ListingDetails({ listing }: ListingDetailsProps) {
	if (!listing) {
		return (
			<div className="h-full flex items-center justify-center">
				<p className="text-gray-500">Select a listing to view details</p>
			</div>
		);
	}

	// Format date to YYYY-MM-DD
	const formatDate = (dateString: string) => {
		if (!dateString) return "N/A";
		
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "Invalid date";
			return date.toISOString().split("T")[0];
		} catch (error) {
			console.error("Error formatting date:", error);
			return "Date error";
		}
	};

	// Define which fields to display and in what order
	const detailFields = [
		{ label: "Name", value: listing.Name },
		{ label: "Building Name", value: listing.Building_Name },
		{ label: "Address", value: `${listing.Building_Street_Address}, ${listing.Building_City}, ${listing.Building_State} ${listing.Building_Zip_Code}` },
		{ label: "Status", value: listing.Status },
		{ label: "Tenure", value: listing.Tenure },
		{ label: "Type", value: listing.Listing_Type },
		{ label: "Units Available", value: listing.Units_Available.toString() },
		{ label: "Application Due Date", value: formatDate(listing.Application_Due_Date) },
		{ label: "Lottery Results Date", value: formatDate(listing.Lottery_Results_Date) },
		{ label: "Lottery Status", value: listing.Lottery_Status },
		{ label: "Accepting Online Applications", value: listing.Accepting_Online_Applications ? "Yes" : "No" },
		{ label: "Has Waitlist", value: listing.hasWaitlist ? "Yes" : "No" },
		{ label: "Record Type", value: listing.RecordType.Name },
		{ label: "Last Modified", value: formatDate(listing.LastModifiedDate) },
	];

	// Create unit summary section if available
	const unitSummaries = listing.unitSummaries.general.map((unit, index) => (
		<div key={index} className="border p-4 rounded-lg mb-4">
			<h3 className="font-medium text-lg mb-2">{unit.unitType} Unit</h3>
			<table className="w-full text-sm">
				<tbody>
					<tr>
						<td className="py-1 text-gray-600">Total Units:</td>
						<td className="py-1 font-medium">{unit.totalUnits}</td>
					</tr>
					<tr>
						<td className="py-1 text-gray-600">Square Feet:</td>
						<td className="py-1 font-medium">{unit.minSquareFt} - {unit.maxSquareFt}</td>
					</tr>
					{unit.minPriceWithParking && (
						<tr>
							<td className="py-1 text-gray-600">Price (with parking):</td>
							<td className="py-1 font-medium">${unit.minPriceWithParking.toLocaleString()}</td>
						</tr>
					)}
					{unit.minHoaDuesWithParking && (
						<tr>
							<td className="py-1 text-gray-600">HOA Dues:</td>
							<td className="py-1 font-medium">${unit.minHoaDuesWithParking}/month</td>
						</tr>
					)}
					<tr>
						<td className="py-1 text-gray-600">Min Occupancy:</td>
						<td className="py-1 font-medium">{unit.minOccupancy}</td>
					</tr>
				</tbody>
			</table>
		</div>
	));

	// Create the housing site URL
	const housingUrl = `https://housing.sfgov.org/listings/${listing.listingID || listing.Id}`;

	return (
		<div className="h-full overflow-y-auto">
			{listing.Listing_Images.length > 0 && (
				<div className="mb-6">
					<ImageCarousel images={listing.Listing_Images} />
				</div>
			)}

			<div className="bg-white rounded-lg shadow">
				<div className="p-6">
					<h2 className="text-2xl font-bold mb-2">{listing.Name}</h2>
					
					<div className="mb-6">
						<a 
							href={housingUrl} 
							target="_blank" 
							rel="noopener noreferrer" 
							className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							<svg 
								xmlns="http://www.w3.org/2000/svg" 
								className="h-5 w-5 mr-2" 
								viewBox="0 0 20 20" 
								fill="currentColor"
							>
								<path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
							</svg>
							View on Housing Portal
						</a>
					</div>
					
					<div className="overflow-hidden bg-white shadow sm:rounded-lg mb-6">
						<div className="px-4 py-5 sm:px-6">
							<h3 className="text-lg font-medium leading-6 text-gray-900">Listing Details</h3>
						</div>
						<div className="border-t border-gray-200">
							<dl>
								{detailFields.map((field, index) => (
									<div 
										key={index} 
										className={`px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
											index % 2 === 0 ? "bg-gray-50" : "bg-white"
										}`}
									>
										<dt className="text-sm font-medium text-gray-500">{field.label}</dt>
										<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{field.value}</dd>
									</div>
								))}
							</dl>
						</div>
					</div>

					{unitSummaries.length > 0 && (
						<div className="mt-8">
							<h3 className="text-lg font-medium mb-4">Unit Information</h3>
							{unitSummaries}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
