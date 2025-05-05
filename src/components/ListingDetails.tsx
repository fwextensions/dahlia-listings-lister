import { Listing, LotteryBucket } from "@/types/listings";
import ImageCarousel from "./ImageCarousel";
import { useState, useCallback, useEffect, JSX, FormEvent, ChangeEvent } from "react";

interface ListingDetailsProps {
	listing: Listing | null;
	preferences: LotteryBucket[] | null;
	isPreferencesLoading: boolean;
	preferencesError: Error | null;
}

interface DetailField {
	label: string;
	value: string | JSX.Element; // Allow string or JSX
}

export default function ListingDetails({
	listing,
	preferences,
	isPreferencesLoading,
	preferencesError,
}: ListingDetailsProps) {
	// State for NRHP address check form
	const [addressForm, setAddressForm] = useState({
		address1: "",
		city: "",
		state: "",
		zip: "",
	});
	const [gisResult, setGisResult] = useState<{ message: string; isMatch: boolean } | null>(null);
	const [isCheckingAddress, setIsCheckingAddress] = useState(false);
	const [addressCheckError, setAddressCheckError] = useState<Error | null>(null);

	// State to track which item was copied
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	// Function to copy text to clipboard
	const handleCopy = useCallback((text: string, index: number) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 1500); // Reset after 1.5 seconds
		}).catch(err => {
			console.error("Failed to copy text: ", err);
			// Optionally, provide user feedback about the error
		});
	}, []);

	// Reset address form when listing changes
	useEffect(() => {
		setAddressForm({ address1: "", city: "", state: "", zip: "" });
		setGisResult(null);
		setIsCheckingAddress(false);
		setAddressCheckError(null);
	}, [listing?.Id]); // Depend on listing ID

	const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAddressForm(prev => ({ ...prev, [name]: value.toUpperCase() })); // Uppercase values as per example
	}, []);

	const handleAddressCheck = useCallback(async (e: FormEvent) => {
		e.preventDefault(); // Prevent default form submission
		if (!listing) return;

		setIsCheckingAddress(true);
		setGisResult(null);
		setAddressCheckError(null);

		const payload = {
			address: {
				address1: addressForm.address1,
				city: addressForm.city,
				state: addressForm.state,
				zip: addressForm.zip,
			},
			listing: {
				Id: listing.Id,
				Name: listing.Name,
			},
		};

		try {
			const response = await fetch("/api/check-address", { // Use local API route
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			// Expect { isMatch: boolean, message: string } directly from our API route
			if (data && typeof data.isMatch === "boolean" && typeof data.message === "string") {
				setGisResult({
					message: data.message,
					isMatch: data.isMatch,
				});
			} else {
				// Handle potential error structure { message: string } from our API route
				const errorMessage = data?.message || "Invalid response format from API";
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error("Failed to check address:", error);
			setAddressCheckError(error instanceof Error ? error : new Error("An unknown error occurred"));
		} finally {
			setIsCheckingAddress(false);
		}
	}, [listing, addressForm]);

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
	const detailFields: DetailField[] = [
		{ label: "ID", value: listing.Id },
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
		// Preferences row will be added dynamically below
		{ label: "Record Type", value: listing.RecordType.Name },
		{ label: "Last Modified", value: formatDate(listing.LastModifiedDate) },
	];

	// Dynamically add the Preferences row based on loading/error/data state
	const preferencesRow: DetailField = {
		label: "Preferences",
		value: ((): string | JSX.Element => {
			if (isPreferencesLoading) {
				return <span className="text-gray-500 italic">Loading...</span>; // Italicized loading text
			}
			if (preferencesError) {
				return <span className="text-red-500 italic">Error loading preferences.</span>; // Italicized error text
			}
			if (!preferences || preferences.length === 0) {
				return <span className="text-gray-500 italic">None specified.</span>; // Italicized none text
			}
			// Extract unique short codes and join them
			const uniqueShortCodes = [...new Set(preferences.map(p => p.preferenceShortCode))];
			return uniqueShortCodes.join(", ");
		})(),
	};

	// Find the index after 'Has Waitlist' to insert Preferences
	const insertIndex = detailFields.findIndex(field => field.label === "Has Waitlist") + 1;
	// Insert the preferences row into the details array if found
	if (insertIndex > 0) { // Ensure 'Has Waitlist' was found
		detailFields.splice(insertIndex, 0, preferencesRow);
	}

	// Check if NRHP preference exists for conditional rendering
	const hasNrhpPreference = preferences?.some(p => p.preferenceShortCode === "NRHP");

	// Create unit summary section if available
	const unitSummaries = listing.unitSummaries && listing.unitSummaries.general ? listing.unitSummaries.general.map((unit, index) => (
		<div key={index} className="border border-gray-200 p-4 inline-block align-top">
			<h3 className="font-medium text-lg mb-2">{unit.unitType} Unit</h3>
			<table className="w-auto text-sm">
				<tbody>
					<tr>
						<td className="py-1 text-gray-600 pr-4">Total Units:</td>
						<td className="py-1 font-medium">{unit.totalUnits}</td>
					</tr>
					<tr>
						<td className="py-1 text-gray-600 pr-4">Square Feet:</td>
						<td className="py-1 font-medium">
							{unit.totalUnits === 1 
								? unit.minSquareFt 
								: `${unit.minSquareFt} - ${unit.maxSquareFt}`
							}
						</td>
					</tr>
					{unit.minPriceWithParking && (
						<tr>
							<td className="py-1 text-gray-600 pr-4">Price (with parking):</td>
							<td className="py-1 font-medium">${unit.minPriceWithParking.toLocaleString()}</td>
						</tr>
					)}
					{unit.minHoaDuesWithParking && (
						<tr>
							<td className="py-1 text-gray-600 pr-4">HOA Dues:</td>
							<td className="py-1 font-medium">${unit.minHoaDuesWithParking}/month</td>
						</tr>
					)}
					<tr>
						<td className="py-1 text-gray-600 pr-4">Min Occupancy:</td>
						<td className="py-1 font-medium">{unit.minOccupancy}</td>
					</tr>
				</tbody>
			</table>
		</div>
	)) : [];

	// Create the housing site URL
	const housingUrl = `https://housing.sfgov.org/listings/${listing.listingID || listing.Id}`;
	
	// Create the Salesforce URL
	const salesforceUrl = `https://sfhousing.lightning.force.com/lightning/r/Listing__c/${listing.Id}/view`;

	return (
		<div className="h-full overflow-y-auto">
			{listing.Listing_Images && listing.Listing_Images.length > 0 && (
				<div className="mb-6">
					<ImageCarousel images={listing.Listing_Images} />
				</div>
			)}

			<div className="bg-white shadow border border-gray-200">
				<div className="p-6">
					<div className="flex flex-wrap items-center justify-between mb-6">
						<h2 className="text-2xl font-bold">{listing.Name}</h2>
						
						<div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
							<a 
								href={housingUrl} 
								target="_blank" 
								rel="noopener noreferrer" 
								className="inline-flex items-center px-4 py-2 bg-[#0077da] text-white rounded-md hover:bg-[#0066c0] transition-colors"
							>
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									className="h-5 w-5 mr-2" 
									viewBox="0 0 20 20" 
									fill="currentColor"
								>
									<path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
								</svg>
								DAHLIA
							</a>
							
							<a 
								href={salesforceUrl} 
								target="_blank" 
								rel="noopener noreferrer" 
								className="inline-flex items-center px-4 py-2 bg-[#0077da] text-white rounded-md hover:bg-[#0066c0] transition-colors"
							>
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									className="h-5 w-5 mr-2" 
									viewBox="0 0 20 20" 
									fill="currentColor"
								>
									<path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
								</svg>
								Salesforce
							</a>
						</div>
					</div>
					
					<div className="overflow-hidden bg-white shadow border border-gray-200 mb-6">
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
										<dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 flex justify-between items-center">
											{typeof field.value === 'string' ? (
												<>
													<span>{field.value}</span>
													<button 
														onClick={() => handleCopy(String(field.value), index)}
														className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-2 flex-shrink-0" 
														title="Copy to clipboard"
													>
														{copiedIndex === index ? (
															<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
																<path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
															</svg>
														) : (
															<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
																<path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
															</svg>
														)}
													</button>
												</>
											) : (
												// Render JSX elements (like the preferences status) directly
												field.value
											)}
										</dd>
									</div>
								))}
							</dl>
						</div>
					</div>

					{listing.unitSummaries && listing.unitSummaries.general && listing.unitSummaries.general.length > 0 && (
						<div className="mt-8">
							<h3 className="text-lg font-medium mb-4">Unit Information</h3>
							<div className="flex flex-wrap gap-4">
								{unitSummaries}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* NRHP Address Check Form */}
			{hasNrhpPreference && (
				<div className="mt-6 p-6 bg-gray-50 shadow border border-gray-200">
					<h3 className="text-xl font-semibold mb-4">Check Address (NRHP)</h3>
					<form onSubmit={handleAddressCheck}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
								<input
									type="text"
									id="address1"
									name="address1"
									value={addressForm.address1}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
								<input
									type="text"
									id="city"
									name="city"
									value={addressForm.city}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
								<input
									type="text"
									id="state"
									name="state"
									value={addressForm.state}
									onChange={handleInputChange}
									maxLength={2} // Standard state abbreviation
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
								<input
									type="text"
									id="zip"
									name="zip"
									value={addressForm.zip}
									onChange={handleInputChange}
									pattern="^\d{5}(-\d{4})?$" // Basic US Zip code pattern
									title="Please enter a valid 5-digit or 9-digit zip code."
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									required
								/>
							</div>
						</div>
						<button
							type="submit"
							disabled={isCheckingAddress}
							className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isCheckingAddress ? "Checking..." : "Check Address"}
						</button>
					</form>

					{/* Result/Error Display */}
					<div className="mt-4">
						{isCheckingAddress && (
							<p className="text-sm text-gray-600 italic">Checking address...</p>
						)}
						{addressCheckError && (
							<p className="text-sm text-red-600">Error: {addressCheckError.message}</p>
						)}
						{gisResult && (
							<p className={`text-sm font-medium ${gisResult.isMatch ? "text-green-600" : "text-red-600"}`}>
								{gisResult.message}
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
