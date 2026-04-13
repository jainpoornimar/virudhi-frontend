import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";

const darkGreenPanel = {
  background: "#0f3d2e",
};

const API = import.meta.env.VITE_API_URL + "/plants";
const DEFAULT_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

export default function PlantDetail() {
  const { id } = useParams();

  const [plant, setPlant] = useState(null);
  const [active, setActive] = useState(0);
  const [selectedHelp, setSelectedHelp] = useState(null);

  useEffect(() => {
    fetchPlant();
  }, [id]);

  const saveRecentlyViewed = (item) => {
    try {
      const existing =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];

      const cleaned = existing.filter(
        (x) =>
          !(
            String(x.itemType).toLowerCase() ===
              String(item.itemType).toLowerCase() &&
            String(x.itemId) === String(item.itemId)
          )
      );

      const updated = [
        {
          ...item,
          viewedAt: new Date().toISOString(),
        },
        ...cleaned,
      ].slice(0, 20);

      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recently viewed:", error);
    }
  };

  const fetchPlant = async () => {
    try {
      const res = await fetch(`${API}/${id}`);

      if (!res.ok) {
        console.error("Failed to fetch plant");
        return;
      }

      const data = await res.json();
      setPlant(data);

      saveRecentlyViewed({
        itemId: data.id,
        itemType: "plant",
        name: data.name,
        imageUrl: data.images?.[0] || DEFAULT_IMG,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!plant?.images?.length) return;

    const interval = setInterval(() => {
      setActive((prev) =>
        prev === plant.images.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [plant]);

  if (!plant) {
    return <p className="text-white p-6">Plant not found</p>;
  }

  return (
    <div className="min-h-screen px-6 py-6 text-white">
      <div
        className="rounded-3xl p-5 space-y-4"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(2, 19, 13, 0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <img
            src={plant.images?.[active] || DEFAULT_IMG}
            className="w-full h-[380px] object-contain"
            alt={plant.name}
            style={{
              marginTop: "40px",
            }}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMG;
            }}
          />

          <div className="flex gap-3 p-4">
            {plant.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setActive(i)}
                className={`w-[70px] h-[70px] object-cover rounded-xl cursor-pointer border-2 transition ${
                  active === i
                    ? "border-green-400 scale-105"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMG;
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-6" style={darkGreenPanel}>
          <div>
            <h1 className="text-6xl font-bold tracking-wide">
              {plant.name}
            </h1>
            <p className="text-green-200 mt-1">
              {plant.scientific}
            </p>
          </div>

          <p className="text-white leading-relaxed text-lg">
            {plant.description}
          </p>

          <div className="flex flex-wrap gap-2">
            {plant.properties?.map((p, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1 rounded-full bg-white/10 text-green-100 border border-white/10"
              >
                {p}
              </span>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-100">
              How can I help you?
            </h3>

            <div className="flex gap-3 flex-wrap">
              {plant.helps?.map((h, i) => {
                const problem = h.problem || h.Problem;
                const remedy = h.remedy || h.Remedy;
                const tips = h.tips || h.Tips;

                return (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedHelp({
                        icon: <FaLeaf />,
                        title: problem,
                        remedy: remedy,
                        tips: tips,
                      })
                    }
                    className="w-[95px] h-[85px] rounded-xl flex flex-col items-center justify-center text-xs border border-white/10 bg-white/5 hover:bg-white/15 hover:scale-105 hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-lg text-green-300 mb-1">🌿</span>
                    {problem}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedHelp && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedHelp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[360px] h-[480px] text-white rounded-3xl shadow-2xl relative ml-[250px]"
            style={{
              background: "#0f3d2e",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div className="h-full overflow-y-auto hide-scrollbar p-6 text-lg">
              <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white text-lg"
                onClick={() => setSelectedHelp(null)}
              >
                ✖
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  {selectedHelp.icon}
                </div>

                <h2 className="text-2xl font-bold">
                  {selectedHelp.title}
                </h2>
              </div>

              <div className="space-y-2 text-gray-200">
                {(selectedHelp.remedy || selectedHelp.Remedy)
                  ?.split("\n")
                  .map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
              </div>

              {(selectedHelp.tips || selectedHelp.Tips)?.length > 0 && (
                <div className="mt-6 bg-white/10 rounded-xl p-4">
                  <p className="font-semibold mb-2">💡 Tips</p>

                  <ul className="space-y-2 text-gray-200">
                    {(selectedHelp.tips || selectedHelp.Tips).map((tip, i) => (
                      <li key={i} className="flex gap-2">
                        <span>•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}