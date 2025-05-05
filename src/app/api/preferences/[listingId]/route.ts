import { NextRequest, NextResponse } from 'next/server';

// Define the structure of the response expected from the external SF Housing API
interface SfHousingLotteryBucketResponse {
  lotteryBuckets: { 
    preferenceShortCode: string;
    // Include other fields from lotteryBuckets if necessary in the future
   }[];
  // Include other top-level fields from the response if needed
}

// Define the structure for our API's response back to the frontend
interface ApiResponse {
  preferences?: { preferenceShortCode: string }[];
  error?: string;
}

/**
 * GET handler for the /api/preferences/[listingId] route.
 * Proxies requests to the SF Housing API to fetch lottery preferences,
 * bypassing browser CORS restrictions.
 */
export async function GET(
  request: NextRequest, // Use NextRequest for easier URL parsing
): Promise<NextResponse<ApiResponse>> { // Explicitly type the Promise return value
  
  // Extract listingId from the URL pathname
  const pathnameParts = request.nextUrl.pathname.split('/');
  const listingId = pathnameParts[pathnameParts.length - 1]; // Get the last segment

  // Validate that listingId is present
  if (!listingId) {
    console.warn('Request received without listingId');
    return NextResponse.json({ error: 'Listing ID is required in the URL path' }, { status: 400 });
  }

  // Construct the URL for the external SF Housing API
  const externalUrl = `https://housing.sfgov.org/api/v1/listings/${listingId}/lottery_buckets`;
  console.log(`Proxying preferences request for listing ${listingId} to: ${externalUrl}`);

  try {
    // Fetch data from the external API
    const response = await fetch(externalUrl, {
      method: 'GET', // Explicitly state the method
      headers: {
        // Add any necessary headers here, e.g., Accept
        'Accept': 'application/json',
      },
      // Consider caching strategy - 'no-store' forces a fresh fetch every time.
      // Alternatives: 'force-cache' or time-based revalidation if data isn't highly dynamic.
      cache: 'no-store',
    });

    // Check if the external API request was successful
    if (!response.ok) {
      const errorStatus = response.status;
      const errorText = await response.text(); // Get potential error details from the response body
      console.error(`Error fetching from external API (${externalUrl}). Status: ${errorStatus}. Response: ${errorText}`);
      // Return a more informative error response to the frontend
      return NextResponse.json({ error: `Failed to fetch from external API. Status: ${errorStatus}` }, { status: 502 }); // 502 Bad Gateway is appropriate for upstream errors
    }

    // Parse the JSON response from the external API
    const data: SfHousingLotteryBucketResponse = await response.json();

    // Basic validation of the received data structure
    if (data && Array.isArray(data.lotteryBuckets)) {
      console.log(`Successfully fetched and parsed preferences for listing ${listingId}`);
      // Return only the lotteryBuckets array under the 'preferences' key
      return NextResponse.json({ preferences: data.lotteryBuckets });
    } else {
      console.error(`Invalid data format received from ${externalUrl}. Data:`, JSON.stringify(data));
      // Return an error if the data format is not as expected
      return NextResponse.json({ error: 'Invalid data format received from external API' }, { status: 502 });
    }

  } catch (error) {
    console.error(`Unexpected error proxying preferences request for listing ${listingId}:`, error);
    // Determine the error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during the proxy request';
    // Return a generic server error response
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}
