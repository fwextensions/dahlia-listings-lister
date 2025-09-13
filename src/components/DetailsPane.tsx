"use client";

import ListingDetails from "@/components/ListingDetails";
import type { Listing } from "@/types/listings";
import { usePreferencesQuery } from "@/hooks/usePreferencesQuery";

interface DetailsPaneProps {
	listing: Listing | null;
}

export default function DetailsPane({ listing }: DetailsPaneProps) {
	const { preferences, isLoading, error } = usePreferencesQuery(listing?.Id ?? null);

	return (
		<div>
			{listing ? (
				<ListingDetails
					listing={listing}
					preferences={preferences}
					isPreferencesLoading={isLoading}
					preferencesError={error}
				/>
			) : (
				<div className="p-4 text-center text-gray-500 dark:text-gray-400">
					<p>No listing selected.</p>
				</div>
			)}
		</div>
	);
}
