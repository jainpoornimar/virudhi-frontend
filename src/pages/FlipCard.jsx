import { useState, useEffect } from "react";
import { FiHeart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { fetchFavorites, toggleFavorite } from "../utils/favoritesApi";
import cardBg from "../assets/cardbg.png";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6";

const FlipCard = ({ data }) => {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const getItemType = (item) => {
    if (item.itemType) return item.itemType.toLowerCase();
    if (item.type) return item.type.toLowerCase();
    if (item.remedyType) return "disease";
    if (item.scientific || item.properties || item.helps) return "plant";
    if (item.cardImageUrl) return "disease";
    return "plant";
  };

  const getImage = (item) => {
    return item.imageUrl || item.images?.[0] || item.cardImageUrl || DEFAULT_IMG;
  };

  const getSafeImage = (item) => {
    const img = getImage(item);

    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:image/")) return img;

    return "";
  };

  const getDetailsRoute = (item) => {
    const itemType = getItemType(item);
    return itemType === "disease"
      ? `/app/remedy/${item.itemId || item.id}`
      : `/app/plant/${item.itemId || item.id}`;
  };

  const getPreviewRemedies = (item) => {
    if (Array.isArray(item.remedies) && item.remedies.length > 0) {
      return item.remedies.slice(0, 3).map((r) =>
        typeof r === "string"
          ? r
          : r?.title || r?.name || r?.remedy || r?.description || "Remedy"
      );
    }

    if (Array.isArray(item.helps) && item.helps.length > 0) {
      return item.helps.slice(0, 3).map((h) =>
        h?.remedy || h?.problem || h?.title || "Remedy"
      );
    }

    return [];
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favorites = await fetchFavorites();
        const itemId = data.itemId || data.id;
        const itemType = getItemType(data);

        const exists = favorites.some(
          (fav) =>
            String(fav.itemType).toLowerCase() === String(itemType).toLowerCase() &&
            String(fav.itemId) === String(itemId)
        );

        setLiked(exists);
      } catch (error) {
        console.error("Error checking favorite status:", error);
        setLiked(false);
      }
    };

    if (data?.id || data?.itemId) {
      checkFavoriteStatus();
    }
  }, [data]);

  const handleLike = async (e) => {
    e.stopPropagation();

    if (loadingFav) return;

    try {
      setLoadingFav(true);

      const result = await toggleFavorite({
        itemType: getItemType(data),
        itemId: data.itemId || data.id,
        name: data.name || "Unnamed Item",
        description: data.description || "",
        imageUrl: getSafeImage(data),
      });

      setLiked(result.action === "added");
    } catch (error) {
      console.error("Favorite error:", error);
      alert(error.message || "Failed to update favorite");
    } finally {
      setLoadingFav(false);
    }
  };

  const remedies = getPreviewRemedies(data);

  return (
    <div
      className="w-full h-[220px] perspective cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* FRONT */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-md">
          <div
            className="relative w-full h-full bg-cover bg-center p-3 flex flex-col"
            style={{ backgroundImage: `url(${cardBg})` }}
          >
            <button
              onClick={handleLike}
              disabled={loadingFav}
              className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 p-2 rounded-full transition z-10"
            >
              <FiHeart
                className={`text-md ${
                  liked ? "text-red-500 fill-red-500" : "text-white"
                } ${loadingFav ? "opacity-70" : ""}`}
              />
            </button>

            <div className="w-full flex justify-center mt-2">
              <img
                src={getImage(data)}
                alt={data.name}
                className="w-[78%] h-[78px] object-cover rounded-md border border-white/20 shadow-md"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_IMG;
                }}
              />
            </div>

            <div className="mt-3 text-white px-1">
              <h3 className="font-bold text-base line-clamp-1 text-center">
                {data.name}
              </h3>
              <p className="text-md opacity-90 line-clamp-4 mt-1">
                {data.description || "No description available"}
              </p>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 rounded-2xl overflow-hidden shadow-md">
          <div
            className="w-full h-full bg-cover bg-center text-white p-4 flex flex-col justify-between"
            style={{ backgroundImage: `url(${cardBg})` }}
          >
            <div>
              <h3 className="font-bold text-base mb-2 line-clamp-1">{data.name}</h3>

              {remedies.length > 0 ? (
                <div>
                  <p className="text-md font-semibold mb-2">Few Remedies</p>
                  <div className="space-y-1">
                    {remedies.map((remedy, index) => (
                      <p key={index} className="text-md opacity-95 line-clamp-1">
                        • {remedy}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-md opacity-90 line-clamp-5">
                  {data.description || "No remedies available"}
                </p>
              )}
            </div>

            <p
              onClick={(e) => {
                e.stopPropagation();
                navigate(getDetailsRoute(data));
              }}
              className="mt-4 text-md font-semibold underline underline-offset-2 cursor-pointer hover:text-green-100"
            >
              View more details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;