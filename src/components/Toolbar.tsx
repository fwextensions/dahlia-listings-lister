export default function Toolbar() {
	return (
		<header className="bg-[#0077da] text-white shadow-md">
			<div className="container mx-auto px-4 py-3 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<svg 
						xmlns="http://www.w3.org/2000/svg" 
						width="24" 
						height="24" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						strokeWidth="2" 
						strokeLinecap="round" 
						strokeLinejoin="round"
					>
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
						<polyline points="9 22 9 12 15 12 15 22"></polyline>
					</svg>
					<h1 className="text-xl font-bold">SF Housing Listings Lister</h1>
				</div>
				
				<div className="flex items-center space-x-4">
					<span className="text-sm">
						Data from <a href="https://housing.sfgov.org" target="_blank" rel="noopener noreferrer" className="underline">housing.sfgov.org</a>
					</span>
				</div>
			</div>
		</header>
	);
}
