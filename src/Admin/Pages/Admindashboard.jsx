import {
  FiUsers,
  FiTrendingUp,
  FiHeart,
} from "react-icons/fi";
import { GiPlantSeed } from "react-icons/gi";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Legend,
} from "recharts";

const Dashboard = () => {

  const categoryData = [
    { name: "Immunity", value: 40 },
    { name: "Healing", value: 25 },
    { name: "Detox", value: 20 },
    { name: "Skin", value: 15 },
  ];

  const barData = [
    { name: "Immunity", value: 80 },
    { name: "Healing", value: 60 },
    { name: "Detox", value: 40 },
    { name: "Skin", value: 70 },
  ];

  const COLORS = ["#22c55e", "#fde047", "#ef4444", "#f97316"];

  return (
    <div className="text-white space-y-8 text-[15px]">

      {/* 🌈 STATS (MATCH IMAGE COLORS) */}
      <div className="grid grid-cols-4 gap-6">

        <StatCard color="bg-yellow-200" textColor="text-black" icon={<FiHeart />} title="Favorites" value="12" sub="↑ 2 this week" />
        <StatCard color="bg-blue-200" textColor="text-black" icon={<FiTrendingUp />} title="Recently Viewed" value="34" sub="↑ 8 this week" />
        <StatCard color="bg-purple-200" textColor="text-black" icon={<FiUsers />} title="Notes" value="5" sub="↑ 1 this week" />
        <StatCard color="bg-yellow-100" textColor="text-black" icon={<GiPlantSeed />} title="Top Plant" value="Tulsi" sub="Most viewed" />

      </div>

      {/* 📊 TOP ROW */}
      <div className="grid grid-cols-3 gap-6">

        {/* MOST VIEWED */}
        <GlassCard title="Most Viewed Plants">
          <ul className="space-y-3 text-base">
            <li>1. Tulsi</li>
            <li>2. Aloe Vera</li>
            <li>3. Neem</li>
          </ul>
        </GlassCard>

        {/* PIE CHART WITH LEGEND */}
        <GlassCard title="Category Distribution">
          <div className="h-[240px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  outerRadius={80}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* CATEGORY LIST */}
        <GlassCard title="Categories">
          <ul className="space-y-3 text-base">
            <li>🟢 Immunity</li>
            <li>🟡 Healing</li>
            <li>🔴 Detox</li>
            <li>🟠 Skin</li>
          </ul>
        </GlassCard>

      </div>

      {/* 📊 SECOND ROW (FIXED WIDTHS) */}
      <div className="grid grid-cols-3 gap-6">

        {/* RECENT ACTIVITY (SMALLER) */}
        <GlassCard title="Recent Activity" className="col-span-1">
          <ul className="space-y-4 text-base">
            <li>Added Ashwagandha <span className="text-sm opacity-60">• 2 hrs</span></li>
            <li>Updated Tulsi <span className="text-sm opacity-60">• 1 day</span></li>
            <li>Deleted Giloy <span className="text-sm opacity-60">• 3 days</span></li>
          </ul>
        </GlassCard>

        {/* BAR CHART (WIDER) */}
        <GlassCard title="Category Overview" className="col-span-2">
          <div className="h-[250px]">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#fff" />
                <Tooltip />
                <Bar dataKey="value" fill="#4ade80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

    </div>
  );
};

export default Dashboard;



/* 🔥 COMPONENTS */

const StatCard = ({ icon, title, value, sub, color, textColor }) => (
  <div className={`${color} ${textColor} p-6 rounded-xl shadow-md flex flex-col gap-2`}>
    <div className="text-xl">{icon}</div>
    <p className="text-sm opacity-80">{title}</p>
    <h2 className="text-2xl font-bold">{value}</h2>
    <p className="text-xs text-green-600">{sub}</p>
  </div>
);

const GlassCard = ({ title, children, className }) => (
  <div className={`bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg ${className}`}>
    <h3 className="mb-4 font-semibold text-lg">{title}</h3>
    {children}
  </div>
);