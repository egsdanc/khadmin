import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        try {
          console.log('API Request:', queryKey[0]);

          const res = await fetch(queryKey[0] as string, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!res.ok) {
            if (res.status === 401) {
              throw new Error('Unauthorized');
            }

            const errorText = await res.text();
            console.error('API Error:', { 
              status: res.status, 
              statusText: res.statusText,
              error: errorText 
            });

            throw new Error(errorText || res.statusText);
          }

          const data = await res.json();
          console.log('API Success:', { endpoint: queryKey[0], data });
          return data;
        } catch (error) {
          console.error('Query error:', error);
          throw error;
        }
      },
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    }
  },
});