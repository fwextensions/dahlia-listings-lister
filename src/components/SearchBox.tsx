import { ChangeEvent, KeyboardEvent, RefObject } from "react";

interface SearchBoxProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	inputRef?: RefObject<HTMLInputElement | null>;
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export default function SearchBox({ 
	searchTerm, 
	onSearchChange, 
	inputRef, 
	onKeyDown 
}: SearchBoxProps) {
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onSearchChange(e.target.value);
	};

	return (
		<div className="relative">
			<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
				<svg
					className="w-4 h-4 text-gray-500"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 20 20"
				>
					<path
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
					/>
				</svg>
			</div>
			<input
				type="search"
				className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
				placeholder="Search listings..."
				value={searchTerm}
				onChange={handleChange}
				ref={inputRef}
				onKeyDown={onKeyDown}
			/>
			{searchTerm && (
				<button
					type="button"
					className="absolute inset-y-0 right-0 flex items-center pr-3"
					onClick={() => onSearchChange("")}
				>
					<svg
						className="w-4 h-4 text-gray-500 hover:text-gray-700"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			)}
		</div>
	);
}
