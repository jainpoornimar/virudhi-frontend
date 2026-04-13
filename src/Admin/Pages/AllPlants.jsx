import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL + "/admin/plants";
const getToken = () => localStorage.getItem("token");

export default function AllPlants() {
  const navigate = useNavigate();

  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setLoading(true);

      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch plants");
      }

      const data = await res.json();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch plants error:", err);
      alert("Failed to load plants.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plants;

    return plants.filter((p) =>
      [p.name, p.scientific, p.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, plants]);

  const normalizePlantForEdit = (plant) => {
    return {
      id: plant?.id ?? null,
      name: plant?.name || "",
      scientific: plant?.scientific || "",
      description: plant?.description || "",
      images:
        Array.isArray(plant?.images) && plant.images.length > 0
          ? plant.images
          : [""],
      properties:
        Array.isArray(plant?.properties) && plant.properties.length > 0
          ? plant.properties
          : [""],
      helps:
        Array.isArray(plant?.helps) && plant.helps.length > 0
          ? plant.helps.map((h) => ({
              problem: h?.problem || "",
              remedy: h?.remedy || "",
              tips:
                Array.isArray(h?.tips) && h.tips.length > 0 ? h.tips : [""],
            }))
          : [
              {
                problem: "",
                remedy: "",
                tips: [""],
              },
            ],
    };
  };

  const handleDelete = async (plant) => {
    const ok = window.confirm(`Delete "${plant.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/${plant.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete plant");
      }

      await fetchPlants();
    } catch (err) {
      console.error("Delete plant error:", err);
      alert("Failed to delete plant.");
    }
  };

  const handleEdit = (plant) => {
    const normalizedPlant = normalizePlantForEdit(plant);
    navigate("/admin/actions", { state: { plant: normalizedPlant } });
  };

  return (
    <div
      className="min-h-screen px-6 py-6 text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(34,50,36,0.78), rgba(34,50,36,0.86)), url('https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-wide">All Plants</h1>
            <div className="mt-2 h-px w-full bg-white/20" />
          </div>

          <button
            onClick={() => navigate("/admin/actions")}
            className="rounded-xl bg-green-700 px-6 py-3 font-semibold transition hover:bg-green-600"
          >
            Back to Add Plant
          </button>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plants by name, scientific name..."
            className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-4 text-slate-800 outline-none placeholder:text-slate-500"
          />
        </div>

        {loading ? (
          <p className="text-lg text-white/80">Loading plants...</p>
        ) : filteredPlants.length === 0 ? (
          <p className="text-lg text-white/80">No plants found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlants.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md"
              >
                <div className="relative h-52 w-full">
                  <img
                    src={
                      p.images?.[0] ||
                      "https://via.placeholder.com/300x200?text=No+Image"
                    }
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-3xl font-semibold">{p.name}</h2>
                    <p className="mt-1 text-sm text-white/90">
                      {p.scientific}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  <p className="line-clamp-3 text-sm text-white/80">
                    {p.description}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}