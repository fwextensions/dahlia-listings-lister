"use client";

import ListingDetails from "@/components/ListingDetails";
import type { Listing } from "@/types/listings";
import { usePreferencesQuery } from "@/hooks/usePreferencesQuery";
import { useListingDetailsQuery } from "@/hooks/useListingDetailsQuery";

interface DetailsPaneProps {
	listing: Listing | null;
}

export default function DetailsPane({ listing }: DetailsPaneProps) {
	const { preferences, isLoading, error } = usePreferencesQuery(listing?.Id ?? null);
	const { projectId, isLoading: isDetailsLoading, error: detailsError } = useListingDetailsQuery(listing?.listingID ?? null);

	return (
		<div>
			{listing ? (
				<ListingDetails
					listing={listing}
					preferences={preferences}
					isPreferencesLoading={isLoading}
					preferencesError={error}
					projectId={projectId}
					isDetailsLoading={isDetailsLoading}
					detailsError={detailsError}
				/>
			) : (
				<div className="p-4 text-center text-gray-500 dark:text-gray-400">
					<p>No listing selected.</p>
				</div>
			)}
		</div>
	);
}
