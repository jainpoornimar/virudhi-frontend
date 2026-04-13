import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchFavorites, toggleFavorite } from "../utils/favoritesApi";

const DEFAULT_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

const PlantCard = ({ plant }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  useEffect(() => {
    const loadFav = async () => {
      try {
        const favs = await fetchFavorites();
        const exists = favs.some(
          (f) =>
            String(f.itemType).toLowerCase() === "plant" &&
            String(f.itemId) === String(plant.id)
        );
        setLiked(exists);
      } catch (e) {
        console.error("Failed to load favorites:", e);
      }
    };

    if (plant?.id) {
      loadFav();
    }
  }, [plant?.id]);

  const handleClick = () => {
    navigate(`/app/plant/${plant.id}`);
  };

  const getSafeImage = () => {
    const img = plant.images?.[0] || "";

    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;

    // allow base64 too, but whether it survives depends on DB column size
    if (img.startsWith("data:image/")) return img;

    return "";
  };

  const handleLike = async (e) => {
    e.stopPropagation();

    if (loadingFav) return;

    try {
      setLoadingFav(true);

      const result = await toggleFavorite({
        itemType: "plant",
        itemId: plant.id,
        name: plant.name || "Unnamed Plant",
        description: plant.description || "",
        imageUrl: getSafeImage(),
      });

      setLiked(result.action === "added");
    } catch (err) {
      console.error("Favorite error:", err);
      alert(err.message || "Failed to update favorite");
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="rounded-2xl overflow-hidden hover:shadow-lg cursor-pointer border border-green-100"
      style={{ backgroundColor: "rgb(15 61 46)" }}
    >
      <div className="relative h-[130px]">
        <img
          src={plant.images?.[0] || DEFAULT_IMG}
          alt={plant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_IMG;
          }}
        />

        <button
          onClick={handleLike}
          disabled={loadingFav}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center transition ${
            liked ? "text-red-500" : "text-gray-400"
          } ${loadingFav ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {liked ? "♥" : "♡"}
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-sm text-white">{plant.name}</h3>
        <p className="text-xs text-gray-400">
          {plant.properties?.[0] || "Herbal plant"}
        </p>
      </div>
    </div>
  );
};

export default PlantCard;