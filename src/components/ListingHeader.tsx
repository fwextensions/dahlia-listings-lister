interface ListingHeaderProps {
    listingName: string;
    dahliaListingId: string | undefined; // Based on listing.listingID which might not exist
    salesforceListingId: string;
}

export default function ListingHeader({ listingName, dahliaListingId, salesforceListingId }: ListingHeaderProps) {
    const housingUrl = `https://housing.sfgov.org/listings/${dahliaListingId || salesforceListingId}`;
    const salesforceUrl = `https://sfhousing.lightning.force.com/lightning/r/Listing__c/${salesforceListingId}/view`;

    return (
        <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mr-4">{listingName}</h2>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                <a
                    href={housingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-[#0077da] text-white rounded-md hover:bg-[#0066c0] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-900"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    DAHLIA
                </a>
                <a
                    href={salesforceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-[#0077da] text-white rounded-md hover:bg-[#0066c0] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-900"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Salesforce
                </a>
            </div>
        </div>
    );
}
