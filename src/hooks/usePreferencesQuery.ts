import { useQuery } from "@tanstack/react-query";
import type { LotteryBucket } from "@/types/listings";

export const usePreferencesQuery = (listingId: string | null | undefined) => {
	const query = useQuery<LotteryBucket[], Error>({
		queryKey: ["preferences", listingId],
		enabled: !!listingId,
		queryFn: async ({ signal }) => {
			const id = listingId as string;
			const response = await fetch(`/api/preferences/${id}`, { signal });
			if (!response.ok) {
				let errorData: { error?: string } = {};
				try {
					errorData = await response.json();
				} catch {
					// ignore parse errors
				}
				throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			if (!data || !Array.isArray(data.preferences)) {
				throw new Error("Invalid preferences data format received from server");
			}
			return data.preferences as LotteryBucket[];
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: true,
	});

	return {
		preferences: query.data ?? null,
		isLoading: query.isLoading || query.isFetching,
		error: query.error ?? null,
	} as const;
};
