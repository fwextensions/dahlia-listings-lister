"use client";

import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	// Create a client
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				refetchOnWindowFocus: false,
				refetchOnMount: true,
				refetchOnReconnect: true,
			},
		},
	}));

	// Debug: Log when the provider mounts
	useEffect(() => {
		console.log("React Query provider mounted");
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
