import React from 'react';
import { Link } from 'react-router-dom';

const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Getting started with CompBeta Rocks is as easy as 1-2-3-4. Pick your podium, join your favorite leagues, and climb the leaderboards.
          </p>
        </div>
      </div>
      
      {/* Steps */}
      <div className="container mx-auto px-4 py-20">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row items-center mb-16 md:mb-24">
          <div className="md:w-1/4 flex justify-center mb-8 md:mb-0">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <div className="md:w-3/4 md:pl-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-blue-600 font-bold text-lg mb-1">Step 1: Sign Up & Join</div>
              <h2 className="text-2xl font-bold mb-4">Create Your Free Account</h2>
              <p className="text-gray-600">
                Sign up in seconds with email or Google SSO, then join an existing league or create your own private league for you and your friends.
              </p>
            </div>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="flex flex-col md:flex-row items-center mb-16 md:mb-24">
          <div className="md:w-1/4 flex justify-center mb-8 md:mb-0">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="md:w-3/4 md:pl-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-green-600 font-bold text-lg mb-1">Step 2: Pick Your Podium</div>
              <h2 className="text-2xl font-bold mb-4">Make Your Predictions</h2>
              <p className="text-gray-600">
                For each upcoming event, select who you think will finish 1st, 2nd, and 3rd. You can change your picks up until the event starts.
              </p>
            </div>
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="flex flex-col md:flex-row items-center mb-16 md:mb-24">
          <div className="md:w-1/4 flex justify-center mb-8 md:mb-0">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="md:w-3/4 md:pl-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-yellow-600 font-bold text-lg mb-1">Step 3: Earn Points & Compete</div>
              <h2 className="text-2xl font-bold mb-4">Score on Accuracy</h2>
              <p className="text-gray-600">
                Earn points for each correct podium position. The closer you are to the actual podium, the more points you earn.
              </p>
            </div>
          </div>
        </div>
        
        {/* Step 4 */}
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/4 flex justify-center mb-8 md:mb-0">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="md:w-3/4 md:pl-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-purple-600 font-bold text-lg mb-1">Step 4: Track & Share</div>
              <h2 className="text-2xl font-bold mb-4">Watch the Leaderboards</h2>
              <p className="text-gray-600">
                See how you stack up against friends and the global community. Share your wins on social media and brag about your climbing IQ!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gray-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Rock?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            What are you waiting for? Start predicting now and find out if you've got what it takes to top the podium.
          </p>
          <Link to="/login" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
