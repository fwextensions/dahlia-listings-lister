import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return new NextResponse('Address parameter is required', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY is not set in .env file');
    return new NextResponse('Server configuration error: API key not found', { status: 500 });
  }

  // Construct the Google Maps Static API URL
  // Max width is 640px. Height can be adjusted, using 400px here.
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
    address
  )}&zoom=15&size=640x400&maptype=roadmap&markers=color:red%7C${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const mapResponse = await fetch(mapUrl);
    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      console.error('Google Maps API error:', errorText);
      // Try to return a more informative error from Google if possible
      let googleError = 'Failed to fetch map image';
      try {
        const googleJsonError = JSON.parse(errorText);
        if (googleJsonError?.error?.message) {
          googleError = googleJsonError.error.message;
        }
      } catch (e) { /* Ignore parsing error */ }
      return new NextResponse(`${googleError} (Status: ${mapResponse.statusText})`, {
        status: mapResponse.status,
      });
    }

    const imageBuffer = await mapResponse.arrayBuffer();
    const contentType = mapResponse.headers.get('content-type') || 'image/png';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, immutable', // Cache for 1 hour, immutable for better CDN caching
      },
    });
  } catch (error) {
    console.error('Error fetching map image:', error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new NextResponse(errorMessage, { status: 500 });
  }
}
