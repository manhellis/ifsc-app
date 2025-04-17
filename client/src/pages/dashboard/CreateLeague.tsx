// client/src/pages/dashboard/CreateLeague.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { leagueApi } from "../../api";
import { RadioGroup, RadioGroupOption } from "@headlessui/react";

const leagueTypes = [
  { value: "public", label: "Public (anyone can request to join)" },
  { value: "private", label: "Private (invite code required)" },
];

interface FormErrors {
  name?: string;
  description?: string;
  maxMembers?: string;
  server?: string; // Add server error field
}

const CreateLeaguePage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [maxMembers, setMaxMembers] = useState<number | "">("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [leagueSlug, setLeagueSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Client-side validation
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      errs.name = "League name is required.";
    } else if (!/^[a-zA-Z0-9 ]{3,30}$/.test(trimmedName)) {
      errs.name = "Name must be 3–30 letters, numbers, or spaces.";
    }
    if (description.length > 200) {
      errs.description = "Description must be 200 characters or fewer.";
    }
    if (maxMembers !== "" && (maxMembers < 2 || maxMembers > 1000)) {
      errs.maxMembers = "Max members must be between 2 and 1000.";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        maxMembers: maxMembers === "" ? undefined : maxMembers,
      };
      
      const result = await leagueApi.createLeague(payload);
      
      if (result.success) {
        // Set success state and show modal
        setIsSuccess(true);
        setLeagueSlug(result.slug!);
        setShowModal(true);
      } else {
        // Show error modal with the specific error
        setIsSuccess(false);
        setErrorMessage(result.error || "Failed to create league. Please try again.");
        setShowModal(true);
        
        // Also set form-level error if it's related to validation
        if (result.error && (
            result.error.includes("name") || 
            result.error.includes("League name")
        )) {
          setErrors(prev => ({ ...prev, name: result.error }));
        } else {
          setErrors(prev => ({ ...prev, server: result.error }));
        }
      }
    } catch (err) {
      console.error("Failed to create league:", err);
      // Show error modal
      setIsSuccess(false);
      setErrorMessage(err instanceof Error ? err.message : "Unknown error occurred");
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLeague = () => {
    navigate(`/league/${leagueSlug}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (isSuccess) {
      navigate(`/league/${leagueSlug}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create a New League</h1>
      <form onSubmit={handleSubmit} noValidate>
        {/* Server error message */}
        {errors.server && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{errors.server}</p>
          </div>
        )}
        
        {/* League Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            League Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring ${
              errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring ${
              errors.description ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"
            }`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* League Type */}
        <fieldset className="mb-4">
          <legend className="block text-sm font-medium text-gray-700">League Type</legend>
          <RadioGroup value={type} onChange={setType} className="mt-2">
            {leagueTypes.map((lt) => (
              <RadioGroupOption key={lt.value} value={lt.value} className={({ checked }) =>
                  `cursor-pointer select-none rounded-md px-4 py-2 mb-2 border ${
                    checked ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-900 border-gray-300"
                  }`
                }>
                {({ checked }) => (
                  <div className="flex items-center">
                    <span className="mr-2">
                      {checked ? "🔘" : "⚪️"}
                    </span>
                    <span>{lt.label}</span>
                  </div>
                )}
              </RadioGroupOption>
            ))}
          </RadioGroup>
        </fieldset>

        {/* Max Members */}
        <div className="mb-6">
          <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700">
            Max Members (optional)
          </label>
          <input
            id="maxMembers"
            type="number"
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value === "" ? "" : Number(e.target.value))}
            className={`mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring ${
              errors.maxMembers ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"
            }`}
            min={2}
            max={1000}
          />
          {errors.maxMembers && <p className="mt-1 text-sm text-red-600">{errors.maxMembers}</p>}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
              isSubmitting ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isSubmitting ? "Creating..." : "Create League"}
          </button>
        </div>
      </form>

      {/* Confirmation/Error Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {isSuccess ? (
              <>
                <h2 className="text-xl font-bold text-green-600 mb-2">Success!</h2>
                <p className="mb-4">Your league "{name}" has been created successfully.</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleGoToLeague}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  >
                    Go to League
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
                <p className="mb-4">{errorMessage}</p>
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateLeaguePage;