import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL + "/admin/plants";
const getToken = () => localStorage.getItem("token");

const emptyForm = {
  name: "",
  scientific: "",
  description: "",
  images: [],
  properties: [""],
  helps: [
    {
      problem: "",
      remedy: "",
      tips: [""],
    },
  ],
};

export default function Actions() {
  const navigate = useNavigate();
  const location = useLocation();

  const editingPlant = useMemo(() => location.state?.plant || null, [location.state]);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [plants, setPlants] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (editingPlant) {
      setEditId(editingPlant.id ?? null);
      setForm({
        name: editingPlant.name || "",
        scientific: editingPlant.scientific || "",
        description: editingPlant.description || "",
        images:
          Array.isArray(editingPlant.images) && editingPlant.images.length > 0
            ? [...editingPlant.images]
            : [],
        properties:
          Array.isArray(editingPlant.properties) && editingPlant.properties.length > 0
            ? [...editingPlant.properties]
            : [""],
        helps:
          Array.isArray(editingPlant.helps) && editingPlant.helps.length > 0
            ? editingPlant.helps.map((h) => ({
                problem: h?.problem || "",
                remedy: h?.remedy || "",
                tips: Array.isArray(h?.tips) && h.tips.length > 0 ? [...h.tips] : [""],
              }))
            : [
                {
                  problem: "",
                  remedy: "",
                  tips: [""],
                },
              ],
      });
    } else {
      resetFormOnly();
    }
  }, [editingPlant]);

  const fetchPlants = async () => {
    try {
      setLoadingPlants(true);

      const res = await fetch(API, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch plants");

      let data = await res.json();
      data = Array.isArray(data) ? [...data].reverse() : [];
      setPlants(data);
    } catch (err) {
      console.error("Fetch plants error:", err);
    } finally {
      setLoadingPlants(false);
    }
  };

  const recentPlants = useMemo(() => {
    return Array.isArray(plants) ? plants.slice(0, 5) : [];
  }, [plants]);

  const normalizePlantForEdit = (plant) => ({
    id: plant?.id ?? null,
    name: plant?.name || "",
    scientific: plant?.scientific || "",
    description: plant?.description || "",
    images:
      Array.isArray(plant?.images) && plant.images.length > 0 ? [...plant.images] : [],
    properties:
      Array.isArray(plant?.properties) && plant.properties.length > 0
        ? [...plant.properties]
        : [""],
    helps:
      Array.isArray(plant?.helps) && plant.helps.length > 0
        ? plant.helps.map((h) => ({
            problem: h?.problem || "",
            remedy: h?.remedy || "",
            tips: Array.isArray(h?.tips) && h.tips.length > 0 ? [...h.tips] : [""],
          }))
        : [{ problem: "", remedy: "", tips: [""] }],
  });

  const resetFormOnly = () => {
    setEditId(null);
    setForm({
      name: "",
      scientific: "",
      description: "",
      images: [],
      properties: [""],
      helps: [
        {
          problem: "",
          remedy: "",
          tips: [""],
        },
      ],
    });
  };

  const handleNewPlant = () => {
    resetFormOnly();
    navigate("/admin/actions", { replace: false, state: {} });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* IMAGE HANDLERS */
  const handleMultipleFiles = (files) => {
    Array.from(files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (index, value) => {
    setForm((prev) => {
      const updated = [...(prev.images || [])];
      updated[index] = value;
      return {
        ...prev,
        images: updated,
      };
    });
  };

  const addImageField = () => {
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), ""],
    }));
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const updated = (prev.images || []).filter((_, i) => i !== index);
      return {
        ...prev,
        images: updated,
      };
    });
  };

  /* PROPERTIES */
  const handlePropertyChange = (index, value) => {
    setForm((prev) => {
      const updated = [...(prev.properties || [])];
      updated[index] = value;
      return {
        ...prev,
        properties: updated,
      };
    });
  };

  const addProperty = () => {
    setForm((prev) => ({
      ...prev,
      properties: [...(prev.properties || []), ""],
    }));
  };

  const removeProperty = (index) => {
    setForm((prev) => {
      const updated = (prev.properties || []).filter((_, i) => i !== index);
      return {
        ...prev,
        properties: updated.length > 0 ? updated : [""],
      };
    });
  };

  /* HELPS */
  const addHelp = () => {
    setForm((prev) => ({
      ...prev,
      helps: [
        ...(prev.helps || []),
        { problem: "", remedy: "", tips: [""] },
      ],
    }));
  };

  const removeHelp = (helpIndex) => {
    setForm((prev) => {
      const updated = (prev.helps || []).filter((_, i) => i !== helpIndex);
      return {
        ...prev,
        helps: updated.length > 0 ? updated : [{ problem: "", remedy: "", tips: [""] }],
      };
    });
  };

  const handleHelpChange = (helpIndex, key, value) => {
    setForm((prev) => {
      const updatedHelps = [...(prev.helps || [])];
      if (updatedHelps[helpIndex]) {
        updatedHelps[helpIndex] = {
          ...updatedHelps[helpIndex],
          [key]: value,
        };
      }
      return {
        ...prev,
        helps: updatedHelps,
      };
    });
  };

  const addTip = (helpIndex) => {
    setForm((prev) => {
      const updatedHelps = [...(prev.helps || [])];
      if (updatedHelps[helpIndex]) {
        updatedHelps[helpIndex] = {
          ...updatedHelps[helpIndex],
          tips: [...(updatedHelps[helpIndex].tips || []), ""],
        };
      }
      return {
        ...prev,
        helps: updatedHelps,
      };
    });
  };

  const removeTip = (helpIndex, tipIndex) => {
    setForm((prev) => {
      const updatedHelps = [...(prev.helps || [])];
      if (updatedHelps[helpIndex]) {
        const filteredTips = (updatedHelps[helpIndex].tips || []).filter(
          (_, i) => i !== tipIndex
        );
        updatedHelps[helpIndex] = {
          ...updatedHelps[helpIndex],
          tips: filteredTips.length > 0 ? filteredTips : [""],
        };
      }
      return {
        ...prev,
        helps: updatedHelps,
      };
    });
  };

  const handleTipChange = (helpIndex, tipIndex, value) => {
    setForm((prev) => {
      const updatedHelps = [...(prev.helps || [])];
      if (updatedHelps[helpIndex] && Array.isArray(updatedHelps[helpIndex].tips)) {
        updatedHelps[helpIndex].tips[tipIndex] = value;
      }
      return {
        ...prev,
        helps: updatedHelps,
      };
    });
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    scientific: form.scientific.trim(),
    description: form.description.trim(),
    images: (form.images || []).filter((img) => String(img).trim() !== ""),
    properties: (form.properties || []).filter((p) => String(p).trim() !== ""),
    helps: (form.helps || []).map((h) => ({
      problem: h.problem?.trim() || "",
      remedy: h.remedy?.trim() || "",
      tips: (h.tips || []).filter((t) => String(t).trim() !== ""),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = buildPayload();

      if (!payload.name || !payload.scientific || !payload.description) {
        alert("Please fill name, scientific name and description.");
        return;
      }

      const url = editId ? `${API}/${editId}` : API;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save plant");

      alert(editId ? "Plant updated successfully" : "Plant created successfully");

      resetFormOnly();
      navigate("/admin/actions", { replace: true, state: {} });
      fetchPlants();
    } catch (err) {
      console.error("Save plant error:", err);
      alert("Failed to save plant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 text-white md:px-6"
      style={{
        backgroundImage:
          "linear-gradient(rgba(27,46,31,0.84), rgba(22,39,27,0.9)), url('https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-wide">
              {editId ? "Edit Plant" : "Add Plant"}
            </h1>
            <div className="mt-2 h-px w-full bg-white/20" />
            <p className="mt-2 text-sm text-white/75">
              {editId
                ? "Update the selected plant details below."
                : "Create a new herbal plant entry."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/actions/all")}
              className="rounded-xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              View All Plants
            </button>
            <button
              type="button"
              onClick={handleNewPlant}
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
            >
              New Plant
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md md:p-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Plant Name</label>
                <input
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="Enter plant name"
                  className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Scientific Name</label>
                <input
                  value={form.scientific}
                  onChange={(e) => handleFieldChange("scientific", e.target.value)}
                  placeholder="Enter scientific name"
                  className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-white/90">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Enter detailed plant description"
                rows={6}
                className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Images</h2>
                <button
                  type="button"
                  onClick={addImageField}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Add URL Field
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-4">
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Upload Image Files
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultipleFiles(e.target.files)}
                  className="w-full rounded-xl border border-white/10 bg-white/90 px-3 py-3 text-slate-800 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>

              {(form.images || []).length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(form.images || []).map((img, i) =>
                    img ? (
                      <img
                        key={i}
                        src={img}
                        alt={`plant-${i}`}
                        className="h-24 w-full rounded-xl object-cover"
                      />
                    ) : null
                  )}
                </div>
              )}

              <div className="space-y-3">
                {(form.images || []).map((img, index) => (
                  <div
                    key={`img-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:flex-row"
                  >
                    <input
                      value={img || ""}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="Enter image URL or keep uploaded image data"
                      className="flex-1 rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-lg bg-red-400/75 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Properties</h2>
                <button
                  type="button"
                  onClick={addProperty}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Add Property
                </button>
              </div>

              <div className="space-y-3">
                {(form.properties || []).map((prop, index) => (
                  <div
                    key={`prop-${index}`}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:flex-row"
                  >
                    <input
                      value={prop || ""}
                      onChange={(e) => handlePropertyChange(index, e.target.value)}
                      placeholder="Enter property"
                      className="flex-1 rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="rounded-lg bg-red-400/75 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Helps</h2>
                <button
                  type="button"
                  onClick={addHelp}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Add Help
                </button>
              </div>

              <div className="space-y-5">
                {(form.helps || []).map((help, helpIndex) => (
                  <div
                    key={`help-${helpIndex}`}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/90">Problem</label>
                        <input
                          value={help.problem || ""}
                          onChange={(e) =>
                            handleHelpChange(helpIndex, "problem", e.target.value)
                          }
                          placeholder="Enter disease/problem"
                          className="w-full rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeHelp(helpIndex)}
                          className="rounded-lg bg-red-400/75 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400"
                        >
                          Remove Help
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium text-white/90">Remedy</label>
                      <textarea
                        value={help.remedy || ""}
                        onChange={(e) =>
                          handleHelpChange(helpIndex, "remedy", e.target.value)
                        }
                        placeholder="Enter descriptive remedy"
                        rows={4}
                        className="w-full rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                      />
                    </div>

                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Tips</h3>
                        <button
                          type="button"
                          onClick={() => addTip(helpIndex)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                        >
                          Add Tip
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(help.tips || []).map((tip, tipIndex) => (
                          <div
                            key={`tip-${helpIndex}-${tipIndex}`}
                            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 md:flex-row"
                          >
                            <input
                              value={tip || ""}
                              onChange={(e) =>
                                handleTipChange(helpIndex, tipIndex, e.target.value)
                              }
                              placeholder="Enter tip"
                              className="flex-1 rounded-xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeTip(helpIndex, tipIndex)}
                              className="rounded-lg bg-red-400/75 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-green-700 px-6 py-4 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? editId
                    ? "Saving Changes..."
                    : "Creating Plant..."
                  : editId
                  ? "Save Changes"
                  : "Create Plant"}
              </button>

              <button
                type="button"
                onClick={handleNewPlant}
                className="rounded-2xl bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/20"
              >
                Reset to Add Plant
              </button>
            </div>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Recently Added Plants</h2>
                <p className="mt-1 text-sm text-white/75">
                  Latest 4 to 5 plants added to your collection
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/actions/all")}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                View All
              </button>
            </div>

            {loadingPlants ? (
              <p className="text-white/75">Loading recent plants...</p>
            ) : recentPlants.length === 0 ? (
              <p className="text-white/75">No plants found.</p>
            ) : (
              <div className="space-y-4">
                {recentPlants.map((plant, index) => (
                  <div
                    key={plant.id || index}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    <div className="h-36 w-full">
                      <img
                        src={
                          plant.images?.[0] ||
                          "https://via.placeholder.com/400x250?text=No+Image"
                        }
                        alt={plant.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-2 p-4">
                      <div>
                        <h3 className="text-lg font-semibold">{plant.name}</h3>
                        <p className="text-sm text-white/80">{plant.scientific}</p>
                      </div>

                      <p className="line-clamp-2 text-sm text-white/70">
                        {plant.description}
                      </p>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/admin/actions", {
                              state: { plant: normalizePlantForEdit(plant) },
                            })
                          }
                          className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/admin/actions/all")
                          }
                          className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}