import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ProtectedRoute component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // If still loading, show a loading spinner/message
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child route
  return <Outlet />;
};

export default ProtectedRoute; 