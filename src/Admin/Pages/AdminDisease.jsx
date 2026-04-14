import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const API = `${API_URL}/admin/diseases`;
const getToken = () => localStorage.getItem("token");

const emptyForm = {
  name: "",
  description: "",
  cardImageUrl: "",
  bannerImageUrl: "",
  remedies: [{ title: "", description: "" }],
  variants: [
    { severity: "Mild", recovery: "", bestRemedyTitle: "", bestRemedyDesc: "" },
  ],
  precautions: [""],
  whyItWorks: [""],
  related: [{ name: "", relatedDiseaseId: "" }],
};

const severityOptions = ["Mild", "Moderate", "Chronic"];

export default function AdminDisease() {
  const navigate = useNavigate();
  const location = useLocation();

  const [diseases, setDiseases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState({
    type: "info",
    text: "Please fill out all fields to add or update a disease remedy.",
  });

  useEffect(() => {
    fetchDiseases();
  }, []);

  useEffect(() => {
    if (!pageLoading && location.state?.disease) {
      handleEdit(location.state.disease);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [pageLoading, location.state, navigate, location.pathname]);

  const fetchDiseases = async () => {
    try {
      setPageLoading(true);
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch diseases");
      const data = await res.json();
      setDiseases(Array.isArray(data) ? [...data].reverse() : []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load diseases." });
    } finally {
      setPageLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setMessage({
      type: "info",
      text: "Please fill out all fields to add or update a disease remedy.",
    });
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileUpload = (key, files) => {
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, [key]: reader.result }));
    reader.readAsDataURL(files[0]);
  };

  const handleImageChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addRemedy = () => {
    setForm((prev) => ({
      ...prev,
      remedies: [{ title: "", description: "" }, ...prev.remedies],
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        { severity: "Mild", recovery: "", bestRemedyTitle: "", bestRemedyDesc: "" },
        ...prev.variants,
      ],
    }));
  };

  const addStringListItem = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: ["", ...prev[key]],
    }));
  };

  const addRelated = () => {
    setForm((prev) => ({
      ...prev,
      related: [{ name: "", relatedDiseaseId: "" }, ...prev.related],
    }));
  };

  const updateRemedy = (index, key, value) => {
    setForm((prev) => {
      const remedies = [...prev.remedies];
      remedies[index] = { ...remedies[index], [key]: value };
      return { ...prev, remedies };
    });
  };

  const removeRemedy = (index) => {
    setForm((prev) => ({
      ...prev,
      remedies:
        prev.remedies.length > 1
          ? prev.remedies.filter((_, i) => i !== index)
          : [{ title: "", description: "" }],
    }));
  };

  const updateVariant = (index, key, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [key]: value };
      return { ...prev, variants };
    });
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants:
        prev.variants.length > 1
          ? prev.variants.filter((_, i) => i !== index)
          : [{ severity: "Mild", recovery: "", bestRemedyTitle: "", bestRemedyDesc: "" }],
    }));
  };

  const updateStringList = (key, index, value) => {
    setForm((prev) => {
      const updated = [...prev[key]];
      updated[index] = value;
      return { ...prev, [key]: updated };
    });
  };

  const removeStringListItem = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].length > 1 ? prev[key].filter((_, i) => i !== index) : [""],
    }));
  };

  const updateRelated = (index, key, value) => {
    setForm((prev) => {
      const related = [...prev.related];
      related[index] = { ...related[index], [key]: value };
      return { ...prev, related };
    });
  };

  const removeRelated = (index) => {
    setForm((prev) => ({
      ...prev,
      related:
        prev.related.length > 1
          ? prev.related.filter((_, i) => i !== index)
          : [{ name: "", relatedDiseaseId: "" }],
    }));
  };

  const handleEdit = (disease) => {
    if (!disease) return;

    setEditId(disease.id);

    setForm({
      name: disease.name || "",
      description: disease.description || "",
      cardImageUrl: disease.cardImageUrl || "",
      bannerImageUrl: disease.bannerImageUrl || "",

      remedies:
        Array.isArray(disease.remedies) && disease.remedies.length > 0
          ? disease.remedies.map((r) => ({
              title: r.title || "",
              description: r.description || "",
            }))
          : [{ title: "", description: "" }],

      variants:
        Array.isArray(disease.variants) && disease.variants.length > 0
          ? disease.variants.map((v) => ({
              severity:
                v.severity === 0 || v.severity === "0"
                  ? "Mild"
                  : v.severity === 1 || v.severity === "1"
                  ? "Moderate"
                  : v.severity === 2 || v.severity === "2"
                  ? "Chronic"
                  : v.severity || "Mild",
              recovery: v.recovery || "",
              bestRemedyTitle: v.bestRemedyTitle || "",
              bestRemedyDesc: v.bestRemedyDesc || "",
            }))
          : [
              {
                severity: "Mild",
                recovery: "",
                bestRemedyTitle: "",
                bestRemedyDesc: "",
              },
            ],

      precautions:
        Array.isArray(disease.precautions) && disease.precautions.length > 0
          ? disease.precautions.map((p) => String(p || ""))
          : [""],

      whyItWorks:
        Array.isArray(disease.whyItWorks) && disease.whyItWorks.length > 0
          ? disease.whyItWorks.map((w) => String(w || ""))
          : [""],

      related:
        Array.isArray(disease.related) && disease.related.length > 0
          ? disease.related.map((r) => ({
              name: r.name || "",
              relatedDiseaseId: r.relatedDiseaseId?.toString() || "",
            }))
          : [{ name: "", relatedDiseaseId: "" }],
    });

    setMessage({
      type: "success",
      text: `Editing "${disease.name}".`,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm("Delete this disease?")) return;
    try {
      await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchDiseases();
      setMessage({ type: "success", text: "Disease deleted successfully." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to delete." });
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Disease name is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!form.cardImageUrl.trim()) return "Card image is required.";
    if (!form.bannerImageUrl.trim()) return "Banner image is required.";
    for (const r of form.remedies) {
      if (!r.title.trim() || !r.description.trim()) {
        return "Each remedy must have title and description.";
      }
    }
    for (const v of form.variants) {
      if (
        !v.severity ||
        !v.recovery.trim() ||
        !v.bestRemedyTitle.trim() ||
        !v.bestRemedyDesc.trim()
      ) {
        return "Each variant must have all fields filled.";
      }
    }
    if (form.precautions.some((p) => !p.trim())) return "Precautions cannot be empty.";
    if (form.whyItWorks.some((w) => !w.trim())) return "Why It Works cannot be empty.";
    for (const r of form.related) {
      if (!r.name.trim() || !String(r.relatedDiseaseId).trim()) {
        return "Please fill all related diseases.";
      }
    }
    return null;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    description: form.description.trim(),
    cardImageUrl: form.cardImageUrl.trim(),
    bannerImageUrl: form.bannerImageUrl.trim(),
    remedies: form.remedies.map((r) => ({
      title: r.title.trim(),
      description: r.description.trim(),
    })),
    variants: form.variants.map((v) => ({
      severity: v.severity,
      recovery: v.recovery.trim(),
      bestRemedyTitle: v.bestRemedyTitle.trim(),
      bestRemedyDesc: v.bestRemedyDesc.trim(),
    })),
    precautions: form.precautions.map((p) => p.trim()),
    whyItWorks: form.whyItWorks.map((w) => w.trim()),
    related: form.related.map((r) => ({
      name: r.name.trim(),
      relatedDiseaseId: Number(r.relatedDiseaseId),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const payload = buildPayload();

    try {
      setLoading(true);
      const isEditing = !!editId;
      const url = isEditing ? `${API}/${editId}` : API;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      await fetchDiseases();
      resetForm();

      setMessage({
        type: "success",
        text: isEditing ? "Disease updated successfully." : "Disease created successfully.",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: editId ? "Failed to update." : "Failed to create.",
      });
    } finally {
      setLoading(false);
    }
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
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-wide">Admin Dashboard</h1>
            <div className="mt-2 h-px w-full bg-white/20" />
            <h2 className="mt-5 text-3xl font-medium">Create/Edit Disease Remedy</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/diseases/all")}
              className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-medium transition hover:bg-white/20"
            >
              View All
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-green-700/90 px-6 py-3 text-base font-medium shadow-lg transition hover:bg-green-600 disabled:opacity-60"
            >
              {loading ? "Saving..." : editId ? "Save Changes" : "Create Disease"}
            </button>
          </div>
        </div>

        <div
          className={`mb-5 rounded-2xl border px-5 py-4 backdrop-blur-md ${
            message.type === "error"
              ? "border-red-300/30 bg-red-100/80 text-red-900"
              : message.type === "success"
              ? "border-green-300/30 bg-green-100/85 text-green-900"
              : "border-white/15 bg-white/75 text-slate-800"
          }`}
        >
          <p className="text-base font-medium">{message.text}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="hide-scrollbar lg:col-span-2 max-h-[88vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md"
          >
            <Section title="Disease Info">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Disease Name *"
                  placeholder="Enter disease name..."
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                <TextArea
                  label="Description"
                  placeholder="Enter disease description..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                />

                <div>
                  <span className="mb-2 block text-lg font-medium text-white/95">Card Image *</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("cardImageUrl", e.target.files)}
                    className="mb-3 block w-full rounded-2xl bg-white/10 p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Or paste Card Image URL..."
                    value={form.cardImageUrl}
                    onChange={(e) => handleImageChange("cardImageUrl", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-lg font-medium text-white/95">Banner Image *</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("bannerImageUrl", e.target.files)}
                    className="mb-3 block w-full rounded-2xl bg-white/10 p-3 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Or paste Banner Image URL..."
                    value={form.bannerImageUrl}
                    onChange={(e) => handleImageChange("bannerImageUrl", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none"
                  />
                </div>

                {(form.cardImageUrl || form.bannerImageUrl) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ImagePreview title="Card Image Preview" src={form.cardImageUrl} />
                    <ImagePreview title="Banner Image Preview" src={form.bannerImageUrl} />
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="Remedies"
              action={
                <SmallButton type="button" onClick={addRemedy}>
                  + Add Remedy
                </SmallButton>
              }
            >
              <div className="space-y-4">
                {form.remedies.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-lg font-medium">Remedy {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeRemedy(i)}
                        className="rounded-lg px-3 py-1 text-sm text-red-200 transition hover:bg-red-500/20"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        label="Title"
                        placeholder="Honey + Ginger"
                        value={item.title}
                        onChange={(e) => updateRemedy(i, "title", e.target.value)}
                      />
                      <TextArea
                        label="Description"
                        placeholder="Enter remedy description..."
                        value={item.description}
                        onChange={(e) => updateRemedy(i, "description", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Severity Variants"
              action={
                <SmallButton type="button" onClick={addVariant}>
                  + Add Variant
                </SmallButton>
              }
            >
              <div className="space-y-4">
                {form.variants.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-lg font-medium">Variant {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="rounded-lg px-3 py-1 text-sm text-red-200 transition hover:bg-red-500/20"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Select
                        label="Severity"
                        value={item.severity}
                        onChange={(e) => updateVariant(i, "severity", e.target.value)}
                        options={severityOptions}
                      />
                      <Input
                        label="Recovery"
                        placeholder="2-5 days"
                        value={item.recovery}
                        onChange={(e) => updateVariant(i, "recovery", e.target.value)}
                      />
                      <Input
                        label="Best Remedy Title"
                        placeholder="Honey + Ginger"
                        value={item.bestRemedyTitle}
                        onChange={(e) => updateVariant(i, "bestRemedyTitle", e.target.value)}
                      />
                      <Input
                        label="Best Remedy Description"
                        placeholder="Soothes throat"
                        value={item.bestRemedyDesc}
                        onChange={(e) => updateVariant(i, "bestRemedyDesc", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Precautions"
              action={
                <SmallButton type="button" onClick={() => addStringListItem("precautions")}>
                  + Add Precaution
                </SmallButton>
              }
            >
              <div className="space-y-3">
                {form.precautions.map((item, i) => (
                  <InlineField
                    key={i}
                    value={item}
                    placeholder="Avoid cold beverages"
                    onChange={(e) => updateStringList("precautions", i, e.target.value)}
                    onRemove={() => removeStringListItem("precautions", i)}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Why It Works"
              action={
                <SmallButton type="button" onClick={() => addStringListItem("whyItWorks")}>
                  + Add Reason
                </SmallButton>
              }
            >
              <div className="space-y-3">
                {form.whyItWorks.map((item, i) => (
                  <InlineField
                    key={i}
                    value={item}
                    placeholder="Ginger reduces inflammation"
                    onChange={(e) => updateStringList("whyItWorks", i, e.target.value)}
                    onRemove={() => removeStringListItem("whyItWorks", i)}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Related Diseases"
              action={
                <SmallButton type="button" onClick={addRelated}>
                  + Add Related Disease
                </SmallButton>
              }
            >
              <div className="space-y-4">
                {form.related.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-lg font-medium">Related {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeRelated(i)}
                        className="rounded-lg px-3 py-1 text-sm text-red-200 transition hover:bg-red-500/20"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-lg font-medium text-white/95">
                        Select Related Disease
                      </span>
                      <select
                        value={item.relatedDiseaseId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedDisease = diseases.find(
                            (d) => String(d.id) === String(selectedId)
                          );
                          updateRelated(i, "relatedDiseaseId", selectedId);
                          updateRelated(i, "name", selectedDisease?.name || "");
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none"
                      >
                        <option value="">Select disease</option>
                        {diseases
                          .filter((d) => d.id !== editId)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                ))}
              </div>
            </Section>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-medium transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-green-700 px-6 py-3 text-base font-semibold shadow-lg transition hover:bg-green-600 disabled:opacity-60"
              >
                {loading ? "Saving..." : editId ? "Save Changes" : "Create Disease"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <h3 className="mb-4 text-2xl font-semibold">Diseases ({diseases.length})</h3>
            {pageLoading ? (
              <p className="text-white/80">Loading diseases...</p>
            ) : diseases.length === 0 ? (
              <p className="text-white/80">No diseases found.</p>
            ) : (
              <div className="hide-scrollbar max-h-[75vh] space-y-4 overflow-y-auto pr-2">
                {diseases.map((d) => (
                  <div key={d.id} className="space-y-3 rounded-xl bg-green-900/40 p-4">
                    <img
                      src={d.cardImageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                      alt={d.name}
                      className="h-28 w-full rounded object-cover"
                    />
                    <div>
                      <h3 className="font-bold">{d.name}</h3>
                      <p className="line-clamp-3 text-sm opacity-70">{d.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="flex-1 rounded bg-yellow-400 py-2 font-semibold text-black hover:bg-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="flex-1 rounded bg-red-500 py-2 font-semibold hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/admin/diseases/all")}
                  className="w-full rounded-2xl bg-green-700 px-4 py-3 font-semibold transition hover:bg-green-600"
                >
                  View All Diseases
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h3 className="text-2xl font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-medium text-white/95">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
      />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-medium text-white/95">{label}</span>
      <textarea
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
      />
    </label>
  );
}

function Select({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-lg font-medium text-white/95">{label}</span>
      <select
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function SmallButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="rounded-xl bg-green-700/80 px-4 py-2 text-sm font-medium transition hover:bg-green-600"
    >
      {children}
    </button>
  );
}

function InlineField({ value, onChange, onRemove, placeholder }) {
  return (
    <div className="flex items-center gap-3">
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-slate-800 outline-none placeholder:text-slate-500"
      />
      <button
        type="button"
        onClick={onRemove}
        className="rounded-xl bg-white/10 px-4 py-3 text-red-200 transition hover:bg-red-500/20"
      >
        ✕
      </button>
    </div>
  );
}

function ImagePreview({ title, src }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white/80">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
        {src ? (
          <img src={src} alt={title} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 items-center justify-center text-white/50">No image</div>
        )}
      </div>
    </div>
  );
}