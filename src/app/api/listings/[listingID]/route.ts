import { NextRequest, NextResponse } from 'next/server';

interface UnitSummary {
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
}

interface ChartType {
  year: string;
  percent: number | null;
  numOfHousehold: number | null;
  chartType: string;
  amount: number | null;
}

interface Attribute {
  type: string;
  url: string;
}

interface Building {
  attributes: Attribute;
  Id: string;
}

interface ListingImage {
  attributes: Attribute;
  Listing: string;
  Id: string;
  Name: string;
  Image_URL: string;
  Image_Description: string;
  Display_Order: number;
  displayImageURL: string;
}

interface LotteryPreferenceDetail {
  attributes: Attribute;
  Id: string;
  Name: string;
  Preference_Short_Code: string;
}

interface ListingLotteryPreference {
  attributes: Attribute;
  Listing: string;
  Id: string;
  Total_Submitted_Apps: number;
  Order: number;
  Available_Units: number;
  Current_Units_Available: number;
  Custom_Preference_Description: boolean;
  Lottery_Preference: LotteryPreferenceDetail;
}

interface OpenHouse {
  attributes: Attribute;
  Listing: string;
  Id: string;
  Venue: string;
}

interface UnitDetail {
  attributes: Attribute;
  Listing: string;
  Id: string;
  Unit_Type: string;
  BMR_Rent_Monthly: number | null;
  BMR_Rental_Minimum_Monthly_Income_Needed: number | null;
  Status: string;
  Property_Type: string;
  isReservedCommunity: boolean;
  AMI_chart_type: string;
  AMI_chart_year: number;
  Max_AMI_for_Qualifying_Unit: number | null;
}

interface RecordType {
  attributes: Attribute;
  Id: string;
  Name: string;
}

// Based on the provided sample, but keeping it flexible for other languages
interface TranslationField {
  ES?: string;
  ZH?: string;
  TL?: string;
  EN?: string;
  [key: string]: string | undefined; // Allow other language codes
}

interface ListingTranslations {
  LastModifiedDate: string;
  Accessibility__c: TranslationField;
  Amenities__c: TranslationField;
  Appliances__c: TranslationField;
  Costs_Not_Included__c: TranslationField;
  Credit_Rating__c: TranslationField;
  Legal_Disclaimers__c: TranslationField;
  // Add other translatable fields as needed
  [key: string]: string | TranslationField; // For top-level string translations like LastModifiedDate or other objects
}

interface ListingDetailsResponse {
  listing: {
    unitSummaries: {
      reserved: UnitSummary[] | null;
      general: UnitSummary[];
    };
    reservedDescriptor: string | null;
    prioritiesDescriptor: string | null;
    listingID: string;
    chartTypes: ChartType[];
    attributes: Attribute;
    Name: string;
    Realtor_Commission_Unit?: string;
    Allows_Realtor_Commission?: boolean;
    Parking_Information?: string;
    Tenure?: string;
    Building?: Building;
    In_Lottery?: number;
    Program_Type?: string;
    Units_Available?: number;
    SASE_Required_for_Lottery_Ticket?: boolean;
    nGeneral_Application_Total?: number;
    Office_Hours?: string;
    Building_Name?: string;
    Project_ID?: string;
    Building_Street_Address?: string;
    Building_City?: string;
    Building_State?: string;
    Building_Zip_Code?: string;
    Developer?: string;
    Neighborhood?: string;
    Utilities?: string;
    Year_Built?: number;
    LastModifiedDate: string;
    Marketing_URL?: string;
    Application_Due_Date?: string;
    Legal_Disclaimers?: string;
    Application_Phone?: string;
    Lottery_Results_Date?: string;
    Lottery_Venue?: string;
    Lottery_Date?: string;
    Publish_Lottery_Results_on_DAHLIA?: string;
    Accepting_Online_Applications?: boolean;
    Lottery_Winners?: number;
    Credit_Rating?: string;
    Eviction_History?: string;
    Leasing_Agent_Name?: string;
    Leasing_Agent_Title?: string;
    Leasing_Agent_Email?: string;
    Leasing_Agent_Phone?: string;
    Accepting_applications_at_leasing_agent?: boolean;
    Accepting_applications_by_PO_Box?: boolean;
    Blank_paper_application_can_be_picked_up?: boolean;
    Fee?: number;
    Deposit_Min?: number;
    Deposit_Max?: number;
    Costs_Not_Included?: string;
    Amenities?: string;
    Accessibility?: string;
    Building_Selection_Criteria?: string;
    Required_Documents?: string;
    Smoking_Policy?: string;
    Pet_Policy?: string;
    Reserved_community_maximum_age?: number;
    Reserved_community_minimum_age?: number;
    hasWaitlist?: boolean;
    Total_waitlist_openings?: number;
    Total_number_of_building_units?: number;
    Listing_Type?: string;
    RecordTypeId: string;
    Status: string;
    Id: string;
    Listing_Images?: ListingImage[];
    Listing_Lottery_Preferences?: ListingLotteryPreference[];
    Open_Houses?: OpenHouse[];
    Units?: UnitDetail[];
    RecordType: RecordType;
    imageURL?: string;
    translations: ListingTranslations;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { listingID: string } }
) {
  const awaitedParams = await params; // Await the params object as per the warning
  const { listingID } = awaitedParams; // Then destructure listingID

  if (!listingID) {
    return NextResponse.json({ error: 'listingID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://housing.sfgov.org/api/v1/listings/${listingID}.json`
    );

    if (!response.ok) {
      console.error(`Error fetching listing ${listingID}: ${response.status} ${response.statusText}`);
      const errorBody = await response.text(); // Read error body for more details
      console.error(`Error body: ${errorBody}`);
      return NextResponse.json(
        { error: `Failed to fetch listing data from SF Gov API. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data: ListingDetailsResponse = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error fetching listing ${listingID}:`, error);
    return NextResponse.json(
      { error: 'Internal server error while fetching listing data.' },
      { status: 500 }
    );
  }
}
