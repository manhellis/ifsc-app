import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  userId: string;
  email: string;
  name: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

// Removed local storage token functions

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterFormData>({ email: '', password: '', confirmPassword: '', name: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // No longer using localStorage token
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // For cookies
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
        // No longer saving token to localStorage
        // Remove token from URL to prevent token leakage
        window.history.replaceState({}, document.title, window.location.pathname);
        // Redirect to dashboard after setting token
        navigate('/dashboard');
        return true;
      }
      return false;
    };
    
    // First check for token in URL, then check auth status
    checkUrlForToken();
    checkAuth();
    
  }, []);

  // Handle Google login
  const handleGoogleLogin = () => {
    // Direct redirect to the backend endpoint
    window.location.href = '/api/auth/google';
  };

  // Validate password
  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setError(null);
        setShowForgotPassword(false);
        alert('Password reset instructions have been sent to your email');
      } else {
        setError(data.error || 'Failed to process forgot password request');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('An error occurred while processing your request');
    }
  };

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validatePassword(registerData.password)) {
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        // No longer saving token to localStorage
        // Use React Router navigation
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    }
  };

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  // Handle register form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      
      // Call the logout endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
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

        {passwordError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {passwordError}
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
        ) : showForgotPassword ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2">Having trouble with your account?</p>
              <p className="text-sm text-gray-500">
                Please email <a href="mailto:admin@compbeta.rocks" className="text-blue-500 hover:underline">admin@compbeta.rocks</a> for assistance
              </p>
            </div>
            {/* <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="forgot-email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form> */}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2 mb-4">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-4 py-2 rounded-lg ${isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-4 py-2 rounded-lg ${!isLogin ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Register
              </button>
            </div>

            {isLogin ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200"
                >
                  Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="register-name"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    id="register-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    id="register-confirm-password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition duration-200"
                >
                  Register
                </button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            
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
