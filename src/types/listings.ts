export interface ListingImage {
	attributes: {
		type: string;
		url: string;
	};
	Listing: string;
	Id: string;
	Name: string;
	Image_URL: string;
	Image_Description: string;
	Display_Order: number;
	displayImageURL: string;
}

export interface RecordType {
	attributes: {
		type: string;
		url: string;
	};
	Id: string;
	Name: string;
}

export interface UnitSummary {
	unitType: string;
	totalUnits: number;
	minSquareFt: number;
	minRentalMinIncome: number;
	minPriceWithParking: number;
	minPriceWithoutParking: number | null;
	minPercentIncome: number | null;
	minOccupancy: number;
	minMonthlyRent: number | null;
	minHoaDuesWithParking: number;
	minHoaDuesWithoutParking: number | null;
	maxSquareFt: number;
	maxRentalMinIncome: number;
	maxPriceWithParking: number;
	maxPriceWithoutParking: number | null;
	maxPercentIncome: number | null;
	maxOccupancy: number | null;
	maxMonthlyRent: number | null;
	maxHoaDuesWithParking: number;
	maxHoaDuesWithoutParking: number | null;
	listingID: string;
	availability: number;
	absoluteMinIncome: number | null;
	absoluteMaxIncome: number | null;
}

export interface Listing {
	unitSummaries: {
		reserved: null | any;
		general: UnitSummary[];
	};
	reservedDescriptor: null | string;
	prioritiesDescriptor: null | string;
	listingID: string;
	chartTypes: null | any;
	attributes: {
		type: string;
		url: string;
	};
	Id: string;
	Tenure: string;
	Name: string;
	Application_Due_Date: string;
	Lottery_Date?: string;
	Lottery_Results_Date: string;
	Reserved_community_minimum_age: number;
	hasWaitlist: boolean;
	Units_Available: number;
	Realtor_Commission_Amount: number;
	Realtor_Commission_Unit: string;
	Building_Name: string;
	Building_Street_Address: string;
	Building_City: string;
	Building_State: string;
	Building_Zip_Code: string;
	Publish_Lottery_Results_on_DAHLIA: string;
	Lottery_Status: string;
	Accepting_Online_Applications: boolean;
	Listing_Type: string;
	RecordTypeId: string;
	LastModifiedDate: string;
	Status: string;
	Listing_Images: ListingImage[];
	RecordType: RecordType;
	imageURL: string;
}

export interface ListingsResponse {
	listings: Listing[];
}
