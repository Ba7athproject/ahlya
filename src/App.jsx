import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  fetchNationalStats, fetchCompanies, fetchWilayaRisk,
  fetchAllWilayasRisk, fetchWilayaStats
} from "./services/api";

import FlagBadge from "./components/FlagBadge";
import SubScoresRadar from "./components/SubScoresRadar";
import ComparisonPanel from "./components/ComparisonPanel";
import MethodologyPanel from "./components/MethodologyPanel";
import OsintSourcesGrid from "./components/OsintSourcesGrid";
import CompanyOsintMenu from "./components/CompanyOsintMenu";
import InvestigationWizard from "./components/InvestigationWizard";
import EnrichedCompaniesPage from "./pages/EnrichedCompaniesPage";
import EnrichedProfileModal from "./components/EnrichedProfileModal";
import ManualEnrichmentWizard from "./components/ManualEnrichmentWizard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const TUNISIA_CENTER = [34.0, 9.5];

const WILAYAS_COORDS = {
  "باجة": [36.7256, 9.1820],
  "سيدي بوزيد": [35.0382, 9.4849],
  "قفصة": [34.4250, 8.7842],
  "صفاقس": [34.7406, 10.7603],
  "القيروان": [35.6781, 10.0963],
  "القصرين": [35.1676, 8.8308],
  "زغوان": [36.4029, 10.1429],
  "مدنين": [33.3549, 10.5055],
  "سليانة": [36.0887, 9.3649],
  "قبلي": [33.7072, 8.9715],
  "نابل": [36.4561, 10.7376],
  "توزر": [33.9197, 8.1336],
  "جندوبة": [36.5011, 8.7802],
  "المهدية": [35.5047, 11.0622],
  "تطاوين": [32.9297, 10.4518],
  "المنستير": [35.7780, 10.8262],
  "الكاف": [36.1742, 8.7049],
  "بنزرت": [37.2744, 9.8739],
  "سوسة": [35.8256, 10.6084],
  "منوبة": [36.8101, 10.12],
  "بن عروس": [36.7531, 10.23],
  "تونس": [36.8065, 10.1815],
  "قابس": [33.8815, 10.0982],
  "أريانة": [36.8624, 10.1956],
};

const ACTIVITY_COLORS = [
  "#dc2626", // Red 600
  "#2563eb", // Blue 600
  "#16a34a", // Green 600
  "#d97706", // Amber 600
  "#9333ea", // Purple 600
  "#0891b2", // Cyan 600
  "#db2777", // Pink 600
  "#84cc16", // Lime 500
  "#b4aeffff", // Indigo 600
  "#e8dc29ff", // Yellow 600
];

const GROUP_COLORS_MAP = {
  AGRI_NATUREL: "#16a34a", // Green
  TRANSPORT: "#42e610ff", // Blue
  ENVIRONNEMENT: "#0891b2", // Cyan
  ENERGIE_MINES: "#d97706", // Amber
  INDUSTRIE: "#9333ea", // Purple
  SERVICES_COM: "#4f46e5", // Indigo
  LOISIRS_TOURISME: "#db2777", // Pink
  AUTRE: "#64748b", // Slate
};

function getActivityColor(activityLabel) {
  if (GROUP_COLORS_MAP[activityLabel]) {
    return GROUP_COLORS_MAP[activityLabel];
  }

  if (!activityLabel) return "#64748B"; // Default gray

  let hash = 0;
  for (let i = 0; i < activityLabel.length; i++) {
    hash = activityLabel.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ACTIVITY_COLORS.length;
  return ACTIVITY_COLORS[index];
}

const GROUP_LABELS = {
  AGRI_NATUREL: "فلاحة و غابات و صيد",
  TRANSPORT: "نقل و خدمات ملحقة به",
  ENVIRONNEMENT: "بيئة، تطهير و رسكلة",
  ENERGIE_MINES: "طاقة و صناعات إستخراجية",
  INDUSTRIE: "صناعات تحويلية و حرفية",
  SERVICES_COM: "خدمات و تجارة",
  LOISIRS_TOURISME: "ترفيه و سياحة",
  AUTRE: "أنشطة أخرى",
};

function getGroupLabel(code) {
  return GROUP_LABELS[code] || code || "أنشطة أخرى";
}

// --- Map Controls ---

// --- Map Controls (VERSION CORRIGÉE) ---
function MapControls({ selectedWilaya, onReset }) {
  const map = useMap();
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  // Synchronisation avec selectedWilaya
  useEffect(() => {
    if (selectedWilaya === "ALL") {
      map.setView(TUNISIA_CENTER, 6.5, {
        animate: true,
        duration: 0.5
      });
    } else {
      const coords = WILAYAS_COORDS[selectedWilaya];
      if (coords) {
        map.setView(coords, 9, {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [selectedWilaya, map]);

  const handleResetClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Recadrage IMMÉDIAT
    map.setView(TUNISIA_CENTER, 6.5, {
      animate: true,
      duration: 0.8
    });

    // Callback parent avec délai pour éviter conflits
    if (onReset) {
      setTimeout(() => onReset(), 100);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-5 left-5 z-[5000]"
    >
      <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg border border-slate-200 p-1">
        <button
          onClick={handleResetClick}
          className="
            flex items-center justify-center w-10 h-10
            bg-white text-slate-700 rounded-md
            hover:bg-slate-100 hover:text-blue-600
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
          "
          title="إرجاع العرض الوطني"
          aria-label="Reset map view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// --- Components ---

const StatusBadge = ({ label, color = "emerald" }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}>
    <span className={`w-1.5 h-1.5 rounded-full bg-${color}-500 animate-pulse`}></span>
    {label}
  </span>
);

const KPICard = ({ title, value, subtext, color = "emerald" }) => (
  <div className={`relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 group hover:border-${color}-500/50 hover:shadow-lg transition-all duration-300`}>
    <div className={`absolute top-0 right-0 w-1 h-full bg-${color}-500/20 group-hover:bg-${color}-500 transition-colors`}></div>
    <div className="flex flex-col">
      <span className="text-4xl font-mono font-bold text-slate-900 tracking-tighter mb-1">{value}</span>
      <span className="text-sm font-medium text-slate-500">{title}</span>
      {subtext && <span className="text-xs text-slate-400 mt-2 font-mono">{subtext}</span>}
    </div>
  </div>
);

// --- Regional Panel (Slide-over) ---

function RegionPanel({ wilaya, stats, onClose, onResetView }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState([]);
  const [riskData, setRiskData] = useState(null);


  useEffect(() => {
    // Load companies and risk for this wilaya
    fetchCompanies({ wilaya, limit: 100 }).then(setCompanies);
    fetchWilayaRisk(wilaya).then(setRiskData);
  }, [wilaya]);

  /* Removed handleOsintClick logic as it is replaced by CompanyOsintMenu */

  const totalNat = stats.total || 0;
  const officialCount = stats.wilayas[wilaya] || 0;
  const pctNat = totalNat ? Math.round((officialCount / totalNat) * 100) : 0;

  const sortedWilayas = Object.entries(stats.wilayas || {}).sort((a, b) => b[1] - a[1]);
  const chartLabels = sortedWilayas.map(([w]) => w);
  const rank = chartLabels.indexOf(wilaya) + 1;
  const nbWilayas = chartLabels.length;

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(c =>
      c.name?.includes(searchTerm) ||
      c.activity_normalized?.includes(searchTerm)
    );
  }, [companies, searchTerm]);

  // Client-side aggregation for the panel view (based on fetched subset)
  const groupCounts = companies.reduce((acc, c) => {
    const g = c.activity_group || "AUTRE";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const activityCounts = companies.reduce((acc, c) => {
    const a = c.activity_normalized || c.activity_raw || "غير مصنف";
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});

  const topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[5000] flex justify-end" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <aside className="
            relative h-full flex flex-col
            w-full md:w-[32rem] lg:w-[40rem]
            bg-white shadow-2xl border-l border-slate-200
            animate-slideInRight
            transform transition-transform duration-300
          ">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{wilaya}</h2>
              <span className="px-2 py-0.5 text-xs font-mono bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                CASE FILE #{rank.toString().padStart(3, '0')}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <p className="text-sm text-slate-500 font-mono">
                <span>CNT: {officialCount}</span>
                <span className="mx-2">·</span>
                <span>NAT: {pctNat}%</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetView}
              className="hidden md:block text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              عودة للوطني
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">

          {/* Ba7ath Index & Flags */}
          {riskData && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col items-center justify-between gap-6 mb-6">
                <div className="text-center w-full">
                  <div className={`text-6xl font-bold text-${riskData.color || 'emerald'}-600 mb-2`}>
                    {riskData.baath_index.toFixed(1)}
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">مؤشر با7ث للمخاطر</p>
                  <span className={`inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold bg-${riskData.color || 'emerald'}-100 text-${riskData.color || 'emerald'}-800 border border-${riskData.color || 'emerald'}-300`}>
                    {riskData.level_ar || 'منخفض'}
                  </span>
                </div>
              </div>

              {/* Editorial Commentary */}
              <div className={`bg-${riskData.color || 'emerald'}-50 border-r-4 border-${riskData.color || 'emerald'}-500 p-4 rounded-lg mb-6 text-right`}>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {riskData.comment_ar || "لا توجد تعليقات."}
                </p>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {riskData.flags.length > 0 ? (
                  riskData.flags.map(flag => (
                    <FlagBadge key={flag.code} flag={flag} />
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-sm">لا توجد تنبيهات حرجة</span>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {riskData.recommendations && riskData.recommendations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-right">
                  <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center justify-end gap-2">
                    محاور للتحقيق
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </h4>
                  <ul className="space-y-1.5">
                    {riskData.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-amber-900 flex items-start gap-2 justify-end">
                        <span>{rec}</span>
                        <span className="text-amber-600">▸</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Radar Chart */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 text-center">
                  تحليل المكونات الثلاثة
                </h3>
                <SubScoresRadar s1={riskData.s1} s2={riskData.s2} s3={riskData.s3} />
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">الوزن الوطني</h3>
              <div className="text-2xl font-bold text-emerald-600">{pctNat}%</div>
              <div className="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctNat}%` }}></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">الترتيب</h3>
              <div className="text-2xl font-bold text-sky-600">#{rank} <span className="text-sm text-slate-500 font-normal">/ {nbWilayas}</span></div>
            </div>
          </div>

          {/* OSINT Sources Pivot */}
          <OsintSourcesGrid wilaya={wilaya} />

          {/* Activity Groups */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-sm"></span>
              التركيبة القطاعية (لأول 100 شركة)
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(groupCounts).map(([g, n]) => (
                <div key={g} className="flex items-center gap-2 px-3 py-1.5 rounded bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                  <span className="text-xs font-medium text-slate-600">{g}</span>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-100 px-1.5 rounded">{n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Activities */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">أفضل 5 أنشطة</h3>
              <ul className="space-y-2">
                {topActivities.map(([act, n], i) => (
                  <li key={act} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-2 truncate flex-1 ml-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getActivityColor(act) }}></span>
                      <span className="text-slate-600 truncate" title={act}>{act}</span>
                    </div>
                    <span className="font-mono text-emerald-600">{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investigative Questions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                نقاط للتحقيق
              </h3>
              <ul className="space-y-2 text-sm text-amber-900/80 list-disc list-inside">
                <li>استغلال الموارد العمومية (غابات، أراضٍ).</li>
                <li>من يسيطر على الحوكمة المحلية؟</li>
                <li>النتائج الاقتصادية مقابل الوعود.</li>
              </ul>
            </div>
          </div>

          {/* Company List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-sky-500 rounded-sm"></span>
                قائمة الشركات ({filteredCompanies.length})
              </h3>
              <input
                type="text"
                placeholder="بحث..."
                className="bg-white border border-slate-300 rounded px-3 py-1 text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors w-40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-96 min-h-[200px]">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0 border-b border-slate-200 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium">الشركة</th>
                      <th className="px-4 py-3 font-medium">النشاط</th>
                      <th className="px-4 py-3 font-medium">OSINT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-800 w-1/3">{c.name}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs w-1/3">
                          <span className="block truncate">{c.activity_normalized || c.activity_raw}</span>
                          <span className="text-[10px] text-slate-400">{c.delegation}</span>
                        </td>
                        <td className="px-4 py-2.5 w-1/4">
                          <CompanyOsintMenu company={c} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
}

// --- Main App ---

function App() {
  const [nationalStats, setNationalStats] = useState({ total: 0, wilayas: {}, types: {}, top_groups: {} });
  const [wilayaStats, setWilayaStats] = useState(null);

  const [selectedWilaya, setSelectedWilaya] = useState("ALL");
  const [openRegion, setOpenRegion] = useState(null);
  const [nationalRiskIndex, setNationalRiskIndex] = useState(0);
  const [allWilayasRisk, setAllWilayasRisk] = useState([]); // For wizard

  // Comparison State
  const [comparisonMode, setComparisonMode] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  // Enriched Profile State
  const [enrichedProfile, setEnrichedProfile] = useState(null);
  const [showEnrichedModal, setShowEnrichedModal] = useState(false);

  // Edit Wizard State (from modal)
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [editingFromModal, setEditingFromModal] = useState(null);

  useEffect(() => {
    // Initial Load
    fetchNationalStats().then(data => {
      setNationalStats(data);
    });

    // Load national companies for broader stats calc (optional, could be optimized)
    // fetchCompanies({ limit: 50 }).then(setCompanies);

    // Fetch aggregated risk to show a national "Average Risk"
    fetchAllWilayasRisk().then(risks => {
      setAllWilayasRisk(risks);
      const avg = risks.reduce((acc, r) => acc + r.baath_index, 0) / (risks.length || 1);
      setNationalRiskIndex(Math.round(avg));
    });

  }, []);

  // Fetch Wilaya Stats when selected
  useEffect(() => {
    if (selectedWilaya !== "ALL") {
      fetchWilayaStats(selectedWilaya).then(setWilayaStats).catch(console.error);
    } else {
      setWilayaStats(null);
    }
  }, [selectedWilaya]);

  const total = nationalStats.total || 0;
  // Hardcoded for now based on stats.json structure usually having types
  const locales = nationalStats.types["محلية"] || 0;
  const pctLocales = total ? Math.round((locales / total) * 100) : 0;

  // Use national stats for Top Groups
  const nationalTopGroups = Object.entries(nationalStats.top_groups || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Chart Data Preparation
  const chartConfig = useMemo(() => {
    const isAll = selectedWilaya === "ALL";
    let labels = [], values = [], title = "", backgroundColors = [];

    if (isAll) {
      const sorted = Object.entries(nationalStats.wilayas || {}).sort((a, b) => b[1] - a[1]);
      labels = sorted.map(([w]) => w);
      values = sorted.map(([, c]) => c);
      title = "التوزيع الوطني للشركات";
      backgroundColors = labels.map(w => w === selectedWilaya ? "#2563EB" : "#10B981");
    } else {
      // Logic for single wilaya view
      if (wilayaStats && wilayaStats.top_groups) {
        const sortedGroups = Object.entries(wilayaStats.top_groups).sort((a, b) => b[1] - a[1]);
        labels = sortedGroups.map(([g]) => getGroupLabel(g));
        values = sortedGroups.map(([, c]) => c);
        // Use group code for consistent coloring
        backgroundColors = sortedGroups.map(([g]) => getActivityColor(g));
        title = `توزيع الأنشطة في ${selectedWilaya}`;
      } else {
        title = `جاري تحميل بيانات ${selectedWilaya}...`;
        backgroundColors = "#10B981";
      }
    }

    return {
      title,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderRadius: 4,
          hoverBackgroundColor: "#60A5FA"
        }]
      }
    };
  }, [selectedWilaya, nationalStats, wilayaStats]);

  const handleResetView = () => {
    setSelectedWilaya("ALL");
    setOpenRegion(null);
  };

  return (
    <BrowserRouter>
      <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">

        {/* Top Bar */}
        <div className="h-1 bg-gradient-to-l from-emerald-500 via-sky-500 to-indigo-500"></div>

        {/* Header */}
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  الشركات الأهلية
                </h1>
                <span className="text-xs text-slate-500 font-mono tracking-wider">OSINT DASHBOARD · BA7ATH</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                🏠 الرئيسية
              </Link>
              <Link
                to="/enriched"
                className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-lg transition-all shadow-md"
              >
                📂 ملفات التحقيق
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvestigationOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span>تحقيق</span>
              </button>
              <button
                onClick={() => setMethodologyOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <span>📚</span>
                <span>المنهجية</span>
              </button>
              <StatusBadge label="LIVE MONITORING" color="emerald" />
              <span className="hidden md:inline text-xs text-slate-400 font-mono">{new Date().getFullYear()}</span>
            </div>
          </div>
        </header>

        <Routes>
          {/* Home Route - Dashboard */}
          <Route path="/" element={
            <>
              <main className="container mx-auto px-4 py-8 space-y-8 animate-fadeIn">

                {/* Statistics Row */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KPICard
                    title="إجمالي الشركات"
                    value={total}
                    subtext="سجل وطني"
                    color="emerald"
                  />
                  <KPICard
                    title="نسبة الشركات المحلية"
                    value={`${pctLocales}%`}
                    subtext={`${locales} شركة محلية`}
                    color="sky"
                  />
                  <KPICard
                    title="متوسط مؤشر BA7ATH"
                    value={nationalRiskIndex}
                    subtext="معدل وطني (0-100)"
                    color="amber"
                  />
                  <KPICard
                    title="تنوع الأنشطة"
                    value={Object.keys(nationalStats.top_activities || {}).length}
                    subtext="أنشطة رئيسية"
                    color="indigo"
                  />
                </section>

                {/* Filter & Controls */}
                <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm font-medium text-slate-600">نطاق التحليل:</span>
                    <select
                      className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full md:w-64 p-2.5 transition-shadow"
                      value={selectedWilaya}
                      onChange={(e) => setSelectedWilaya(e.target.value)}
                    >
                      <option value="ALL">كل الولايات (وطني)</option>
                      {Object.keys(nationalStats.wilayas || {}).sort().map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    {selectedWilaya !== "ALL" && (
                      <button
                        onClick={handleResetView}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        مسح الفلتر
                      </button>
                    )}
                    <button
                      onClick={() => setOpenRegion(selectedWilaya)}
                      disabled={selectedWilaya === "ALL"}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedWilaya === "ALL"
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-200/50 active:translate-y-0.5"
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                      </svg>
                      فتح الملف الجهوي
                    </button>
                  </div>
                </section>

                {/* Visualization Grid */}
                <section className="grid lg:grid-cols-12 gap-6 h-[600px] lg:h-[500px]">
                  {/* Chart Section */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      {chartConfig.title}
                    </h3>
                    <div className="flex-1 w-full relative">
                      <Bar
                        data={chartConfig.data}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            x: { ticks: { color: "#64748b", font: { family: "sans-serif" } }, grid: { display: false } },
                            y: { ticks: { color: "#64748b" }, grid: { color: "#e2e8f0" }, beginAtZero: true }
                          },
                          onClick: (e, els) => {
                            if (els.length > 0) {
                              const idx = els[0].index;
                              const w = chartConfig.data.labels[idx];
                              if (nationalStats.wilayas[w]) setSelectedWilaya(w);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Map Section */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-1 overflow-hidden relative shadow-sm">
                    <div className="absolute top-4 right-4 z-[400] bg-white/90 px-3 py-1 rounded text-xs text-slate-500 pointer-events-none border border-slate-200 shadow-sm">
                      تفاعلي: اضغط على الولاية
                    </div>
                    <MapContainer
                      center={TUNISIA_CENTER}
                      zoom={6.5}
                      className="w-full h-full rounded-xl bg-slate-100"
                      zoomControl={true}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />
                      <MapControls
                        selectedWilaya={selectedWilaya}
                        onReset={() => {
                          setSelectedWilaya("ALL");
                          setOpenRegion(null);
                        }}
                      />
                      {Object.entries(nationalStats.wilayas || {}).map(([wilaya, count]) => {
                        const coords = WILAYAS_COORDS[wilaya];
                        if (!coords) return null;
                        const isSelected = wilaya === selectedWilaya;
                        return (
                          <CircleMarker
                            key={wilaya}
                            center={coords}
                            radius={Math.sqrt(count) * 4}
                            pathOptions={{
                              color: isSelected ? "#2563EB" : "#10B981",
                              fillColor: isSelected ? "#3B82F6" : "#10B981",
                              fillOpacity: isSelected ? 0.8 : 0.4,
                              weight: isSelected ? 2 : 0
                            }}
                            eventHandlers={{
                              click: () => {
                                setSelectedWilaya(wilaya);
                                setOpenRegion(wilaya);
                              },
                            }}
                          >
                            <LeafletTooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
                              <span className="font-bold">{wilaya}</span>: {count}
                            </LeafletTooltip>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </section>

                {/* National Stats Grid */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">القطاعات الاقتصادية الكبرى</h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {nationalTopGroups.map(([code, value]) => (
                      <div key={code} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-200 hover:shadow-md transition-all group shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className={`p-2 rounded-lg bg-${code === "AGRI_NATUREL" ? "emerald" : "slate"}-100`}>
                            <span className="w-2 h-2 block rounded-full" style={{ backgroundColor: getActivityColor(code) }}></span>
                          </div>
                          <span className="text-2xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{value}</span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-500 line-clamp-2 min-h-[40px]">
                          {getGroupLabel(code)}
                        </h4>
                      </div>
                    ))}
                  </div>
                </section>
              </main>

              <footer className="border-t border-slate-200 mt-12 py-6 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                  <p className="text-slate-500 text-xs font-mono">
                    CONFIDENTIAL USE ONLY · DATA SOURCE: ALAHLIA.TN · PROCESSED BY BA7ATH
                  </p>
                </div>
              </footer>
            </>
          } />

          {/* Enriched Companies Route */}
          <Route path="/enriched" element={
            <EnrichedCompaniesPage
              onViewProfile={(company) => {
                setEnrichedProfile(company);
                setShowEnrichedModal(true);
              }}
            />
          } />
        </Routes>

        <InvestigationWizard
          isOpen={investigationOpen}
          onClose={() => setInvestigationOpen(false)}
          nationalStats={nationalStats}
          allWilayasRisk={allWilayasRisk}
        />

        {/* Enriched Profile Modal */}
        {showEnrichedModal && enrichedProfile && (
          <EnrichedProfileModal
            isOpen={showEnrichedModal}
            profile={enrichedProfile}
            onClose={() => {
              setShowEnrichedModal(false);
              setEnrichedProfile(null);
            }}
            onEdit={(profile) => {
              setShowEnrichedModal(false);
              setEditingFromModal({
                id: profile.company_id,
                name: profile.company_name,
                wilaya: profile.wilaya,
                existingData: profile
              });
              setEditWizardOpen(true);
            }}
          />
        )}

        {/* Edit Wizard from Modal */}
        {editWizardOpen && editingFromModal && (
          <ManualEnrichmentWizard
            company={editingFromModal}
            isOpen={editWizardOpen}
            onClose={() => {
              setEditWizardOpen(false);
              setEditingFromModal(null);
            }}
            onComplete={() => {
              setEditWizardOpen(false);
              setEditingFromModal(null);
            }}
            editMode={true}
            existingData={editingFromModal?.existingData}
          />
        )}

        {openRegion && (
          <RegionPanel
            wilaya={openRegion}
            stats={nationalStats}
            onClose={() => setOpenRegion(null)}
            onResetView={handleResetView}
          />
        )}

        {/* Comparison Floating Button */}
        <button
          onClick={() => setComparisonMode(true)}
          className="
          fixed bottom-8 left-8 z-[1000]
          bg-gradient-to-r from-blue-500 to-purple-600
          text-white px-6 py-3 rounded-full
          shadow-2xl font-bold text-lg
          hover:scale-110 transition-transform flex items-center gap-2
        "
        >
          <span>📊</span> مقارنة الولايات
          {selectedForComparison.length > 0 && (
            <span className="bg-red-500 rounded-full px-2 py-0.5 text-xs text-white shadow-sm">
              {selectedForComparison.length}
            </span>
          )}
        </button>

        <MethodologyPanel
          isOpen={methodologyOpen}
          onClose={() => setMethodologyOpen(false)}
        />

        {/* Comparison Panel */}
        <ComparisonPanel
          isOpen={comparisonMode}
          selectedWilayas={selectedForComparison}
          onClose={() => setComparisonMode(false)}
          onWilayaAdd={(name) => {
            if (selectedForComparison.length < 4 && !selectedForComparison.includes(name)) {
              setSelectedForComparison([...selectedForComparison, name]);
            }
          }}
          onWilayaRemove={(name) => setSelectedForComparison(selectedForComparison.filter(w => w !== name))}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
