import { Listing, LotteryBucket } from "@/types/listings";
import { JSX, useCallback, useState } from "react";
import AsyncFieldValue from "@/components/AsyncFieldValue";
import CopyButton from "@/components/CopyButton";

interface DetailField {
	label: string;
	value: string | JSX.Element; // Allow string or JSX
	copyText?: string | null; // text to copy even if value is rendered via JSX
}

interface ListingDetailFieldsProps {
	listing: Listing;
	preferences: LotteryBucket[] | null;
	isPreferencesLoading: boolean;
	preferencesError: Error | null;
	formatDate: (dateString: string) => string;
	projectId: string | null;
	isDetailsLoading: boolean;
	detailsError: Error | null;
}

export default function ListingDetailFields({
	listing,
	preferences,
	isPreferencesLoading,
	preferencesError,
	formatDate,
	projectId,
	isDetailsLoading,
	detailsError,
}: ListingDetailFieldsProps) {
	const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

	const handleCopy = useCallback((text: string, index: number) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 1500);
		}).catch(err => {
			console.error("Failed to copy text: ", err);
		});
	}, []);
	const preferencesText = preferences?.length
		? [...new Set(preferences.map(p => p.preferenceShortCode))].join(", ")
		: null;

	const detailFields: DetailField[] = [
		{ label: "ID", value: listing.Id },
		{ label: "Name", value: listing.Name },
		{ label: "Building Name", value: listing.Building_Name },
		{
			label: "Address",
			value: `${listing.Building_Street_Address}, ${listing.Building_City}, ${listing.Building_State} ${listing.Building_Zip_Code}`
		},
		{ label: "Units Available", value: listing.Units_Available.toString() },
		{ label: "Status", value: listing.Status },
		{ label: "Type", value: listing.Listing_Type },
		{
			label: "Application Due Date",
			value: formatDate(listing.Application_Due_Date)
		},
		{
			label: "Lottery Results Date",
			value: formatDate(listing.Lottery_Results_Date)
		},
		{ label: "Lottery Status", value: listing.Lottery_Status },
		{ label: "Has Waitlist", value: listing.hasWaitlist ? "Yes" : "No" },
		{
			label: "Preferences",
			value: (
				<AsyncFieldValue
					value={preferencesText}
					isLoading={isPreferencesLoading}
					error={preferencesError}
					emptyText="None specified."
					errorText="Error loading preferences."
				/>
			),
			copyText: preferencesText,
		},
		{
			label: "Project ID",
			value: (
				<AsyncFieldValue
					value={projectId}
					isLoading={isDetailsLoading}
					error={detailsError}
					errorText="Error loading project ID."
				/>
			),
			copyText: projectId ?? null,
		},
		{ label: "Record Type", value: listing.RecordType.Name },
		{ label: "Tenure", value: listing.Tenure },
		{ label: "Last Modified", value: formatDate(listing.LastModifiedDate) },
	];

	return (
		<>
			<h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
				Listing Details
			</h2>
			<table className="w-full mb-6">
				<tbody>
				{detailFields.map((field, index) => (
					<tr key={field.label +
						index} className="border-b border-gray-200 dark:border-gray-700 align-middle">
						<td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">{field.label}:</td>
						<td className="py-3 w-full text-sm text-gray-900 dark:text-gray-100">
							{field.value}
						</td>
						<td className="py-3 pl-4 w-0">
							<CopyButton
								textToCopy={field.copyText ?? (typeof field.value === "string" ? field.value : "")}
								fieldLabel={field.label}
								index={index}
								copiedIndex={copiedIndex}
								handleCopy={handleCopy}
							/>
						</td>
					</tr>
				))}
				</tbody>
			</table>
		</>
	);
}
