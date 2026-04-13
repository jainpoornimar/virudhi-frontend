import { useEffect, useMemo, useState } from "react";
import { FiHeart, FiEye, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FAVORITES_API = `${API_BASE_URL}/favorites`;

const DEFAULT_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

const Favorites = () => {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const fetchFavoritesData = async () => {
  try {
    setLoading(true);

    const res = await fetch(FAVORITES_API, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    let data = [];
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    if (!res.ok) {
      throw new Error(
        data?.message || data?.title || "Failed to fetch favorites"
      );
    }

    const favoritesList = Array.isArray(data) ? data : [];

    const enrichedFavorites = await Promise.all(
      favoritesList.map(async (item) => {
        try {
          const type = (item.itemType || item.type || "").toLowerCase();

          let detailsUrl = "";

          if (type === "plant") {
            detailsUrl = `${API_BASE_URL}/plants/${item.itemId}`;
          } else if (type === "disease") {
            detailsUrl = `${API_BASE_URL}/diseases/${item.itemId}`;
          } else if (type === "remedy") {
            detailsUrl = `${API_BASE_URL}/diseases/${item.itemId}`;
          }

          if (!detailsUrl) return item;

          const detailRes = await fetch(detailsUrl, {
            method: "GET",
            headers: getAuthHeaders(),
          });

          if (!detailRes.ok) return item;

          let detailData = null;
          try {
            detailData = await detailRes.json();
          } catch {
            detailData = null;
          }

          if (!detailData) return item;

          return {
            ...detailData,
            ...item,
            id: item.id,
            itemId: item.itemId,
            itemType: item.itemType || type,
            name: item.name || detailData.name,
            description: item.description || detailData.description,
            imageUrl:
              item.imageUrl ||
              detailData.imageUrl ||
              detailData.images?.[0] ||
              detailData.cardImageUrl ||
              "",
            properties: detailData.properties || [],
            helps: detailData.helps || [],
            remedies: detailData.remedies || [],
            benefits: detailData.benefits || [],
            category: detailData.category || item.category,
            scientific: detailData.scientific || item.scientific,
          };
        } catch {
          return item;
        }
      })
    );

    setFavorites(enrichedFavorites);
  } catch (error) {
    console.error("Error loading favorites:", error);
    setFavorites([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchFavoritesData();
  }, []);

  const getImage = (item) => {
    const img = item.imageUrl || item.images?.[0] || item.cardImageUrl || "";

    if (!img) return DEFAULT_IMG;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;

    // base64 images are allowed, but may fail if truncated in DB
    if (img.startsWith("data:image/")) return img;

    return DEFAULT_IMG;
  };

  const getShortText = (text, max = 105) => {
    if (!text) return "No description available.";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
  };

  const getTypeLabel = (item) => {
    if (item.itemType) return item.itemType.toLowerCase();
    if (item.type) return item.type.toLowerCase();
    if (item.remedyType) return "disease";
    if (item.scientific || item.properties || item.helps) return "plant";
    if (item.cardImageUrl) return "disease";
    return "plant";
  };

  const getDetailsRoute = (item) => {
    const itemType = getTypeLabel(item);
    return itemType === "disease"
      ? `/app/remedy/${item.itemId || item.id}`
      : `/app/plant/${item.itemId || item.id}`;
  };

  const getCategory = (item) => {
    if (item.properties?.length) return item.properties[0];
    if (item.category) return item.category;
    if (item.itemType) return item.itemType;
    if (item.type) return item.type;
    return "Herbal";
  };

  const getComparePoints = (item) => {
    const points = [];

    if (item.properties?.length) {
      points.push(...item.properties.slice(0, 3));
    }

    if (item.helps?.length) {
      const helpNames = item.helps
        .map((h) => h.problem)
        .filter(Boolean)
        .slice(0, 3);
      points.push(...helpNames);
    }

    if (item.benefits?.length) {
      points.push(...item.benefits.slice(0, 3));
    }

    return [...new Set(points)].slice(0, 3);
  };

  const filteredFavorites = useMemo(() => {
    let filtered = favorites.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (filter === "recent") {
      filtered = filtered.slice(0, 3);
    }

    return filtered;
  }, [favorites, search, filter]);

  const removeFav = async (id, e) => {
    if (e) e.stopPropagation();

    try {
      const res = await fetch(`${FAVORITES_API}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            "Failed to remove favorite"
        );
      }

      setFavorites((prev) => prev.filter((item) => item.id !== id));
      setSelected((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert(error.message || "Failed to remove favorite");
    }
  };

  const toggleSelect = (item) => {
    const alreadySelected = selected.some((p) => p.id === item.id);

    if (alreadySelected) {
      setSelected((prev) => prev.filter((p) => p.id !== item.id));
      return;
    }

    if (selected.length < 2) {
      setSelected((prev) => [...prev, item]);
    }
  };

  const totalFavorites = favorites.length;

  const categoryCount = {};
  favorites.forEach((item) => {
    const cat = getCategory(item);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const mostSavedCategory =
    Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).reduce((a, b) =>
          categoryCount[a] > categoryCount[b] ? a : b
        )
      : "N/A";

  const recentlyAdded = favorites.length > 0 ? favorites[0]?.name : "N/A";

  return (
    <div className="p-6 text-white min-h-screen relative">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">❤️ Favorites</h1>
          <p className="text-white/70 text-sm">
            Save, explore, and compare your favorite herbal items
          </p>
        </div>

        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm shadow animate-pulse">
          Click any 2 cards to compare
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md shadow-lg">
          <p className="text-sm text-white/70 mb-1">Total Favorites</p>
          <h2 className="text-2xl font-bold">{totalFavorites}</h2>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md shadow-lg">
          <p className="text-sm text-white/70 mb-1">Most Saved Category</p>
          <h2 className="text-xl font-semibold">{mostSavedCategory}</h2>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md shadow-lg">
          <p className="text-sm text-white/70 mb-1">Recently Added</p>
          <h2 className="text-xl font-semibold line-clamp-1">
            {recentlyAdded}
          </h2>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search favorites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[240px] p-3 rounded-xl border border-green-200 text-black"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl transition ${
              filter === "all"
                ? "bg-green-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("recent")}
            className={`px-4 py-2 rounded-xl transition ${
              filter === "recent"
                ? "bg-green-600"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center opacity-70">Loading favorites...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFavorites.length > 0 ? (
            filteredFavorites.map((item) => {
              const isSelected = selected.some((p) => p.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item)}
                  className={`bg-white/10 p-4 rounded-2xl backdrop-blur-md shadow-lg cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-green-400 scale-[1.02]"
                      : "hover:scale-[1.01]"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={getImage(item)}
                      alt={item.name}
                      className="w-full h-40 object-cover rounded-xl mb-3"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_IMG;
                      }}
                    />

                    <button
                      onClick={(e) => removeFav(item.id, e)}
                      className="absolute top-2 right-2 bg-black/40 hover:bg-red-500 p-2 rounded-full transition"
                      title="Remove favorite"
                    >
                      <FiHeart className="text-white text-base fill-current" />
                    </button>

                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Selected
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-1 line-clamp-1">
                    {item.name}
                  </h3>

                  <div className="inline-block mb-2 px-3 py-1 text-xs rounded-full bg-green-600/20 text-green-200 border border-green-400/20">
                    {getCategory(item)}
                  </div>

                  <p className="text-sm opacity-80 mb-3 min-h-[64px] leading-6">
                    {getShortText(item.description)}
                  </p>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(getDetailsRoute(item));
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
                    >
                      <FiEye />
                      Explore Details
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center col-span-full opacity-70">
              No favorites found
            </p>
          )}
        </div>
      )}

      {selected.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => setSelected([])}
              className="absolute -top-12 right-0 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-white flex items-center gap-2"
            >
              <FiX />
              Close
            </button>

            <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">
              {selected.map((item, i) => (
                <div
                  key={item.id || i}
                  className="w-full md:w-[42%] max-w-[420px] bg-[#0f3d2e] text-white p-4 rounded-2xl shadow-xl"
                >
                  <img
                    src={getImage(item)}
                    alt={item.name}
                    className="w-full h-40 sm:h-44 object-cover rounded-xl mb-3"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMG;
                    }}
                  />

                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-xl font-bold line-clamp-1">
                      {item.name}
                    </h2>
                    <span className="bg-green-600 px-3 py-1 rounded-full text-xs shrink-0">
                      {getTypeLabel(item)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-200 line-clamp-3 mb-3">
                    {item.description || "No description available."}
                  </p>

                  <div className="mb-3">
                    <p className="text-xs text-green-200 mb-1">Category</p>
                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-sm">
                      {getCategory(item)}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-green-200 mb-2">Key Highlights</p>
                    <div className="flex flex-wrap gap-2">
                      {getComparePoints(item).length > 0 ? (
                        getComparePoints(item).map((point, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-green-700/80 text-xs"
                          >
                            {point}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-white/70">
                          No extra highlights
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/10 rounded-xl p-3 min-h-[72px] flex flex-col justify-center">
                      <p className="text-xs text-green-200 mb-1">
                        Properties Count
                      </p>
                      <h4 className="text-lg font-semibold">
                        {item.properties?.length || 0}
                      </h4>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3 min-h-[72px] flex flex-col justify-center">
                      <p className="text-xs text-green-200 mb-1">Uses / Helps</p>
                      <h4 className="text-lg font-semibold">
                        {item.helps?.length || item.remedies?.length || 0}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}

              <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-green-600 px-5 py-2 rounded-full font-bold shadow-xl z-10">
                VS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;