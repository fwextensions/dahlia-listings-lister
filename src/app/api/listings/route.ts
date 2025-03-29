import { NextResponse } from "next/server";

const LISTINGS_API_URL = "https://housing.sfgov.org/api/v1/listings.json";

export async function GET() {
  try {
    console.log("API route: Fetching listings from DAHLIA API");
    const response = await fetch(LISTINGS_API_URL);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API route: Successfully fetched listings data");
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
