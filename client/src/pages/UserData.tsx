import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserData: React.FC = () => {
  const [userData, setUserData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/user-data', {
          method: 'GET',
          credentials: 'include', // For cookies
        });

        if (!response.ok) {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.userData || '');
      } catch (err) {
        setError('Error fetching user data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle saving user data
  const handleSaveUserData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/user-data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // For cookies
        body: JSON.stringify({ userData }),
      });

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to save user data');
      }

      setSuccessMessage('Your data has been saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Error saving user data');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Personal Data</h1>
      <p className="mb-4 text-gray-600">
        This is your private space. Any information you save here is only visible to you.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSaveUserData}>
          <div className="mb-4">
            <label htmlFor="userData" className="block text-sm font-medium text-gray-700 mb-2">
              Your Data
            </label>
            <textarea
              id="userData"
              value={userData}
              onChange={(e) => setUserData(e.target.value)}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your private notes, thoughts, or any other data here..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Data'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UserData; 