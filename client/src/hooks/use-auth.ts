import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  firma_id: number | null;
  bayi_id: number | null;
}

type RequestResult = {
  ok: true;
  user?: User;
  message?: string;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: LoginCredentials
): Promise<RequestResult> {
  try {
    console.log('Auth Request:', { url, method, body });

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth request failed:', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });

      try {
        const errorJson = JSON.parse(errorText);
        return { 
          ok: false, 
          message: errorJson.message || response.statusText 
        };
      } catch {
        return { 
          ok: false, 
          message: errorText || response.statusText 
        };
      }
    }

    const data = await response.json();
    console.log('Auth request successful:', data);

    if (data.success === false) {
      return {
        ok: false,
        message: data.message || "İşlem başarısız"
      };
    }

    return { 
      ok: true, 
      user: data.user || data,
      message: data.message 
    };
  } catch (e: any) {
    console.error('Auth request error:', e);
    return { 
      ok: false, 
      message: e.toString() 
    };
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    console.log('Fetching user data...');
    const response = await fetch('/api/user', {
      credentials: 'include',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('User not authenticated');
        return null;
      }

      const errorText = await response.text();
      console.error('User fetch error:', { 
        status: response.status, 
        error: errorText 
      });
      throw new Error(errorText || response.statusText);
    }

    const user = await response.json();
    console.log('User data fetched:', user);
    return user;
  } catch (error) {
    console.error('User fetch failed:', error);
    throw error;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation<RequestResult, Error, LoginCredentials>({
    mutationFn: (credentials) => handleRequest('/api/login', 'POST', credentials),
    onSuccess: (result) => {
      if (result.ok && result.user) {
        queryClient.setQueryData(['user'], result.user);
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest('/api/logout', 'POST'),
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}