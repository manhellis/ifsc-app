import { useEffect, useState } from "react";
import { predictionsApi } from "../../api/predictions";
import { PodiumPrediction } from "@shared/types/Prediction";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Extended type for our component that includes athletes and points
interface ExtendedPrediction extends PodiumPrediction {
  eventName?: string;
  totalPoints?: number; // For displaying points
  athletes?: {
    first: {
      id: string;
      firstname: string;
      lastname: string;
    };
    second: {
      id: string;
      firstname: string;
      lastname: string;
    };
    third: {
      id: string;
      firstname: string;
      lastname: string;
    };
  };
}

const MyPicks = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<ExtendedPrediction[]>([]);
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

  // Helper function to display athlete name
  const renderAthleteName = (prediction: ExtendedPrediction, position: 'first' | 'second' | 'third') => {
    if (prediction.athletes?.[position]) {
      const athlete = prediction.athletes[position];
      return `${athlete.firstname} ${athlete.lastname}`;
    }
    return prediction.data[position];
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
        <div className="space-y-3">
          {upcomingPredictions.map((prediction) => (
            <div key={prediction._id} className="bg-white p-3 rounded-md shadow-sm">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">{prediction.eventName || `Event ID: ${prediction.eventId}`}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Category: {prediction.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(prediction.createdAt || "").toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${prediction.locked ? "bg-gray-200" : "bg-green-100"}`}>
                    {prediction.locked ? "Locked" : "Open"}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                  <span className="text-xs text-gray-600 block">🥇 First</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'first')}</span>
                </div>
                <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="text-xs text-gray-600 block">🥈 Second</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'second')}</span>
                </div>
                <div className="flex-1 bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="text-xs text-gray-600 block">🥉 Third</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'third')}</span>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end space-x-2">
                <button 
                  className="bg-red-600 text-white px-2 py-1 text-sm rounded hover:bg-red-700"
                  onClick={() => prediction._id && handleDeleteClick(prediction._id)}
                >
                  Delete
                </button>
                <button 
                  className="bg-blue-600 text-white px-2 py-1 text-sm rounded hover:bg-blue-700"
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
        <div className="space-y-3">
          {pastPredictions.map((prediction) => (
            <div key={prediction._id} className="bg-white p-3 rounded-md shadow-sm">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">{prediction.eventName || `Event ID: ${prediction.eventId}`}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Category: {prediction.categoryName}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(prediction.createdAt || "").toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-yellow-50 p-2 rounded border border-yellow-200">
                  <span className="text-xs text-gray-600 block">🥇 First</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'first')}</span>
                  {prediction.scoreDetails?.podium && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                      +{prediction.scoreDetails.podium.pointsByPlace.first}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-gray-50 p-2 rounded border border-gray-200">
                  <span className="text-xs text-gray-600 block">🥈 Second</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'second')}</span>
                  {prediction.scoreDetails?.podium && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                      +{prediction.scoreDetails.podium.pointsByPlace.second}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="text-xs text-gray-600 block">🥉 Third</span>
                  <span className="font-medium">{renderAthleteName(prediction, 'third')}</span>
                  {prediction.scoreDetails?.podium && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                      +{prediction.scoreDetails.podium.pointsByPlace.third}
                    </span>
                  )}
                </div>
              </div>
              
              {prediction.totalPoints !== undefined && (
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Total: {prediction.totalPoints} pts
                  </span>
                </div>
              )}
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