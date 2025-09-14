import { useQuery } from "@tanstack/react-query";

type SObjectAttributes = {
	type: string;
	url: string;
};

type UnitSummary = {
	unitType: string;
	totalUnits: number;
	minSquareFt: number | null;
	minRentalMinIncome: number | null;
	minPriceWithParking: number | null;
	minPriceWithoutParking: number | null;
	minPercentIncome: number | null;
	minOccupancy: number | null;
	minMonthlyRent: number | null;
	minHoaDuesWithParking: number | null;
	minHoaDuesWithoutParking: number | null;
	maxSquareFt: number | null;
	maxRentalMinIncome: number | null;
	maxPriceWithParking: number | null;
	maxPriceWithoutParking: number | null;
	maxPercentIncome: number | null;
	maxOccupancy: number | null;
	maxMonthlyRent: number | null;
	maxHoaDuesWithParking: number | null;
	maxHoaDuesWithoutParking: number | null;
	listingID: string;
	availability: number | null;
	absoluteMinIncome: number | null;
	absoluteMaxIncome: number | null;
};

type UnitSummaries = {
	reserved: unknown | null;
	general: UnitSummary[] | null;
};

type ChartType = {
	year: string;
	percent: number | null;
	numOfHousehold: number | null;
	chartType: string;
	amount: number | null;
};

type BuildingRef = {
	attributes: SObjectAttributes;
	Id: string;
};

type ListingImage = {
	attributes: SObjectAttributes;
	Listing: string;
	Id: string;
	Name: string;
	Image_URL: string;
	Image_Description: string | null;
	Display_Order: number | null;
	displayImageURL: string | null;
};

type LotteryPreferenceRef = {
	attributes: SObjectAttributes;
	Id: string;
	Name: string;
	Preference_Short_Code: string;
};

type ListingLotteryPreference = {
	attributes: SObjectAttributes;
	Listing: string;
	Id: string;
	Total_Submitted_Apps?: number | null;
	Order: number | null;
	Available_Units: number | null;
	Current_Units_Available: number | null;
	Custom_Preference_Description: boolean;
	PDF_URL?: string | null;
	Lottery_Preference?: LotteryPreferenceRef;
};

type OpenHouse = {
	attributes: SObjectAttributes;
	Listing: string;
	Id: string;
	Venue: string;
};

type Unit = {
	attributes: SObjectAttributes;
	Listing: string;
	Id: string;
	Price_Without_Parking: number | null;
	Price_With_Parking: number | null;
	Unit_Type: string;
	BMR_Rent_Monthly: number | null;
	BMR_Rental_Minimum_Monthly_Income_Needed: number | null;
	Status: string;
	Property_Type: string | null;
	isReservedCommunity: boolean | null;
	AMI_chart_type: string | null;
	AMI_chart_year: number | null;
	Max_AMI_for_Qualifying_Unit: number | null;
};

type RecordTypeRef = {
	attributes: SObjectAttributes;
	Id: string;
	Name: string;
};

export interface ListingDetailsClient {
	unitSummaries?: UnitSummaries;
	reservedDescriptor?: string | null;
	prioritiesDescriptor?: string | null;
	listingID?: string;
	chartTypes?: ChartType[];
	attributes?: SObjectAttributes;
	Name?: string;
	Realtor_Commission_Unit?: string | null;
	Allows_Realtor_Commission?: boolean;
	Parking_Information?: string | null;
	Tenure?: string | null;
	Building?: BuildingRef | null;
	In_Lottery?: number | null;
	Program_Type?: string | null;
	Units_Available?: number | null;
	SASE_Required_for_Lottery_Ticket?: boolean | null;
	nGeneral_Application_Total?: number | null;
	Office_Hours?: string | null;
	Lottery_Status?: string | null;
	Building_Name?: string | null;
	Project_ID?: string | null;
	Building_Street_Address?: string | null;
	Building_City?: string | null;
	Building_State?: string | null;
	Building_Zip_Code?: string | null;
	Developer?: string | null;
	Neighborhood?: string | null;
	Utilities?: string | null;
	Year_Built?: number | null;
	LastModifiedDate?: string;
	Marketing_URL?: string | null;
	Application_Due_Date?: string | null;
	Legal_Disclaimers?: string | null;
	Application_Phone?: string | null;
	Lottery_Results_Date?: string | null;
	Lottery_Venue?: string | null;
	Lottery_Date?: string | null;
	Publish_Lottery_Results_on_DAHLIA?: string | null;
	LotteryResultsURL?: string | null;
	Accepting_Online_Applications?: boolean | null;
	Lottery_Winners?: number | null;
	Credit_Rating?: string | null;
	Eviction_History?: string | null;
	Leasing_Agent_Name?: string | null;
	Leasing_Agent_Title?: string | null;
	Leasing_Agent_Email?: string | null;
	Leasing_Agent_Phone?: string | null;
	Accepting_applications_at_leasing_agent?: boolean | null;
	Accepting_applications_by_PO_Box?: boolean | null;
	Blank_paper_application_can_be_picked_up?: boolean | null;
	Fee?: number | null;
	Deposit_Min?: number | null;
	Deposit_Max?: number | null;
	Costs_Not_Included?: string | null;
	Amenities?: string | null;
	Accessibility?: string | null;
	Building_Selection_Criteria?: string | null;
	Required_Documents?: string | null;
	Smoking_Policy?: string | null;
	Pet_Policy?: string | null;
	Reserved_community_maximum_age?: number | null;
	Reserved_community_minimum_age?: number | null;
	hasWaitlist?: boolean | null;
	Total_waitlist_openings?: number | null;
	Total_number_of_building_units?: number | null;
	Services_Onsite?: string | null;
	Listing_Type?: string | null;
	RecordTypeId?: string | null;
	Status?: string | null;
	Id?: string;
	Listing_Images?: ListingImage[];
	Listing_Lottery_Preferences?: ListingLotteryPreference[];
	Open_Houses?: OpenHouse[];
	Units?: Unit[];
	RecordType?: RecordTypeRef | null;
	imageURL?: string | null;
	// translations intentionally excluded
}

interface ListingDetailsApiResponse {
	listing?: ListingDetailsClient;
}

export const useListingDetailsQuery = (listingID: string | null | undefined) => {
	const query = useQuery<{ details: ListingDetailsClient | null }, Error>({
		queryKey: ["listingDetails", listingID],
		enabled: !!listingID,
		queryFn: async ({ signal }) => {
			const id = listingID as string;
			const response = await fetch(`/api/listings/${id}`, { signal });

			if (!response.ok) {
				let errorData: { error?: string } = {};
					// ignore parse errors
				try { errorData = await response.json(); } catch {}
				throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as ListingDetailsApiResponse;
			const details = data?.listing ?? null;

			return { details };
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: true,
	});

	return {
		details: query.data?.details ?? null,
		isLoading: query.isLoading || query.isFetching,
		error: query.error ?? null,
	} as const;
};
