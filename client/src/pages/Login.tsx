import React, { useEffect, useState } from 'react';

interface User {
  userId: string;
  email: string;
  name: string;
}

// Function to store token in local storage
const saveToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

// Function to get token from local storage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Function to remove token from local storage
const removeToken = () => {
  localStorage.removeItem('auth_token');
};

const Login: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Try with the token from localStorage first
        const token = getToken();
        let headers = {};
        
        if (token) {
          headers = {
            'Authorization': `Bearer ${token}`
          };
        }
        
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // For cookies
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to check authentication status');
      } finally {
        setLoading(false);
      }
    };

    // Check URL for token parameter (for handling redirect from OAuth)
    const checkUrlForToken = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        saveToken(token);
        // Remove token from URL to prevent token leakage
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
      return false;
    };
    
    // First check for token in URL, then check auth status
    checkUrlForToken();
    checkAuth();
    
  }, []);

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google's auth page
        window.location.href = data.authUrl;
      } else {
        setError('Failed to get auth URL');
        console.error('Failed to get auth URL');
      }
    } catch (error) {
      setError('Error starting Google login');
      console.error('Error starting Google login:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Remove token from local storage
      removeToken();
      
      // Call the logout endpoint
      await fetch('/api/auth/logout', {
        credentials: 'include'
      });
      
      // Reset user state
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {user ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-4">
              <h2 className="text-xl font-semibold mb-4">You are logged in</h2>
              <p className="mb-2"><span className="font-medium">Name:</span> {user.name}</p>
              <p className="mb-2"><span className="font-medium">Email:</span> {user.email}</p>
              <p className="mb-2"><span className="font-medium">User ID:</span> {user.userId}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition duration-200"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-4">Sign in to access your account</p>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-all duration-200"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google logo"
                className="h-6 w-6 mr-2"
              />
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
