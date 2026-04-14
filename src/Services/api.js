const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchDiseases = async () => {
  const response = await fetch(`${API_BASE}/api/user/diseases`);
  if (!response.ok) {
    throw new Error("Failed to fetch diseases");
  }
  return response.json();
};

export const fetchDiseaseById = async (id) => {
  const response = await fetch(`${API_BASE}/api/user/diseases/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch disease details");
  }
  return response.json();
};