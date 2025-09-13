import { JSX } from "react";

interface AsyncFieldValueProps {
	value: string | null | undefined;
	isLoading?: boolean;
	error?: Error | null;
	loadingText?: string;
	errorText?: string;
	emptyText?: string;
	className?: string;
}

export default function AsyncFieldValue({
	value,
	isLoading = false,
	error = null,
	loadingText = "Loading...",
	errorText = "Error loading.",
	emptyText = "Not available.",
	className = "",
}: AsyncFieldValueProps): JSX.Element {
	if (isLoading) {
		return <span className={`text-gray-500 dark:text-gray-400 italic ${className}`}>{loadingText}</span>;
	}

	if (error) {
		return <span className={`text-red-500 dark:text-red-400 italic ${className}`}>{errorText}</span>;
	}

	if (value) {
		return <span className={className}>{value}</span>;
	}

	return <span className={`text-gray-500 dark:text-gray-400 italic ${className}`}>{emptyText}</span>;
}
