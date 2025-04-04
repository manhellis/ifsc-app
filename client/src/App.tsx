import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Todos from './pages/Todos';
import Login from './pages/Login';
import UserData from './pages/UserData';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Events from './pages/Events';
import TestEvents from './pages/TestEvents';
import TestFullResults from './pages/TestFullResults';

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

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Task Manager</h1>
        <nav>
          <ul className="flex space-x-6 items-center">
            <li><Link to="/" className="hover:text-blue-300">Home</Link></li>
            {/* <li><Link to="/todos" className="hover:text-blue-300">Todos</Link></li> */}
            <li><Link to="/events" className="hover:text-blue-300">Events</Link></li>
            {user ? (
              <>
                <li><Link to="/user-data" className="hover:text-blue-300">My Data</Link></li>
                {/* Test pages links for development */}
                <li><Link to="/test-events" className="hover:text-yellow-300">Test Events</Link></li>
                <li><Link to="/test-results" className="hover:text-yellow-300">Test Results</Link></li>
                <li className="text-green-400">Hello, {user.name}</li>
                <li>
                  <button 
                    onClick={logout} 
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

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="App min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/events" element={<Events />} />
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/todos" element={<Todos />} />
            <Route path="/user-data" element={<UserData />} />
            {/* Test pages - protected */}
            <Route path="/test-events" element={<TestEvents />} />
            <Route path="/test-results" element={<TestFullResults />} />
          </Route>
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>Task Manager App &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
