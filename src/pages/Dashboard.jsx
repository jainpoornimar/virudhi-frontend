import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaEye, FaLeaf, FaStickyNote } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DASHBOARD_API = `${API_BASE_URL}/dashboard`;

const DEFAULT_IMG =
  "https://via.placeholder.com/300x200?text=No+Image";

const Dashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = ["#2E7D32", "#66BB6A", "#78d67b", "#e7b771", "#B39DDB"];

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

  const getSafeImage = (item) => {
    const img =
      item?.imageUrl ||
      item?.images?.[0] ||
      item?.cardImageUrl ||
      item?.img ||
      "";

    if (!img) return DEFAULT_IMG;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:image/")) return img;

    return DEFAULT_IMG;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Recently";

    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  };

  const loadRecentlyViewed = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      setRecentlyViewed(Array.isArray(stored) ? stored : []);
    } catch (error) {
      console.error("Failed to load recently viewed:", error);
      setRecentlyViewed([]);
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch(DASHBOARD_API, {
        method: "GET",
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
          data?.message || data?.title || "Failed to fetch dashboard"
        );
      }

      setDashboard(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setDashboard(null);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchDashboard();
      loadRecentlyViewed();
      setLoading(false);
    };

    loadAll();
  }, []);

  const recentlyViewedThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    return recentlyViewed.filter((item) => {
      const viewedAt = item.viewedAt || item.createdAt || item.date;
      if (!viewedAt) return false;
      return new Date(viewedAt) >= weekAgo;
    }).length;
  }, [recentlyViewed]);

  const recentPreview = useMemo(() => recentlyViewed.slice(0, 4), [recentlyViewed]);

  const dynamicBarData = useMemo(() => {
    const apiBar = dashboard?.charts?.barData || [];
    const localRecentMap = {};

    recentlyViewed.forEach((item) => {
      const name = item?.name || "Unknown";
      if (!localRecentMap[name]) {
        localRecentMap[name] = 0;
      }
      localRecentMap[name] += 1;
    });

    const merged = apiBar.map((item) => ({
      name: item.name,
      views: localRecentMap[item.name] || 0,
      interactions: item.favorites ?? item.interactions ?? item.notes ?? 0,
    }));

    const existingNames = new Set(merged.map((item) => item.name));

    Object.entries(localRecentMap).forEach(([name, count]) => {
      if (!existingNames.has(name)) {
        merged.push({
          name,
          views: count,
          interactions: 0,
        });
      }
    });

    return merged.slice(0, 6);
  }, [dashboard, recentlyViewed]);

  const dynamicPieData = useMemo(() => {
    const apiPie = dashboard?.charts?.pieData || [];

    if (apiPie.length > 0) {
      return apiPie.map((item) => ({
        name: item.name,
        value: item.value,
      }));
    }

    return [{ name: "plant", value: 100 }];
  }, [dashboard]);

  const dynamicLineData = useMemo(() => {
    const apiLine = dashboard?.charts?.lineData || [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const recentMap = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    recentlyViewed.forEach((item) => {
      const rawDate = item.viewedAt || item.createdAt || item.date;
      if (!rawDate) return;
      const d = new Date(rawDate);
      const day = days[d.getDay()];
      recentMap[day] += 1;
    });

    if (apiLine.length > 0) {
      return apiLine.map((item) => ({
        day: item.day,
        value: (item.value || 0) + (recentMap[item.day] || 0),
      }));
    }

    return days.map((day) => ({
      day,
      value: recentMap[day] || 0,
    }));
  }, [dashboard, recentlyViewed]);

  const totalFavorites = dashboard?.topStats?.favorites || 0;
  const favoritesThisWeek = dashboard?.topStats?.favoritesThisWeek || 0;
  const totalNotes = dashboard?.topStats?.notes || 0;
  const notesThisWeek = dashboard?.topStats?.notesThisWeek || 0;
  const topPlant = dashboard?.topStats?.topPlant || "N/A";

  const totalRecentlyViewed = recentlyViewed.length;

  const favoritePreview = dashboard?.favoritePreview || [];
  const notesPreview = dashboard?.notesPreview || [];
  const journey = dashboard?.journey;
  const suggested = dashboard?.suggested;

  if (loading) {
    return (
      <div className="space-y-8 p-6 min-h-screen">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-[#FAE080] p-5 rounded-2xl border border-green-100 flex flex-col gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center">
            <FaHeart className="text-green-600 text-xl" />
          </div>
          <p className="text-sm text-gray-700 font-medium">Favorites</p>
          <h2 className="text-3xl font-semibold text-gray-900">{totalFavorites}</h2>
          <p className="text-xs text-green-600">↑ {favoritesThisWeek} this week</p>
        </div>

        <div className="bg-[#D4E4EF] p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
            <FaEye className="text-blue-600 text-xl" />
          </div>
          <p className="text-sm text-gray-700 font-medium">Recently Viewed</p>
          <h2 className="text-3xl font-semibold text-gray-900">{totalRecentlyViewed}</h2>
          <p className="text-xs text-green-600">↑ {recentlyViewedThisWeek} this week</p>
        </div>

        <div className="bg-[#DDD3F0] p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
          <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center">
            <FaStickyNote className="text-purple-600 text-xl" />
          </div>
          <p className="text-sm text-gray-700 font-medium">Notes</p>
          <h2 className="text-3xl font-semibold text-gray-900">{totalNotes}</h2>
          <p className="text-xs text-green-600">↑ {notesThisWeek} this week</p>
        </div>

        <div className="bg-[#EDE3D0] p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
          <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center">
            <FaLeaf className="text-yellow-600 text-xl" />
          </div>
          <p className="text-sm text-gray-700 font-medium">Top Plant</p>
          <h2 className="text-2xl font-semibold text-gray-900">{topPlant}</h2>
          <p className="text-xs text-gray-500">Based on your activity</p>
        </div>

        <div className="relative bg-gradient-to-br from-green-700 to-green-900 text-white p-5 rounded-2xl overflow-hidden">
          <p className="text-sm font-semibold mb-2">Did You Know?</p>
          <p className="text-sm leading-relaxed opacity-90">
            {suggested?.description ||
              "Herbal plants support natural wellness in many different ways."}
          </p>
          <svg
            className="absolute right-4 bottom-4 w-20 opacity-30"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path d="M20 180C80 20 180 20 180 180C120 140 80 140 20 180Z" fill="white" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Your Usage Insights</h2>
            <div className="flex gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#2E7D32] rounded"></span> Views
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#A5D6A7] rounded"></span> Interactions
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dynamicBarData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="views" fill="#2E7D32" radius={4} />
              <Bar dataKey="interactions" fill="#A5D6A7" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Health Focus Areas</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={220} className="md:w-3/5">
              <PieChart>
                <Pie
                  data={dynamicPieData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dynamicPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 text-sm md:w-2/5">
              {dynamicPieData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="capitalize">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <div className="flex justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Weekly Activity</h2>
            <span className="text-sm text-gray-500">This Week</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dynamicLineData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#66BB6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#greenGradient)"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2E7D32"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 bg-[#ECFDF3] p-6 rounded-2xl border">
  <div className="flex justify-between items-center mb-5">
    <h2 className="font-semibold text-lg">Favorites</h2>
    <button
      onClick={() => navigate("/app/favorites")}
      className="text-green-600 hover:underline text-sm font-medium"
    >
      View All →
    </button>
  </div>

  {favoritePreview.length > 0 ? (
    <div className="space-y-4">
      {favoritePreview.map((item) => (
        <div
          key={item.id}
          onClick={() =>
            navigate(
              item.itemType === "disease"
                ? `/app/remedy/${item.itemId}`
                : `/app/plant/${item.itemId}`
            )
          }
          className="cursor-pointer bg-white rounded-xl p-4 border border-green-100 flex items-center gap-4 hover:shadow-md transition"
        >
          {/* ❤️ HEART ICON */}
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <FaHeart className="text-green-600 text-xl" />
          </div>

          {/* TEXT */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              {item.name}
            </p>

            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.description
                ? item.description.substring(0, 60) + "..."
                : `Saved ${item.itemType}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="h-32 flex items-center justify-center text-sm text-gray-500">
      No favorites yet
    </div>
  )}
</div>





        <div className="col-span-12 md:col-span-3 bg-[#ECFDF3] p-6 rounded-2xl border">
          <h2 className="font-semibold text-lg mb-5">Recently Viewed</h2>
          <div className="space-y-5">
            {recentPreview.length > 0 ? (
              recentPreview.map((item, i) => (
                <div
                  key={item.id || i}
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => {
                    const type = item.itemType || item.type || "plant";
                    const id = item.itemId || item.id;
                    navigate(type === "disease" ? `/app/remedy/${id}` : `/app/plant/${id}`);
                  }}
                >
                  <img
                    src={getSafeImage(item)}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMG;
                    }}
                  />
                  <p className="text-sm capitalize">{item.name}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recently viewed items</p>
            )}
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FaStickyNote className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">My Notes</h2>
            </div>
            <span className="text-green-600 text-sm cursor-pointer hover:underline">
              + Add Note
            </span>
          </div>

          <div className="space-y-5">
            {notesPreview.length > 0 ? (
              notesPreview.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded-2xl bg-green-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={getSafeImage(note)}
                        alt={note.title}
                        className="w-8 h-8 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_IMG;
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{note.title}</p>
                      <p className="text-xs text-gray-500">{note.description}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    {getRelativeTime(note.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No notes yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">
            Your Journey at a Glance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-[#2F7D32] rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">
                {journey?.plantsExplored ?? 0}
              </p>
              <p className="text-sm text-green-100 font-medium">
                Plants Explored
              </p>
              <p className="text-xs text-green-200 mt-1 font-medium">
                +{journey?.plantsExploredThisMonth ?? 0} this month
              </p>
            </div>

            <div className="bg-[#2F7D32] rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">
                {journey?.daysActive ?? 0}
              </p>
              <p className="text-sm text-green-100 font-medium">
                Days Active
              </p>
              <p className="text-xs text-green-200 mt-1 font-medium">
                +{journey?.daysActiveThisWeek ?? 0} this week
              </p>
            </div>

            <div className="bg-[#2F7D32] rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">
                {journey?.notesCreated ?? 0}
              </p>
              <p className="text-sm text-green-100 font-medium">
                Notes Created
              </p>
              <p className="text-xs text-green-200 mt-1 font-medium">
                +{journey?.notesCreatedThisWeek ?? 0} this week
              </p>
            </div>

            <div className="bg-[#2F7D32] rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-sm text-green-100 italic leading-snug">
                "{journey?.quote || "The nature has provided us with everything to remain happy and healthy."}"
              </p>

              <p className="text-xs text-green-200 mt-3 font-medium">
                – {journey?.quoteAuthor || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-[#ECFDF3] p-6 rounded-2xl border border-green-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Suggested for You
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Based on your interests
          </p>

          <div className="bg-[#2F7D32] rounded-2xl px-5 py-4 flex items-center gap-4">
            <img
              src={getSafeImage(suggested)}
              alt={suggested?.name || "Suggested item"}
              className="w-14 h-14 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMG;
              }}
            />

            <div className="flex-1">
              <p className="text-base font-bold text-white">
                {suggested?.name || "No suggestion yet"}
              </p>

              <p className="text-sm text-green-100 mt-1">
                {suggested?.description ||
                  "Start exploring plants to get personalized suggestions."}
              </p>

              {suggested?.id ? (
                <button
                  onClick={() =>
                    navigate(
                      suggested.itemType === "disease"
                        ? `/app/remedy/${suggested.id}`
                        : `/app/plant/${suggested.id}`
                    )
                  }
                  className="mt-3 text-xs bg-[#C8E6C9] text-[#1B5E20] px-3 py-1.5 rounded-lg font-semibold hover:bg-[#A5D6A7] transition"
                >
                  View Plant
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;