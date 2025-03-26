import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface QueryProviderProps {
	children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 5 * 60 * 1000, // 5 minutes
				refetchOnWindowFocus: true,
				refetchOnMount: true,
				refetchOnReconnect: true,
			},
		},
	}));

	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
