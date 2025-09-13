export interface ListingRecordTypeSummary {
	Name?: string;
}

export interface ListingSummary {
	Id: string;
	Name: string;
	Listing_Type?: string;
	Tenure?: string;
	Units_Available?: number;
	Application_Due_Date?: string;
	Status?: string;
	RecordType?: ListingRecordTypeSummary;
}

export interface ListingsSummaryResponse {
	listings: ListingSummary[];
}
