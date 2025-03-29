import { ReactNode } from "react";
import Toolbar from "./Toolbar";

interface LayoutProps {
	children: ReactNode;
	isRefreshing?: boolean;
}

export default function Layout({ children, isRefreshing = false }: LayoutProps) {
	return (
		<div className="flex flex-col h-screen">
			<Toolbar isRefreshing={isRefreshing} />
			<main className="flex-1 overflow-hidden">
				{children}
			</main>
		</div>
	);
}
