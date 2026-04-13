import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import cardBg from "../assets/fullcardbg.png";

const API_URL = import.meta.env.VITE_API_URL;

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1585435557343-3b092031a831";

const RemedyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDiseaseById();
  }, [id]);

  useEffect(() => {
    if (!item || !item.variants || item.variants.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % item.variants.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [item]);

  const saveRecentlyViewed = (itemData) => {
    try {
      const existing =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];

      const cleaned = existing.filter(
        (x) =>
          !(
            String(x.itemType).toLowerCase() ===
              String(itemData.itemType).toLowerCase() &&
            String(x.itemId) === String(itemData.itemId)
          )
      );

      const updated = [
        {
          ...itemData,
          viewedAt: new Date().toISOString(),
        },
        ...cleaned,
      ].slice(0, 20);

      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recently viewed:", error);
    }
  };

  const fetchDiseaseById = async () => {
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

      const response = await fetch(`${API_URL}/user/diseases/${id}`, {
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
        if (response.status === 404) {
          throw new Error("Disease not found.");
        }
        throw new Error("Failed to fetch disease details.");
      }

      const data = await response.json();
      setItem(data);
      setIndex(0);

      saveRecentlyViewed({
        itemId: data.id,
        itemType: "disease",
        name: data.name,
        imageUrl: data.bannerImageUrl || data.cardImageUrl || DEFAULT_IMG,
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityText = (level) => {
    if (level === 0 || level === "0" || level === "Mild") return "Mild";
    if (level === 1 || level === "1" || level === "Moderate") return "Moderate";
    if (level === 2 || level === "2" || level === "Chronic") return "Chronic";
    return "Unknown";
  };

  const getSeverityStyle = (level) => {
    if (level === 0 || level === "0" || level === "Mild")
      return "bg-green-500/20 text-green-300";
    if (level === 1 || level === "1" || level === "Moderate")
      return "bg-yellow-500/20 text-yellow-300";
    if (level === 2 || level === "2" || level === "Chronic")
      return "bg-red-500/20 text-red-300";
    return "bg-gray-500/20 text-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading disease details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        No data found.
      </div>
    );
  }

  const current =
    item.variants && item.variants.length > 0 ? item.variants[index] : null;

  return (
    <div
      className="min-h-screen p-6 text-white"
      style={{
        backgroundImage: `url(${cardBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-black/60 p-6 rounded-3xl space-y-8">
        <div className="rounded-2xl overflow-hidden relative">
          <img
            src={item.bannerImageUrl || item.cardImageUrl || DEFAULT_IMG}
            alt={item.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMG;
            }}
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <p className="opacity-90">{item.description}</p>
          </div>
        </div>

        {current && (
          <>
            <div
              key={index}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 ease-in-out opacity-100"
            >
              <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-md">
                <p className="text-sm opacity-70">Severity</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityStyle(
                    current.severity
                  )}`}
                >
                  {getSeverityText(current.severity)}
                </span>
              </div>

              <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-md">
                <p className="text-sm opacity-70">Best Remedy</p>
                <p className="font-semibold">{current.bestRemedyTitle}</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-md">
                <p className="text-sm opacity-70">Recovery</p>
                <p className="font-semibold">{current.recovery}</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl text-center backdrop-blur-md">
                <p className="text-sm opacity-70">Category</p>
                <p className="font-semibold">Herbal Care</p>
              </div>
            </div>

            <div
              key={"remedy-" + index}
              className="bg-green-900/40 p-6 rounded-2xl backdrop-blur-md transition-all duration-700 ease-in-out"
            >
              <h2 className="text-xl font-bold mb-2">⭐ Best Remedy</h2>
              <h3 className="font-semibold mb-2 text-lg">
                {current.bestRemedyTitle}
              </h3>
              <p className="whitespace-pre-line">{current.bestRemedyDesc}</p>
            </div>
          </>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">🌿 Detailed Remedies</h2>
          <div className="space-y-4">
            {item.remedies?.map((r, i) => (
              <div
                key={i}
                className="bg-white/10 p-5 rounded-2xl backdrop-blur-md"
              >
                <h3 className="font-semibold mb-2">🌿 {r.title}</h3>
                <p>{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-900/40 p-5 rounded-2xl backdrop-blur-md">
          <h2 className="font-bold mb-2">⚠️ Precautions</h2>
          <ul className="list-disc pl-5">
            {item.precautions?.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-900/40 p-5 rounded-2xl backdrop-blur-md">
          <h2 className="font-bold mb-2">🧠 Why this works?</h2>
          <ul className="list-disc pl-5">
            {item.whyItWorks?.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold mb-2">🔗 Related</h2>
          <div className="flex gap-3 flex-wrap">
            {item.related?.map((r, i) => (
              <div
                key={i}
                onClick={() => navigate(`/app/remedy/${r.relatedDiseaseId}`)}
                className="cursor-pointer bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20"
              >
                {r.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemedyDetail;