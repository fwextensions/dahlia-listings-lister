import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export const useSearchTerm = (initial: string = "") => {
	const [searchTerm, setSearchTerm] = useState<string>(initial);
	const debouncedSearchTerm = useDebounce(searchTerm, 250);
	return { searchTerm, setSearchTerm, debouncedSearchTerm } as const;
};
