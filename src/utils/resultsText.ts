export const buildResultsText = (
	filteredCount: number,
	isLoading: boolean,
	error: Error | null | undefined,
	term: string,
	filter: string,
): string => {
	if (isLoading) {
		return "Loading listings...";
	}

	if (error) {
		return "Error loading listings";
	}

	if (filteredCount === 0) {
		if (term && filter !== "All") {
			return `No listings match "${term}" with filter: ${filter}`;
		} else if (term) {
			return `No listings match "${term}"`;
		} else if (filter !== "All") {
			return `No ${filter} listings found`;
		} else {
			return "No listings found";
		}
	}

	if (term && filter !== "All") {
		return `${filteredCount} ${filter} listings match "${term}"`;
	} else if (term) {
		return `${filteredCount} listings match "${term}"`;
	} else if (filter !== "All") {
		return `${filteredCount} ${filter} listings`;
	} else {
		return `${filteredCount} listings`;
	}
};
