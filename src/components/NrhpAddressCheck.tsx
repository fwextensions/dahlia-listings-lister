import { useState, useCallback, useEffect, FormEvent, ChangeEvent, JSX } from "react";

interface NrhpAddressCheckProps {
    listingId: string;
    listingName: string;
}

export default function NrhpAddressCheck({ listingId, listingName }: NrhpAddressCheckProps) {
    const [addressForm, setAddressForm] = useState({
        address1: "",
        city: "",
        state: "",
        zip: "",
    });
    const [gisResult, setGisResult] = useState<{ message: string; isMatch: boolean } | null>(null);
    const [isCheckingAddress, setIsCheckingAddress] = useState(false);
    const [addressCheckError, setAddressCheckError] = useState<Error | null>(null);

    useEffect(() => {
        setAddressForm({ address1: "", city: "", state: "", zip: "" });
        setGisResult(null);
        setIsCheckingAddress(false);
        setAddressCheckError(null);
    }, [listingId]); // Depend on listingId from props

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAddressForm(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleAddressCheck = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!listingId) return;

        setIsCheckingAddress(true);
        setGisResult(null);
        setAddressCheckError(null);

        const payload = {
            address: {
                address1: addressForm.address1,
                city: addressForm.city,
                state: addressForm.state,
                zip: addressForm.zip,
            },
            listing: {
                Id: listingId,
                Name: listingName,
            },
        };

        try {
            const response = await fetch("/api/check-address", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && typeof data.isMatch === "boolean" && typeof data.message === "string") {
                setGisResult({
                    message: data.message,
                    isMatch: data.isMatch,
                });
            } else {
                const errorMessage = data?.message || "Invalid response format from API";
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Failed to check address:", error);
            setAddressCheckError(error instanceof Error ? error : new Error("An unknown error occurred"));
        } finally {
            setIsCheckingAddress(false);
        }
    }, [listingId, listingName, addressForm]);

    return (
        <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium text-lg mb-3 text-gray-800 dark:text-gray-200">NRHP Boundary Check</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Check if an address falls within the Neighborhood Resident Housing Preference (NRHP) boundary for this listing.
            </p>
            <form onSubmit={handleAddressCheck} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="address1" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address Line 1</label>
                        <input
                            type="text"
                            name="address1"
                            id="address1-nrhp" // Ensure unique ID if original form still exists elsewhere
                            value={addressForm.address1}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
                            placeholder="e.g., 123 MAIN ST"
                        />
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                        <input
                            type="text"
                            name="city"
                            id="city-nrhp"
                            value={addressForm.city}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
                            placeholder="e.g., SAN FRANCISCO"
                        />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                        <input
                            type="text"
                            name="state"
                            id="state-nrhp"
                            value={addressForm.state}
                            onChange={handleInputChange}
                            required
                            maxLength={2}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
                            placeholder="e.g., CA"
                        />
                    </div>
                    <div>
                        <label htmlFor="zip" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zip Code</label>
                        <input
                            type="text"
                            name="zip"
                            id="zip-nrhp"
                            value={addressForm.zip}
                            onChange={handleInputChange}
                            required
                            pattern="^\d{5}(-\d{4})?$"
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#0077da] focus:ring-[#0077da] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 sm:text-sm px-3 py-2"
                            placeholder="e.g., 94103 or 94103-1234"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isCheckingAddress}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#0077da] hover:bg-[#0066c0] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-800"
                >
                    {isCheckingAddress ? (
                        <>
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" role="status"></span>
                            Checking...
                        </>
                    ) : (
                        "Check Address"
                    )}
                </button>
                {addressCheckError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">Error: {addressCheckError.message}</p>
                )}
                {gisResult && (
                    <div className={`mt-3 p-3 rounded-md text-sm ${
                        gisResult.isMatch
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : gisResult.message.includes("not determine") || gisResult.message.includes("not found")
                                ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                        }`}>
                        {gisResult.message}
                    </div>
                )}
            </form>
        </div>
    );
}
