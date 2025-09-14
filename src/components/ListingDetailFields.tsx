import { Listing } from "@/types/listings";
import { JSX, useCallback, useState } from "react";
import AsyncFieldValue from "@/components/AsyncFieldValue";
import CopyButton from "@/components/CopyButton";
import type { ListingDetailsClient } from "@/hooks/useListingDetailsQuery";

function sortPreferences(listingDetails: ListingDetailsClient | null)
{
	const list = listingDetails?.Listing_Lottery_Preferences;

	if (!list || list.length === 0) {
		return "";
	}

	const sorted = list.toSorted((a, b) =>
		(a.Order ?? Number.MAX_SAFE_INTEGER) - (b.Order ?? Number.MAX_SAFE_INTEGER));
	const codes = sorted
		.map(p => p.Lottery_Preference?.Preference_Short_Code)
		.filter((c): c is string => !!c);

	return [...new Set(codes)].join(", ");
}

function createAsyncValue<T extends object>(
	data: T | null,
	isLoading: boolean,
	error: Error | null)
{
	return function asyncValue<K extends keyof T & string>(
		label: string,
		key: K,
		createValue?: (data: T | null) => string,
	): DetailField {
		const value = createValue
			? createValue(data)
			: data?.[key];
		const typedValue = typeof value === "string" ? value : undefined;

		return {
			label,
			value: (
				<AsyncFieldValue
					value={typedValue}
					isLoading={isLoading}
					error={error}
					errorText={`Error loading "${label}".`}
				/>
			),
			copyText: typedValue
		};
	};
}

interface DetailField {
	label: string;
	value: string | JSX.Element | undefined | null; // Allow string or JSX
	copyText?: string | undefined | null; // text to copy even if value is rendered via JSX
}

interface ListingDetailFieldsProps {
	listing: Listing;
	listingDetails: ListingDetailsClient | null;
	isDetailsLoading: boolean;
	detailsError: Error | null;
	formatDate: (dateString: string) => string;
}

export default function ListingDetailFields({
	listing,
	listingDetails,
	isDetailsLoading,
	detailsError,
	formatDate,
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

	const asyncValue = createAsyncValue(listingDetails, isDetailsLoading, detailsError);

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
		asyncValue("Preferences", "Listing_Lottery_Preferences", sortPreferences),
		asyncValue("Project ID", "Project_ID"),
		asyncValue("Program Type", "Program_Type"),
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
