// File: src/hooks/useBuildingGeocode.ts
import { useQuery } from "@tanstack/react-query";

export interface GeocodeResult {
	lat?: number;
	lng?: number;
	viewport?: { north: number; south: number; east: number; west: number };
}

interface AddressInput {
	address1: string;
	city: string;
	state: string;
	zip: string;
}

export const useBuildingGeocode = (
	listingId: string | null,
	{ address1, city, state, zip }: AddressInput,
) => {
	return useQuery<GeocodeResult | null, Error>({
		queryKey: ["geocode", listingId],
		enabled: Boolean(listingId && address1 && city && state && zip),
		staleTime: 1000 * 60 * 60 * 24, // 24h
		gcTime: 1000 * 60 * 60 * 24, // 24h
		refetchOnWindowFocus: false,
		queryFn: async ({ signal }) => {
			if (!listingId) return null;
			const payload = { address: { address1, city, state, zip } };
			const res = await fetch("/api/geocode", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				signal,
			});
			if (!res.ok) {
				let msg = `failed to geocode (status ${res.status})`;
				try { msg = (await res.json())?.message || msg; } catch {}
				throw new Error(msg);
			}
			const data = (await res.json()) as GeocodeResult;
			return data ?? null;
		},
	});
};
