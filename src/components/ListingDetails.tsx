import { Listing } from "@/types/listings";
import ImageCarousel from "./ImageCarousel";
import ListingHeader from "./ListingHeader";
import ListingDetailFields from "./ListingDetailFields";
import UnitSummaryCard, { UnitSummary } from "./UnitSummaryCard";
import NrhpAddressCheck from "./NrhpAddressCheck";
import { formatDate } from "@/utils/formatters";
import type { ListingDetailsClient } from "@/hooks/useListingDetailsQuery";

interface ListingDetailsProps {
    listing: Listing | null;
    listingDetails: ListingDetailsClient | null;
    isDetailsLoading: boolean;
    detailsError: Error | null;
}

export default function ListingDetails({
    listing,
    listingDetails,
    isDetailsLoading,
    detailsError }: ListingDetailsProps)
{
    if (!listing) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Select a listing to view
                    details</p>
            </div>
        );
    }

    const hasNrhpPreference = !!listingDetails?.Listing_Lottery_Preferences?.some(
        (p) => p.Lottery_Preference?.Preference_Short_Code === "NRHP",
    );

    const unitSummaryElements = listing.unitSummaries?.general?.map((
        unitData,
        index) => (
        <UnitSummaryCard key={index} unit={unitData as UnitSummary} />
    )) || null;

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow">
            {listing.Listing_Images && listing.Listing_Images.length > 0 && (
                <div className="mb-6">
                    <ImageCarousel images={listing.Listing_Images} />
                </div>
            )}

            <ListingHeader
                listingName={listing.Name}
                dahliaListingId={listing.listingID}
                salesforceListingId={listing.Id}
            />

            <ListingDetailFields
                listing={listing}
                listingDetails={listingDetails}
                isDetailsLoading={isDetailsLoading}
                detailsError={detailsError}
                formatDate={formatDate}
            />

            {unitSummaryElements && unitSummaryElements.length > 0 && (
                <div className="mt-6 mb-6">
                    <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">Unit Summaries</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unitSummaryElements}
                    </div>
                </div>
            )}

            {hasNrhpPreference && (
                <NrhpAddressCheck
                    listingId={listing.Id}
                    listingName={listing.Name}
                    listingDetails={listingDetails}
                    isDetailsLoading={isDetailsLoading}
                    detailsError={detailsError}
                />
            )}
        </div>
    );
}
