// src/utils/formatters.ts

/**
 * Formats a date string to YYYY-MM-DD.
 * Returns 'N/A' if the dateString is empty or falsy.
 * Returns 'Invalid date' if the dateString cannot be parsed into a valid Date.
 * Returns 'Date error' if any other error occurs during formatting.
 * @param dateString The date string to format.
 * @returns The formatted date string or an error/fallback string.
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        // Check if the date is valid. getTime() returns NaN for invalid dates.
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }
        return date.toISOString().split("T")[0];
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Date error"; // Fallback for any unexpected errors
    }
};
