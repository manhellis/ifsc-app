import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Todos from './pages/Todos';
import Login from './pages/Login';

// Define user interface
interface User {
  userId: string;
  email: string;
  name: string;
}

// Function to remove token
const removeToken = () => {
  localStorage.removeItem('auth_token');
};

// Define a simple home component
function Home() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Task Manager</h1>
      <p className="mb-6">A simple application to manage your to-do items</p>
      <Link to="/todos" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
        Go to Todos
      </Link>
    </div>
  );
}

function Header({ user, handleLogout }: { user: User | null, handleLogout: () => void }) {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Task Manager</h1>
        <nav>
          <ul className="flex space-x-6 items-center">
            <li><Link to="/" className="hover:text-blue-300">Home</Link></li>
            <li><Link to="/todos" className="hover:text-blue-300">Todos</Link></li>
            {user ? (
              <>
                <li className="text-green-400">Hello, {user.name}</li>
                <li>
                  <button 
                    onClick={handleLogout} 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li><Link to="/login" className="hover:text-blue-300">Login</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Rely on cookie-based authentication
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        console.log('Checking auth via cookie');
        
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // For cookies
          headers
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.user) {
            console.log('Auth successful:', data.user.name);
            setUser(data.user);
          }
        } else {
          console.error('Auth check failed:', data.error);
          // Token is invalid, remove it
          removeToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear potentially invalid token
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    // Check URL for token parameter (from OAuth redirect)
    const checkUrlForToken = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        // Remove token from URL since cookie authentication is used
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
      return false;
    };
    
    // Check URL first, then auth status
    checkUrlForToken();
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear token from localStorage
      removeToken();
      
      // Call logout endpoint
      await fetch('/api/auth/logout', {
        credentials: 'include'
      });
      
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, still clear user state
      setUser(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="App min-h-screen flex flex-col">
        <Header user={user} handleLogout={handleLogout} />

        <main className="flex-grow container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>

        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>Task Manager App &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
