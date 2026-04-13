import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlipCard from "./FlipCard";

const API_URL = import.meta.env.VITE_API_URL;

const RemediesPage = () => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/user/diseases`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        if (response.status === 403) {
          throw new Error("Access denied.");
        }
        throw new Error("Failed to fetch diseases.");
      }

      const data = await response.json();
      setDiseases(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = diseases.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const visibleCards = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-3">
          Heal Naturally 🌿
        </h1>
        <div className="flex justify-between items-center">
          <p className="text-lg text-green-300">
            Find easy remedies for all your health concerns
          </p>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-green-700 underline"
          >
            {showAll ? "Show Less" : "View All"}
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search diseases..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 p-3 rounded-xl border border-green-200 focus:outline-none"
      />

      {loading && (
        <p className="text-white text-center mt-10">Loading diseases...</p>
      )}

      {error && (
        <p className="text-red-400 text-center mt-10">{error}</p>
      )}

      {!loading && !error && visibleCards.length === 0 && (
        <p className="text-white text-center mt-10">No diseases found.</p>
      )}

      {!loading && !error && visibleCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleCards.map((item) => (
            <FlipCard key={item.id} data={item} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RemediesPage;