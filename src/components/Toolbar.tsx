import DahliaLogo from "./icons/DahliaLogo";

interface ToolbarProps {
	isRefreshing?: boolean;
}

export default function Toolbar({ isRefreshing = false }: ToolbarProps) {
	return (
		<header className="bg-[#2d82e8] text-white shadow-md">
			<div className="max-w-full px-4 py-3 flex items-center justify-between">
				<div className="flex items-center gap-x-2">
					<DahliaLogo size={24} className="mr-1" />
					<h1 className="text-xl font-bold">DAHLIA Listings Lister</h1>
				</div>
				<div className="flex items-center gap-x-2">
					<span className="text-sm flex items-center">
						{isRefreshing && (
							<span className="mr-2 flex items-center">
								<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
							</span>
						)}
						Data from <a href="https://housing.sfgov.org" target="_blank" rel="noopener noreferrer" className="underline mx-1">housing.sfgov.org</a>
					</span>
				</div>
			</div>
		</header>
	);
}
