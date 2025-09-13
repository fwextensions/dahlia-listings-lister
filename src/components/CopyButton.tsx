export default function CopyButton({
	textToCopy,
	fieldLabel,
	index,
	copiedIndex,
	handleCopy
}: {
	textToCopy: string,
	fieldLabel: string,
	index: number,
	copiedIndex: number | null,
	handleCopy: (
		text: string,
		index: number) => void
})
{
	const buttonStyle = textToCopy ? "" : "invisible";
	let iconClass = "h-4 w-4";
	let iconPath = "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z";

	if (copiedIndex === index) {
		iconClass = "h-4 w-4 text-green-500";
		iconPath = "M5 13l4 4L19 7";
	}

	return (
		<button
			onClick={() => handleCopy(textToCopy, index)}
			className={`ml-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077da] dark:focus:ring-offset-gray-800 ${buttonStyle}`}
			title={`Copy ${fieldLabel}`}
		>
			<svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
			</svg>
		</button>
	);
}
