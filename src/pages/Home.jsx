import { useState, useEffect, useMemo } from "react";
import PlantCard from "../components/PlantCard";

const API = import.meta.env.VITE_API_URL + "/plants";

const fallbackCollageImages = [
  "https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=700&q=80",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=700&q=80",
  "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=700&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=700&q=80",
];

const Home = () => {
  const [search, setSearch] = useState("");
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const res = await fetch(API);

      if (!res.ok) {
        console.error("API Error:", res.status);
        return;
      }

      const data = await res.json();
      setPlants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching plants:", err);
    }
  };

  const filteredPlants = plants.filter((plant) =>
    plant.name?.toLowerCase().includes(search.toLowerCase())
  );

  const collageImages = useMemo(() => {
    const apiImages = plants
      .flatMap((plant) => (Array.isArray(plant.images) ? plant.images : []))
      .filter(Boolean)
      .slice(0, 4);

    if (apiImages.length === 4) return apiImages;

    const combined = [...apiImages];
    for (const img of fallbackCollageImages) {
      if (combined.length >= 4) break;
      combined.push(img);
    }

    return combined.slice(0, 4);
  }, [plants]);

  return (
    <div className="p-6 space-y-10">
      {/* HERO SECTION */}
      <div
        className="rounded-3xl p-8 lg:p-10 flex flex-col lg:flex-row justify-between items-center gap-10 border border-green-100/10 shadow-sm overflow-hidden"
        style={{ backgroundColor: "rgb(15 61 46 / var(--tw-bg-opacity, 1))" }}
      >
        {/* LEFT */}
        <div className="max-w-[520px] w-full">
          <p className="font-bold text-green-200 tracking-wide">
            Discover the Power of
          </p>

          <h1 className="text-[40px] lg:text-[54px] font-bold text-white leading-tight">
            Herbal Healing
            <br />
            with Medicinal Plants 🌿
          </h1>

          <p className="text-white/90 text-[16px] lg:text-[17px] mt-4 leading-relaxed">
            Explore plants that have been valued in traditional wellness for
            immunity, skin care, digestion, respiratory support, and overall
            balance. Learn how nature can support a healthier lifestyle through
            simple, plant-based healing knowledge.
          </p>

          {/* SEARCH */}
          <div className="flex gap-2 mt-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for plants..."
              className="flex-1 px-5 py-3 rounded-xl border border-green-200 bg-green-50 text-sm outline-none focus:ring-2 focus:ring-green-200"
            />

            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-sm">
              Search
            </button>
          </div>

          {/* STATS */}
          <div className="flex gap-8 mt-6 font-bold text-white flex-wrap">
            {[
              { icon: "🌱", value: `${plants.length}+`, label: "Medicinal Plants" },
              { icon: "💊", value: "2500+", label: "Health Benefits" },
              { icon: "😊", value: "10K+", label: "Happy Users" },
            ].map((s) => (
              <div key={s.label} className="flex gap-2">
                <span>{s.icon}</span>

                <div>
                  <p className="text-sm font-semibold">{s.value}</p>
                  <p className="text-xs text-gray-300">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLLAGE */}
        <div className="relative w-full max-w-[520px]">
          <div className="absolute -inset-6 bg-green-100 rounded-[40px] blur-3xl opacity-10"></div>

          <div className="relative grid grid-cols-2 gap-4">
            {collageImages.map((img, index) => (
              <div
                key={index}
                className={`overflow-hidden rounded-2xl shadow-lg border border-white/10 ${
                  index === 0 || index === 3 ? "h-[180px]" : "h-[140px] mt-6"
                }`}
              >
                <img
                  src={img}
                  alt={`plant collage ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
            ))}
          </div>

          {/* INFO CARD */}
          <div className="mt-5 bg-white rounded-2xl shadow-xl border border-green-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              About Herbal Plants
            </p>

            <h4 className="font-bold mt-2 text-black text-lg">
              Nature’s Traditional Wellness Support
            </h4>

            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Herbal plants have long been used to support immunity, soothe
              common discomforts, improve skin and scalp health, and promote
              everyday wellness. They are valued for their natural healing
              properties and their role in preventive care.
            </p>
          </div>
        </div>
      </div>

      {/* PLANTS GRID */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Popular Plants
            </h2>

            <p className="text-xs text-gray-400">
              Explore medicinal plants from admin panel
            </p>
          </div>

          <button className="text-sm border px-4 py-1 rounded-lg text-white">
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredPlants.length > 0 ? (
            filteredPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))
          ) : (
            <p className="text-white col-span-full text-center">
              No plants found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;