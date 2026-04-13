import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const NOTES_API = `${API_BASE_URL}/notes`;

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General");
  const [plant, setPlant] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const fetchNotes = async () => {
    try {
      setLoading(true);

      const res = await fetch(NOTES_API, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading notes:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async () => {
    if (!text.trim()) return;

    try {
      setSaving(true);

      const payload = {
        text: text.trim(),
        category,
        plant,
        pinned: false,
      };

      const res = await fetch(NOTES_API, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create note");
      }

      const createdNote = await res.json();
      setNotes((prev) => [createdNote, ...prev]);
      setText("");
      setPlant("");
      setCategory("General");
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${NOTES_API}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const togglePin = async (id) => {
    try {
      const res = await fetch(`${NOTES_API}/${id}/pin`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to update pin");
      }

      const data = await res.json();

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, pinned: data.pinned } : n
        )
      );
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) =>
      n.text?.toLowerCase().includes(search.toLowerCase())
    );
  }, [notes, search]);

  const pinned = filteredNotes.filter((n) => n.pinned);
  const others = filteredNotes.filter((n) => !n.pinned);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-rgba(0, 20, 10, 0.45)">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-white">
          My Herbal Notes 🌿
        </h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="px-4 py-2 rounded-full bg-white shadow-sm outline-none w-[250px]"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow flex gap-3 items-center flex-wrap">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something useful 🌿..."
          className="flex-1 min-w-[220px] px-3 py-2 outline-none"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#eef5f1] px-3 py-2 rounded-lg text-sm"
        >
          <option>General</option>
          <option>Skin</option>
          <option>Immunity</option>
        </select>

        <select
          value={plant}
          onChange={(e) => setPlant(e.target.value)}
          className="bg-[#eef5f1] px-3 py-2 rounded-lg text-sm"
        >
          <option value="">Link Plant</option>
          <option>Tulsi</option>
          <option>Neem</option>
          <option>Aloe Vera</option>
        </select>

        <button
          onClick={addNote}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "+"}
        </button>
      </div>

      {loading ? (
        <p className="text-white/80">Loading notes...</p>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-300 mb-2">📌 Pinned</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinned.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    deleteNote={deleteNote}
                    togglePin={togglePin}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                deleteNote={deleteNote}
                togglePin={togglePin}
              />
            ))}
          </div>

          {filteredNotes.length === 0 && (
            <p className="text-white/70 text-center">No notes found.</p>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ note, deleteNote, togglePin }) {
  const getColor = () => {
    switch (note.category) {
      case "Skin":
        return "bg-yellow-100 border-yellow-300";
      case "Immunity":
        return "bg-green-100 border-green-300";
      default:
        return "bg-blue-100 border-blue-300";
    }
  };

  return (
    <div
      className={`${getColor()} border rounded-2xl p-4 shadow-sm hover:shadow-md transition h-[140px] flex flex-col justify-between`}
    >
      <p className="font-medium line-clamp-2 text-[#0f3d2e]">
        {note.text}
      </p>

      <div className="flex gap-2 flex-wrap mt-2">
        {note.plant && (
          <span className="bg-white/70 px-2 py-1 text-xs rounded-full">
            🌿 {note.plant}
          </span>
        )}

        <span className="bg-white/70 px-2 py-1 text-xs rounded-full">
          {note.category}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <button
          onClick={() => togglePin(note.id)}
          className="hover:scale-110 transition"
        >
          {note.pinned ? "📌" : "📍"}
        </button>

        <button
          onClick={() => deleteNote(note.id)}
          className="text-red-500 hover:scale-110 transition"
        >
          🗑
        </button>
      </div>
    </div>
  );
}