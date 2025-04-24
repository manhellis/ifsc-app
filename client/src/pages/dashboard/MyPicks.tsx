import { useEffect, useState } from "react";
import { predictionsApi } from "../../api/predictions";
import { PodiumPrediction } from "@shared/types/Prediction";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const MyPicks = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<(PodiumPrediction & { eventName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    year: "",
    discipline: "",
    league: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [predictionToDelete, setPredictionToDelete] = useState<string | null>(null);

  // Filter the predictions into upcoming and past
  const upcomingPredictions = predictions.filter(pred => !pred.event_finished);
  const pastPredictions = predictions.filter(pred => pred.event_finished);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        
        // Build query based on filters
        const query: Record<string, unknown> = {};
        
        if (filters.year) query.year = filters.year;
        if (filters.discipline) query.discipline = filters.discipline;
        if (filters.league) query.leagueId = filters.league;
        
        // Use the new API method to get predictions with event details
        const response = await predictionsApi.queryPredictionsWithEvents(query);
        
        setPredictions(response.predictions);
        setError(null);
      } catch (err) {
        console.error("Error fetching predictions:", err);
        setError("Failed to load predictions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = (id: string) => {
    setPredictionToDelete(id);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!predictionToDelete) return;
    
    try {
      const response = await predictionsApi.deletePrediction(predictionToDelete);
      if (response.success) {
        // Remove prediction from state
        setPredictions(prev => prev.filter(pred => pred._id !== predictionToDelete));
        toast.success("Prediction deleted successfully");
      } else {
        toast.error(response.error || "Failed to delete prediction");
      }
    } catch (err) {
      console.error("Error deleting prediction:", err);
      toast.error("An error occurred while deleting the prediction");
    } finally {
      setShowModal(false);
      setPredictionToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPredictionToDelete(null);
  };

  return (
    <div className="p-4">
      {/* Page Title */}
      <h1 className="text-2xl font-bold mb-4">My Picks</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <select 
          name="year" 
          value={filters.year} 
          onChange={handleFilterChange}
          className="border border-gray-300 p-2 rounded w-40"
        >
          <option value="">All Years</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
        <select 
          name="discipline" 
          value={filters.discipline} 
          onChange={handleFilterChange}
          className="border border-gray-300 p-2 rounded w-40"
        >
          <option value="">All Disciplines</option>
          <option value="lead">Lead</option>
          <option value="boulder">Boulder</option>
          <option value="speed">Speed</option>
          <option value="combined">Combined</option>
        </select>
        <select 
          name="league" 
          value={filters.league} 
          onChange={handleFilterChange}
          className="border border-gray-300 p-2 rounded w-40"
        >
          <option value="">All Leagues</option>
          <option value="ifsc">IFSC</option>
          <option value="usa">USA Climbing</option>
        </select>
      </div>

      {/* Loading and Error States */}
      {loading && <div className="text-center py-4">Loading predictions...</div>}
      {error && <div className="text-center py-4 text-red-500">{error}</div>}

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
        {!loading && upcomingPredictions.length === 0 && (
          <div className="text-gray-500">No upcoming predictions found.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {upcomingPredictions.map((prediction) => (
            <div key={prediction._id} className="bg-white border border-gray-200 rounded shadow p-4 h-40 relative">
              <h3 className="font-semibold text-lg truncate">
                {prediction.eventName || `Event ID: ${prediction.eventId}`}
              </h3>
              <div className="text-sm text-gray-600 mb-2">Category: {prediction.categoryName}</div>
              
              {prediction.type === "podium" && (
                <div className="text-sm">
                  <div>1st: {prediction.data.first}</div>
                  <div>2nd: {prediction.data.second}</div>
                  <div>3rd: {prediction.data.third}</div>
                </div>
              )}
              
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <button 
                  className="bg-red-600 text-white px-2 py-1 text-sm rounded"
                  onClick={() => prediction._id && handleDeleteClick(prediction._id)}
                >
                  Delete
                </button>
                <button 
                  className="bg-blue-600 text-white px-2 py-1 text-sm rounded"
                  onClick={() => {
                    navigate(`/dashboard/upcoming/${prediction.eventId}/${prediction.categoryId}`);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past</h2>
        {!loading && pastPredictions.length === 0 && (
          <div className="text-gray-500">No past predictions found.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pastPredictions.map((prediction) => (
            <div key={prediction._id} className="bg-white border border-gray-200 rounded shadow p-4 h-40 relative">
              <h3 className="font-semibold text-lg truncate">
                {prediction.eventName || `Event ID: ${prediction.eventId}`}
              </h3>
              <div className="text-sm text-gray-600 mb-2">Category: {prediction.categoryName}</div>
              
              {prediction.type === "podium" && (
                <div className="text-sm">
                  <div>1st: {prediction.data.first}</div>
                  <div>2nd: {prediction.data.second}</div>
                  <div>3rd: {prediction.data.third}</div>
                </div>
              )}
              
              <div className="absolute bottom-2 right-2 px-2 py-1 text-sm">
                {prediction.points !== undefined ? (
                  <span className="text-green-600 font-semibold">Points: {prediction.points}</span>
                ) : (
                  <span className="text-gray-500">Not scored</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-2">Confirm Deletion</h2>
            <p className="mb-4">Are you sure you want to delete this prediction? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPicks;