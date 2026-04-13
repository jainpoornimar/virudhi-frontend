const API_BASE_URL = import.meta.env.VITE_API_URL;
const FAVORITES_API = `${API_BASE_URL}/favorites`;

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

export const fetchFavorites = async () => {
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
      data?.message ||
        data?.title ||
        `Failed to fetch favorites (${res.status})`
    );
  }

  return Array.isArray(data) ? data : [];
};

export const addFavorite = async ({
  itemType,
  itemId,
  name,
  description = "",
  imageUrl = "",
}) => {
  const payload = {
    ItemType: itemType,
    ItemId: itemId,
    Name: String(name || "").trim().slice(0, 100),
    Description: String(description || "").trim().slice(0, 500),
    ImageUrl: String(imageUrl || "").trim(),
  };

  const res = await fetch(FAVORITES_API, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const raw = await res.text();

  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message ||
            data?.title ||
            `Failed to add favorite (${res.status})`
    );
  }

  return data;
};

export const removeFavorite = async (favoriteId) => {
  const res = await fetch(`${FAVORITES_API}/${favoriteId}`, {
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
        `Failed to remove favorite (${res.status})`
    );
  }

  return data;
};

export const toggleFavorite = async ({
  itemType,
  itemId,
  name,
  description = "",
  imageUrl = "",
}) => {
  const favorites = await fetchFavorites();

  const existingFavorite = favorites.find(
    (fav) =>
      String(fav.itemType).toLowerCase() === String(itemType).toLowerCase() &&
      String(fav.itemId) === String(itemId)
  );

  if (existingFavorite) {
    await removeFavorite(existingFavorite.id);
    return {
      action: "removed",
      favorite: existingFavorite,
    };
  }

  const addedFavorite = await addFavorite({
    itemType,
    itemId,
    name,
    description,
    imageUrl,
  });

  return {
    action: "added",
    favorite: addedFavorite,
  };
};