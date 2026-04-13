import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://localhost:7099/api/admin/diseases";
const getToken = () => localStorage.getItem("token");

export default function AllDiseases() {
  const navigate = useNavigate();

  const [diseases, setDiseases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      setLoading(true);
      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch diseases");

      const data = await res.json();
      setDiseases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiseases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return diseases;

    return diseases.filter((d) =>
      [d.name, d.description]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [search, diseases]);

  const handleDelete = async (disease) => {
    const ok = window.confirm(`Delete "${disease.name}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`${API}/${disease.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      fetchDiseases();
    } catch (err) {
      console.error(err);
      alert("Failed to delete disease.");
    }
  };

  const handleEdit = (disease) => {
    navigate("/admin/diseases", { state: { disease } });
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
            <h1 className="text-4xl font-semibold tracking-wide">All Diseases</h1>
            <div className="mt-2 h-px w-full bg-white/20" />
          </div>

          <button
            onClick={() => navigate("/admin/diseases")}
            className="rounded-xl bg-green-700 px-6 py-3 font-semibold transition hover:bg-green-600"
          >
            Back to Form
          </button>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diseases..."
            className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-4 text-slate-800 outline-none placeholder:text-slate-500"
          />
        </div>

        {loading ? (
          <p className="text-lg text-white/80">Loading diseases...</p>
        ) : filteredDiseases.length === 0 ? (
          <p className="text-lg text-white/80">No diseases found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredDiseases.map((d) => {
              const firstVariant = d.variants?.[0];
              return (
                <div
                  key={d.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md"
                >
                  <div className="relative h-52 w-full">
                    <img
                      src={
                        d.cardImageUrl ||
                        d.bannerImageUrl ||
                        "https://via.placeholder.com/300x200?text=No+Image"
                      }
                      alt={d.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-3xl font-semibold">{d.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-white/90">{d.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="rounded-xl bg-white/85 px-4 py-2 text-slate-700">
                        {firstVariant?.recovery || "No recovery"}
                      </div>

                      {d.variants?.length ? (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                          {d.variants[0].severity}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(d)}
                        className="flex-1 rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}