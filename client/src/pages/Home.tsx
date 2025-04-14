import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-5 gap-6">
          {/* Column 1 - Hero Text */}
          <div className="col-span-3 space-y-6">
            <h1 className="text-5xl font-bold text-gray-900">
              Welcome to Our Platform
            </h1>
            <p className="text-xl text-gray-600">
              Discover amazing features and services that will transform your experience.
            </p>
            <Link to="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Go to Dashboard
            </Link>
          </div>

          {/* Column 2 - Image */}
          <div className="col-span-2 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Placeholder Image</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-5 gap-6">
          {/* Feature 1 */}
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-sm">
            <div className="h-12 w-12 bg-blue-100 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Feature 1</h3>
            <p className="text-gray-600">Description of the first amazing feature.</p>
          </div>

          {/* Feature 2 */}
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-sm">
            <div className="h-12 w-12 bg-green-100 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Feature 2</h3>
            <p className="text-gray-600">Description of the second amazing feature.</p>
          </div>

          {/* Feature 3 */}
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-sm">
            <div className="h-12 w-12 bg-purple-100 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Feature 3</h3>
            <p className="text-gray-600">Description of the third amazing feature.</p>
          </div>

          {/* Feature 4 */}
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-sm">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Feature 4</h3>
            <p className="text-gray-600">Description of the fourth amazing feature.</p>
          </div>

          {/* Feature 5 */}
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-sm">
            <div className="h-12 w-12 bg-red-100 rounded-lg mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Feature 5</h3>
            <p className="text-gray-600">Description of the fifth amazing feature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
