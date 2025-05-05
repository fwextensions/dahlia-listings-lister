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

// Helper to render the copy button
const CopyButton = ({ textToCopy, fieldLabel, index, copiedIndex, handleCopy }: { textToCopy: string, fieldLabel: string, index: number, copiedIndex: number | null, handleCopy: (text: string, index: number) => void }) => (
	<button
		onClick={() => handleCopy(textToCopy, index)}
		className="ml-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-800"
		title={`Copy ${fieldLabel}`}
	>
		{copiedIndex === index ? (
			// Checkmark icon
			<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
		) : (
			// Copy icon
			<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
		)}
	</button>
);


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
		setAddressForm(prev => ({ ...prev, [name]: value }));
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
				<p className="text-gray-500 dark:text-gray-400">Select a listing to view details</p>
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
				return <span className="text-gray-500 dark:text-gray-400 italic">Loading...</span>;
			}
			if (preferencesError) {
				return <span className="text-red-500 dark:text-red-400 italic">Error loading preferences.</span>;
			}
			if (!preferences || preferences.length === 0) {
				return <span className="text-gray-500 dark:text-gray-400 italic">None specified.</span>;
			}
			const uniqueShortCodes = [...new Set(preferences.map(p => p.preferenceShortCode))];
			return uniqueShortCodes.join(", ");
		})(),
	};

	const insertIndex = detailFields.findIndex(field => field.label === "Has Waitlist") + 1;
	if (insertIndex > 0) {
		detailFields.splice(insertIndex, 0, preferencesRow);
	}

	const hasNrhpPreference = preferences?.some(p => p.preferenceShortCode === "NRHP");

	// Create unit summary elements
	const unitSummaries = listing.unitSummaries?.general?.map((unit, index) => (
		<div key={index} className="border border-gray-200 dark:border-gray-700 p-4 rounded shadow-sm bg-white dark:bg-gray-800">
			<h4 className="font-medium text-base mb-2 text-gray-800 dark:text-gray-200">{unit.unitType} Unit</h4>
			<table className="w-full text-sm">
				<tbody>
					<tr className="border-b border-gray-100 dark:border-gray-700">
						<td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Total Units:</td>
						<td className="py-1 font-medium text-gray-800 dark:text-gray-200">{unit.totalUnits}</td>
					</tr>
					<tr className="border-b border-gray-100 dark:border-gray-700">
						<td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Square Feet:</td>
						<td className="py-1 font-medium text-gray-800 dark:text-gray-200">
							{unit.totalUnits === 1 ? unit.minSquareFt : `${unit.minSquareFt} - ${unit.maxSquareFt}`}
						</td>
					</tr>
					<tr className="border-b border-gray-100 dark:border-gray-700">
						<td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Income (%AMI):</td>
						<td className="py-1 font-medium text-gray-800 dark:text-gray-200">{unit.minPercentIncome}</td>
					</tr>
					<tr>
						<td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Monthly Rent:</td>
						<td className="py-1 font-medium text-gray-800 dark:text-gray-200">
							{unit.minMonthlyRent}
							{unit.minMonthlyRent && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(est.)</span>}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	)) || null;

	// Re-define URLs for DAHLIA/Salesforce links
	const housingUrl = `https://housing.sfgov.org/listings/${listing.listingID || listing.Id}`;
	const salesforceUrl = `https://sfhousing.lightning.force.com/lightning/r/Listing__c/${listing.Id}/view`;

	return (
		<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow">
			{/* Conditionally render Image Carousel */}
			{listing.Listing_Images && listing.Listing_Images.length > 0 && (
				<div className="mb-6">
					<ImageCarousel images={listing.Listing_Images} />
				</div>
			)}

			{/* Restored Header with Title and Links */}
			<div className="flex flex-wrap items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{listing.Name}</h2>
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

			{/* Listing Details Section */}
			<h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Listing Details</h2>
			<table className="w-full mb-6">
				<tbody>
					{detailFields.map((field, index) => (
						<tr key={field.label} className="border-b border-gray-200 dark:border-gray-700">
							<td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap align-top font-medium">{field.label}:</td>
							<td className="py-3 text-sm text-gray-900 dark:text-gray-100 align-top">
								{typeof field.value === 'string' ? (
									<span className="flex items-center justify-between">
										{field.value}
										<CopyButton textToCopy={field.value} fieldLabel={field.label} index={index} copiedIndex={copiedIndex} handleCopy={handleCopy} />
									</span>
								) : (
									field.value // Render JSX directly for Preferences
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Unit Summaries Section */}
			{unitSummaries && unitSummaries.length > 0 && (
				<div className="mt-6 mb-6">
					<h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Unit Summaries</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{unitSummaries}
					</div>
				</div>
			)}

			{/* NRHP Address Check Section */}
			{hasNrhpPreference && (
				<div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
					<h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">NRHP Boundary Check</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
						Check if an address falls within the Neighborhood Resident Housing Preference (NRHP) boundary for this listing.
					</p>
					<form onSubmit={handleAddressCheck} className="space-y-3">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label htmlFor="address1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 1</label>
								<input
									type="text"
									name="address1"
									id="address1"
									value={addressForm.address1}
									onChange={handleInputChange}
									required
									className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
									placeholder="e.g., 123 MAIN ST"
								/>
							</div>
							<div>
								<label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
								<input
									type="text"
									name="city"
									id="city"
									value={addressForm.city}
									onChange={handleInputChange}
									required
									className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
									placeholder="e.g., SAN FRANCISCO"
								/>
							</div>
							<div>
								<label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
								<input
									type="text"
									name="state"
									id="state"
									value={addressForm.state}
									onChange={handleInputChange}
									required
									maxLength={2}
									className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
									placeholder="e.g., CA"
								/>
							</div>
							<div>
								<label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zip Code</label>
								<input
									type="text"
									name="zip"
									id="zip"
									value={addressForm.zip}
									onChange={handleInputChange}
									required
									pattern="^\d{5}(-\d{4})?$"
									className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
									placeholder="e.g., 94103 or 94103-1234"
								/>
							</div>
						</div>
						<button
							type="submit"
							disabled={isCheckingAddress}
							className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0077da] hover:bg-[#0066c0] transition-colors"
						>
							{isCheckingAddress ? (
								<>
									<span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" role="status"></span>
									Checking...
								</>
							) : (
								"Check Address"
							)}
						</button>
						{addressCheckError && (
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">Error: {addressCheckError.message}</p>
						)}
						{gisResult && (
							<div className={`mt-3 p-3 rounded-md text-sm ${
								gisResult.isMatch
									? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
									: gisResult.message.includes("not determine")
										? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
										: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
							}`}>
								{gisResult.message}
							</div>
						)}
					</form>
				</div>
			)}
		</div>
	);
}