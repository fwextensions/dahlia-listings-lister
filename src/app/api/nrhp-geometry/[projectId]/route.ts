// File: src/app/api/nrhp-geometry/[projectId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// minimal GeoJSON FeatureCollection shape without adding external types
interface FeatureCollection {
	type: "FeatureCollection";
	features: unknown[];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
	try {
		const { projectId } = await params;
		if (!projectId) {
			return NextResponse.json({ message: "Missing projectId" }, { status: 400 });
		}

		const where = `ProjId='${projectId}'`;
		const url = new URL("https://gis.sf.gov/dahl/rest/services/app_services/NRHP_pref_pq_QA/MapServer/0/query");
		url.searchParams.set("where", where);
		url.searchParams.set("f", "geojson");
		url.searchParams.set("returnGeometry", "true");
		url.searchParams.set("geometryPrecision", "6");
		// be explicit about spatial reference of output
		url.searchParams.set("outSR", "4326");
		// request all attributes just in case clients want to inspect them
		url.searchParams.set("outFields", "*");
		// guard against default server-side limits
		url.searchParams.set("resultRecordCount", "2000");

		const resp = await fetch(url.toString(), {
			// allow caching at the edge if available
			next: { revalidate: 86400 },
		});
		if (!resp.ok) {
			const text = await resp.text().catch(() => "");
			return NextResponse.json({ message: `Upstream GIS error ${resp.status}`, detail: text }, { status: 502 });
		}
		const data = (await resp.json()) as FeatureCollection;

		if (!data || data.type !== "FeatureCollection") {
			return NextResponse.json({ message: "Invalid GeoJSON from upstream" }, { status: 502 });
		}

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "s-maxage=86400, stale-while-revalidate=604800",
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown server error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
