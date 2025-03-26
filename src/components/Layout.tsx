import { ReactNode } from "react";
import Toolbar from "./Toolbar";

interface LayoutProps {
	children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	return (
		<div className="flex flex-col h-screen">
			<Toolbar />
			<main className="flex-1 overflow-hidden">
				{children}
			</main>
		</div>
	);
}
