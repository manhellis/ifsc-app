import React, { useState } from 'react';
import { authClient } from '../libs/auth-client';

// Define form data for login and registration
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

const Login: React.FC = () => {
  // Local component state for user, form mode and errors
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterFormData>({ email: '', password: '', name: '' });
  const { 
    data: session, 
  } = authClient.useSession();

  if (session?.user) {
    window.location.href = '/dashboard';
  }
  // Handler for email and password sign in
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { data, error } = await authClient.signIn.email(
        {
          email: loginData.email,
          password: loginData.password,
          callbackURL: '/dashboard'
        },
        {
          onRequest: (ctx) => {
            console.log('Signing in...');
          },
          onSuccess: (ctx) => {
            window.location.href = '/dashboard';
          },
          onError: (ctx) => {
            alert(ctx.error.message);
            setError(ctx.error.message);
          }
        }
      );
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred during sign in');
    }
  };

  // Handler for user registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await authClient.signUp.email(
        {
          email: registerData.email,
          password: registerData.password,
          name: registerData.name,
          callbackURL: '/dashboard'
        },
        {
          onRequest: (ctx) => {
            // You can update UI to show a loading indicator if needed
            console.log('Signing up...');
          },
          onSuccess: (ctx) => {
            // Redirect to dashboard when sign-up succeeds
            window.location.href = '/dashboard';
          },
          onError: (ctx) => {
            // Display error message
            alert(ctx.error.message);
            setError(ctx.error.message);
          }
        }
      );
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
    }
  };

  // Handler for Google SSO sign in
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const { data } = await authClient.signIn.social({
        provider: "google"
      })
      if (data) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('An error occurred during Google sign in');
    }
  };

  // Handlers for input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default Login;
