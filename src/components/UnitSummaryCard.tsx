// Define the structure for a single unit summary based on usage in ListingDetails.tsx
export interface UnitSummary {
    unitType: string;
    totalUnits: number;
    minSquareFt: number | string; // Can be a range or single value
    maxSquareFt?: number | string; // Optional, used if totalUnits > 1
    minPercentIncome: number | string;
    minMonthlyRent: number | string | null;
}

interface UnitSummaryCardProps {
    unit: UnitSummary;
}

export default function UnitSummaryCard({ unit }: UnitSummaryCardProps) {
    return (
        <div className="border border-gray-200 dark:border-gray-700 p-4 rounded shadow-sm bg-white dark:bg-gray-800">
            <h4 className="font-medium text-base mb-2 text-gray-800 dark:text-gray-200">{unit.unitType} Unit</h4>
            <table className="w-full text-sm">
                <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Total Units:</td>
                        <td className="py-1 font-medium text-gray-800 dark:text-gray-200">{unit.totalUnits}</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Square Feet:</td>
                        <td className="py-1 font-medium text-gray-800 dark:text-gray-200">
                            {unit.totalUnits === 1 || unit.minSquareFt === unit.maxSquareFt ? unit.minSquareFt : `${unit.minSquareFt} - ${unit.maxSquareFt}`}
                        </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Income (%AMI):</td>
                        <td className="py-1 font-medium text-gray-800 dark:text-gray-200">{unit.minPercentIncome}</td>
                    </tr>
                    <tr>
                        <td className="py-1 text-gray-600 dark:text-gray-400 pr-2">Monthly Rent:</td>
                        <td className="py-1 font-medium text-gray-800 dark:text-gray-200">
                            {unit.minMonthlyRent}
                            {unit.minMonthlyRent && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(est.)</span>}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
