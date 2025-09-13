import { useQuery } from "@tanstack/react-query";

interface ListingDetailsApiResponse {
	listing?: {
		Project_ID?: string;
	};
}

export const useListingDetailsQuery = (listingID: string | null | undefined) => {
	const query = useQuery<{ projectId: string | null }, Error>({
		queryKey: ["listingDetails", listingID],
		enabled: !!listingID,
		queryFn: async ({ signal }) => {
			const id = listingID as string;
			const response = await fetch(`/api/listings/${id}`, { signal });
			if (!response.ok) {
				let errorData: { error?: string } = {};
				try {
					errorData = await response.json();
				} catch {
					// ignore parse errors
				}
				throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
			}
			const data = (await response.json()) as ListingDetailsApiResponse;
			const projectId = data?.listing?.Project_ID ?? null;
			return { projectId };
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: true,
	});

	return {
		projectId: query.data?.projectId ?? null,
		isLoading: query.isLoading || query.isFetching,
		error: query.error ?? null,
	} as const;
};
