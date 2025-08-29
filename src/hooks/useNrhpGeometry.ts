// File: src/hooks/useNrhpGeometry.ts
import { useQuery } from "@tanstack/react-query";

export type Position = [number, number]; // [lng, lat]
export type Polygon = Position[][];
export type MultiPolygon = Position[][][];

export interface Geometry {
	type: "Polygon" | "MultiPolygon";
	coordinates: Polygon | MultiPolygon;
}

export interface Feature {
	type: "Feature";
	geometry: Geometry | null;
	properties: Record<string, unknown>;
}

export interface FeatureCollection {
	type: "FeatureCollection";
	features: Feature[];
}

export const useNrhpGeometry = (projectId: string | null) => {
	return useQuery<FeatureCollection | null>({
		queryKey: ["nrhp-geometry", projectId],
		queryFn: async () => {
			if (!projectId) return null;
			const resp = await fetch(`/api/nrhp-geometry/${encodeURIComponent(projectId)}`);
			if (!resp.ok) {
				throw new Error(`Failed to fetch NRHP geometry: ${resp.status}`);
			}
			const data = (await resp.json()) as FeatureCollection;
			return data;
		},
		enabled: Boolean(projectId),
		staleTime: 1000 * 60 * 60 * 24, // 24h
		gcTime: 1000 * 60 * 60 * 24,
	});
};
