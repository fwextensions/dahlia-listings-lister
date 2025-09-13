type HasDueDate = { Application_Due_Date?: string };

export const compareDates = (a: HasDueDate, b: HasDueDate): number => {
	// if either date is missing, put it at the end
	if (!a.Application_Due_Date) return 1;
	if (!b.Application_Due_Date) return -1;

	// parse dates
	const dateA = new Date(a.Application_Due_Date);
	const dateB = new Date(b.Application_Due_Date);

	// check for invalid dates
	if (isNaN(dateA.getTime())) return 1;
	if (isNaN(dateB.getTime())) return -1;

	// sort descending (most recent first)
	return dateB.getTime() - dateA.getTime();
};
