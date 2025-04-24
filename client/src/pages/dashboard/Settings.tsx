import { useAuth } from "../../contexts/AuthContext";
import AdminScoringPanel from "../../components/admin/AdminScoringPanel";

const Settings = () => {
    const { user } = useAuth();
    
    // Check if user is admin
    const isAdmin = user?.accountType === "admin";
    
    if (!isAdmin) {
        return (
            <div className="p-5">
                <h1 className="text-2xl font-bold mb-4">User Settings</h1>
                <p className="text-gray-600">
                    You only have access to user settings. Contact an administrator for additional options.
                </p>
                {/* User-only settings content here */}
            </div>
        );
    }
    
    return (
        <div className="p-5">
            <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>
            <p className="text-gray-600 mb-4">
                Welcome to the admin settings panel. Here you can manage system-wide settings.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
                {/* Admin Scoring Panel for testing new API routes */}
                <div>
                    <h2 className="text-xl font-semibold mb-2">Scoring Administration</h2>
                    <AdminScoringPanel />
                </div>
                
                {/* Additional admin settings sections can be added here */}
            </div>
        </div>
    );
};

export default Settings;

