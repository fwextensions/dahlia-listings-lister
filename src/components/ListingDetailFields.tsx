import { Listing, LotteryBucket } from "@/types/listings";
import { useState, useCallback, JSX } from "react";

// DetailField interface (moved from ListingDetails.tsx)
interface DetailField {
    label: string;
    value: string | JSX.Element; // Allow string or JSX
}

// CopyButton component (moved from ListingDetails.tsx)
const CopyButton = ({ textToCopy, fieldLabel, index, copiedIndex, handleCopy }: { textToCopy: string, fieldLabel: string, index: number, copiedIndex: number | null, handleCopy: (text: string, index: number) => void }) => (
    <button
        onClick={() => handleCopy(textToCopy, index)}
        className="ml-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-800"
        title={`Copy ${fieldLabel}`}
    >
        {copiedIndex === index ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        )}
    </button>
);

interface ListingDetailFieldsProps {
    listing: Listing;
    preferences: LotteryBucket[] | null;
    isPreferencesLoading: boolean;
    preferencesError: Error | null;
    formatDate: (dateString: string) => string;
}

export default function ListingDetailFields({
    listing,
    preferences,
    isPreferencesLoading,
    preferencesError,
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
    if (insertIndex > 0 && detailFields.findIndex(field => field.label === "Preferences") === -1) {
        detailFields.splice(insertIndex, 0, preferencesRow);
    }

    return (
        <>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Listing Details</h2>
            <table className="w-full mb-6">
                <tbody>
                    {detailFields.map((field, index) => (
                        <tr key={field.label + index} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-3 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap align-top font-medium">{field.label}:</td>
                            <td className="py-3 text-sm text-gray-900 dark:text-gray-100 align-top">
                                {typeof field.value === 'string' ? (
                                    <span className="flex items-center justify-between w-full">
                                        <span>{field.value}</span>
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
        </>
    );
}
