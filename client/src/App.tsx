import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Todos from "./pages/Todos";
import Login from "./pages/Login";
import UserData from "./pages/UserData";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Events from "./pages/dashboard/Events";
import TestEvents from "./pages/TestEvents";
import TestFullResults from "./pages/TestFullResults";
import Results from "./pages/dashboard/Results";
import EventDetail from "./pages/EventDetail";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import MyPicks from "./pages/dashboard/MyPicks";
import League from "./pages/dashboard/League";
import Leaderboards from "./pages/dashboard/Leaderboards";
import Profile from "./pages/dashboard/Profile";
import Upcoming from "./pages/dashboard/Upcoming";
import Leagues from "./pages/dashboard/Leagues";
import CreateLeague from "./pages/dashboard/CreateLeague";
import Settings from "./pages/dashboard/Settings";
import HowItWorks from "./pages/HowItWorks";
function AppContent() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Loading...
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="App h-dvh flex flex-col font-body">
                {/* <Header /> */}

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="events" element={<Events />} />s
                            <Route
                                path="results/:id/:cid"
                                element={<Results />}
                            />
                            <Route path="results/:id" element={<Results />} />
                            <Route path="events/:id" element={<EventDetail />} />
                            <Route path="upcoming/:id/:cid" element={<Upcoming />} />
                            <Route path="my-picks" element={<MyPicks />} />
                            <Route path="leaderboards" element={<Leaderboards />} />
                            <Route path="leaderboards/:leagueId" element={<Leaderboards />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="league/:slug" element={<League />} />
                            <Route path="leagues" element={<Leagues />} />
                            <Route path="create-league" element={<CreateLeague />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                        {/* <Route path="todos" element={<Todos />} /> */}
                        {/* <Route path="user-data" element={<UserData />} /> */}
                        {/* <Route path="/todos" element={<Todos />} /> */}
                        {/* <Route path="/user-data" element={<UserData />} /> */}
                        {/* Test pages - protected */}
                        {/* <Route path="/test-events" element={<TestEvents />} /> */}
                        {/* <Route
                            path="/test-results"
                            element={<TestFullResults />}
                        /> */}
                    </Route>

                    {/* 404 Route - must be the last route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>

                {/* <footer className="bg-gray-800 text-white p-4 text-center">
            <p>Task Manager App &copy; {new Date().getFullYear()}</p>
          </footer> */}
            </div>
        </ErrorBoundary>
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
