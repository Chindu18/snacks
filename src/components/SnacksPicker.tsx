import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

interface Snack {
  _id?: string;
  id?: number;
  name: string;
  price: number;
  category: string;
  img: string;
}

export default function SnacksPicker() {
  const primary = "#E54343";
  const ink = "#060606";

  const [data, setData] = useState<Record<string, Snack[]>>({
    Vegetarian: [],
    "Non Vegetarian": [],
    Juice: [],
  });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ [id: string]: number }>({});
  const [editing, setEditing] = useState<{ cat: string; id: string } | null>(null);
  const [draftPrice, setDraftPrice] = useState("");

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCat, setUploadCat] = useState("Vegetarian");
  const [uploadName, setUploadName] = useState("");
  const [uploadPrice, setUploadPrice] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const API = "https://snacks-backend-dm28.onrender.com/api/snacks"; // ⚠️ Change if hosted

  // 🟢 Fetch from backend
  useEffect(() => {
    axios
      .get(API)
      .then((res) => {
        const grouped: Record<string, Snack[]> = {
          Vegetarian: [],
          "Non Vegetarian": [],
          Juice: [],
        };
        res.data.forEach((snack: Snack) => {
          if (grouped[snack.category]) grouped[snack.category].push(snack);
        });
        setData(grouped);
      })
      .catch((err) => console.error("Error fetching snacks:", err));
  }, []);

  // 🔎 Filtered view
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    const next: Record<string, Snack[]> = {};
    for (const [cat, items] of Object.entries(data)) {
      next[cat] = items.filter((s) => s.name.toLowerCase().includes(q));
    }
    return next;
  }, [data, query]);

  function toggleSnack(cat: string, snack: Snack) {
    setSelected((p) => ({ ...p, [snack._id || snack.id!]: p[snack._id || snack.id!] ? 0 : 1 }));
  }

  // ✏️ Edit price
  function startEdit(cat: string, item: Snack) {
    setEditing({ cat, id: item._id! });
    setDraftPrice(String(item.price));
  }

  function cancelEdit() {
    setEditing(null);
    setDraftPrice("");
  }

  async function commitEdit() {
    if (!editing) return;
    const value = Number(draftPrice);
    if (Number.isNaN(value) || value < 0) return alert("Enter a valid price.");

    const { cat, id } = editing;

    try {
      await axios.put(`${API}/${id}`, { price: value });
      setData((prev) => {
        const updated = { ...prev };
        updated[cat] = prev[cat].map((it) =>
          it._id === id ? { ...it, price: value } : it
        );
        return updated;
      });
    } catch (err) {
      console.error("Error updating price:", err);
    }

    setEditing(null);
    setDraftPrice("");
  }

  // 🟠 Save All (just show payload)
  function saveAll() {
    alert("Data:\n" + JSON.stringify(data, null, 2));
  }

  // 🟣 File upload preview
  function onChooseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function resetUpload() {
    setUploadCat("Vegetarian");
    setUploadName("");
    setUploadPrice("");
    setPreviewUrl("");
    setFile(null);
  }

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadName || !uploadPrice || !file)
      return alert("Please fill all fields & select a photo.");

    try {
      const formData = new FormData();
      formData.append("name", uploadName);
      formData.append("price", uploadPrice);
      formData.append("category", uploadCat);
      formData.append("img", file);

      const res = await axios.post(API, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setData((prev) => ({
        ...prev,
        [uploadCat]: [res.data, ...prev[uploadCat]],
      }));

      setShowUpload(false);
      resetUpload();
    } catch (error) {
      console.error("Error uploading snack:", error);
    }
  }

  async function deleteSnack(cat: string, id: string) {
    if (!window.confirm("Delete this snack?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setData((prev) => ({
        ...prev,
        [cat]: prev[cat].filter((s) => s._id !== id),
      }));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: ink }}>
      {/* ===== Navbar ===== */}
      <header
        className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b shadow-sm sm:hidden"
        style={{ borderColor: primary }}
      >
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              🎬
            </span>
            <span className="text-sm font-semibold">Theatre Admin</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-wide text-center">
            Snacks <span style={{ color: primary }}>Cart</span>
          </h1>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search snacks..."
              className="flex-1 rounded-full px-4 py-2 text-sm border-2"
              style={{ borderColor: primary }}
            />
            <button
              onClick={saveAll}
              className="px-3 py-2 text-sm rounded-full text-white"
              style={{ backgroundColor: primary }}
            >
              Save
            </button>
          </div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <main className="px-4 sm:px-6 lg:px-12 py-8 space-y-12">
        {Object.entries(filtered).map(([category, snacks]) => (
          <section key={category}>
            <h2
              className="text-2xl font-bold mb-6 text-center underline underline-offset-8"
              style={{ textDecorationColor: primary }}
            >
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {snacks.map((snack) => {
                const isSelected = !!selected[snack._id || snack.id!];
                const isEditing =
                  editing &&
                  editing.cat === category &&
                  editing.id === (snack._id || "");

                return (
                  <div
                    key={snack._id || snack.id}
                    className="relative rounded-xl border-2 overflow-hidden cursor-pointer hover:scale-105 transition"
                    style={{
                      borderColor: isSelected ? primary : "#e5e5e5",
                    }}
                    onClick={() => toggleSnack(category, snack)}
                  >
                    <img
  src={snack.img.startsWith("http") ? snack.img : `http://localhost:5000${snack.img}`}
  alt={snack.name}
  className="h-40 w-full object-cover"
/>


                    <div className="p-4 text-center bg-[#fff6f6]">
                      <p className="font-semibold">{snack.name}</p>

                      {!isEditing ? (
                        <div className="mt-2 flex justify-center gap-2">
                          <span>₹{snack.price}</span>
                          <button
                            className="text-sm border rounded px-2"
                            style={{ color: primary }}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(category, snack);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="text-sm border rounded px-2"
                            style={{ color: "#555" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSnack(category, snack._id!);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3 flex justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={draftPrice}
                            onChange={(e) => setDraftPrice(e.target.value)}
                            className="w-20 border rounded px-2 text-sm"
                            style={{ borderColor: primary }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            className="px-2 bg-red-500 text-white rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              commitEdit();
                            }}
                          >
                            ✓
                          </button>
                          <button
                            className="px-2 border rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEdit();
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex justify-center">
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 rounded-full font-semibold shadow text-white"
            style={{ backgroundColor: primary }}
          >
            Upload photo & price
          </button>
        </div>
      </main>

      {/* ===== Upload Modal ===== */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[90%] sm:w-[400px] p-5 shadow-xl">
            <h3 className="text-xl font-bold mb-4" style={{ color: primary }}>
              Add New Snack
            </h3>

            <form onSubmit={submitUpload} className="space-y-3">
              <select
                value={uploadCat}
                onChange={(e) => setUploadCat(e.target.value)}
                className="w-full border rounded px-3 py-2"
                style={{ borderColor: primary }}
              >
                {Object.keys(data).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Snack Name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                style={{ borderColor: primary }}
              />

              <input
                type="number"
                placeholder="Price"
                value={uploadPrice}
                onChange={(e) => setUploadPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                style={{ borderColor: primary }}
              />

              <input
                type="file"
                accept="image/*"
                onChange={onChooseFile}
                className="w-full"
              />

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-40 object-cover rounded mt-2"
                />
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpload(false);
                    resetUpload();
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded"
                  style={{ backgroundColor: primary }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer
        className="text-center text-sm mt-12 border-t-2 pt-4"
        style={{ borderColor: primary }}
      >
        © {new Date().getFullYear()} Theatre Admin • Red & Black Theme
      </footer>
    </div>
  );
}
