import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Category {
    id: number;
    name: string;
}

interface Athlete {
    athlete_id: number;
    firstname: string;
    lastname: string;
    name: string;
    gender: number;
    federation: string;
    federation_id: number;
    country: string;
    d_cats: Category[];
}

const Upcoming = () => {
    const { id, cid } = useParams();
    const [registration, setRegistration] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchRegistration = async () => {
            try {
                const response = await fetch(`/api/upcoming/${id}/${cid}`);
                const data = await response.json();
                setRegistration(data);
            } catch (error) {
                setError(error instanceof Error ? error : new Error('An error occurred'));
            } finally {
                setLoading(false);
            }
        };
        fetchRegistration();
    }, [id, cid]);

    const renderTable = (data: Athlete[]) => (
      <div className="overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Athlete ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Federation</th>
              <th>Country</th>
              <th>Categories</th>
            </tr>
          </thead>
          <tbody>
            {data.map((athlete) => (
              <tr key={athlete.athlete_id}>
                <td>{athlete.athlete_id}</td>
                <td>{athlete.firstname}</td>
                <td>{athlete.lastname}</td>
                <td>{athlete.name}</td>
                <td>{athlete.gender === 1 ? "Female" : "Male"}</td>
                <td>{athlete.federation}</td>
                <td>{athlete.country}</td>
                <td>{athlete.d_cats.map((cat) => cat.name).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    // Filter registrations by the category ID from the URL parameter
    const categoryRegistrations = registration.filter((athlete) => 
        athlete.d_cats.some(cat => cat.id === Number(cid))
    );

    return (
        <div>
            <h1>Upcoming Registrations</h1>
            <div>
                {categoryRegistrations.length > 0 ? 
                    renderTable(categoryRegistrations) : 
                    <p>No registrations found for this category.</p>
                }
            </div>
        </div>
    );
}

export default Upcoming;