import { useQuery } from "@tanstack/react-query";
import { cacheListings, getCachedListings } from "@/utils/api";
import type { ListingsResponse } from "@/types/listings";

export const useListingsQuery = () => {
	return useQuery<ListingsResponse, Error>({
		queryKey: ["listings"],
		initialData: () => getCachedListings() ?? undefined,
		queryFn: async ({ signal }) => {
			const response = await fetch("/api/listings", { signal });
			if (!response.ok) {
				let errorData: { error?: string } = {};
				try {
					errorData = await response.json();
				} catch {
					// ignore parse errors
				}
				throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
			}
			const data = (await response.json()) as ListingsResponse;
			cacheListings(data);
			return data;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
	});
};
