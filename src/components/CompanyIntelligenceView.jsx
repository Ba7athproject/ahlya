import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Building2,
    Newspaper,
    Landmark,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    XCircle,
    ExternalLink,
    FileText,
    MapPin,
    Calendar,
    Users,
    BadgeDollarSign,
    Shield,
    Printer,
    ChevronDown,
    Hash,
    Briefcase,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────

function getVerificationStatus(profile) {
    const data = profile?.data;
    const metrics = profile?.metrics;
    const redFlags = metrics?.red_flags || [];

    // Primary status: aligned with the card badge (Clean vs Red Flags)
    const hasRedFlags = redFlags.length > 0;

    // Data completeness checks
    const hasJort = data?.jort?.announcements?.length > 0;
    const hasRne =
        data?.rne?.capital_social > 0 ||
        data?.rne?.capital > 0 ||
        data?.rne?.tax_id ||
        data?.rne?.rc_number;
    const hasContracts = data?.marches?.contracts?.length > 0;

    // Build detail items
    const sources = [
        { key: "JORT", label: "الرائد الرسمي", present: hasJort },
        { key: "RNE", label: "السجل الوطني", present: hasRne },
        { key: "MARCHES", label: "الصفقات العمومية", present: hasContracts },
    ];

    if (hasRedFlags) {
        return {
            label: `${redFlags.length} تنبيه`,
            labelFr: `${redFlags.length} Red Flag${redFlags.length > 1 ? "s" : ""}`,
            color: "red",
            icon: AlertTriangle,
            sources,
            redFlags,
        };
    }

    return {
        label: "ملف نظيف",
        labelFr: "Clean",
        color: "emerald",
        icon: CheckCircle2,
        sources,
        redFlags: [],
    };
}


function detectCapitalDivergence(profile) {
    const rne = profile?.data?.rne;
    const jortAnn = profile?.data?.jort?.announcements || [];
    if (!rne) return null;
    const rneCapital = rne.capital || rne.capital_social || 0;
    if (rneCapital === 0) return null;

    // Check JORT content for capital mentions
    for (const ann of jortAnn) {
        const content = ann.content || "";
        // Match patterns like "رأس مال" followed by digits
        const match = content.match(/(\d[\d\s.,]*)\s*(د\.ت|دينار|DT|TND)/i);
        if (match) {
            const jortCapital = parseFloat(match[1].replace(/[\s.,]/g, ""));
            if (jortCapital > 0 && Math.abs(jortCapital - rneCapital) / rneCapital > 0.05) {
                return {
                    rneCapital,
                    jortCapital,
                    divergencePct: Math.round(Math.abs(jortCapital - rneCapital) / rneCapital * 100),
                };
            }
        }
    }
    return null;
}

function confidenceColor(score) {
    if (score >= 90) return "emerald";
    if (score >= 70) return "amber";
    return "red";
}

// ── Tab definitions ──────────────────────────────────────────────────

const TABS = [
    { id: "ahlya", label: "ملف أهلية", labelFr: "Profil Ahlya", icon: Building2 },
    { id: "jort", label: "أرشيف الرائد", labelFr: "Archives JORT", icon: Newspaper },
    { id: "rne", label: "السجل الوطني", labelFr: "Registre RNE", icon: Landmark },
];

const tabVariants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
};

// ── Sub-components ───────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, mono = false }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 gap-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-sm">{label}</span>
            </div>
            <span className={`text-sm font-semibold text-slate-800 dark:text-slate-200 text-left ${mono ? "font-mono" : ""}`}>
                {value}
            </span>
        </div>
    );
};

// ── Tab 1: Profil Ahlya ──────────────────────────────────────────────

function AhlyaTab({ profile }) {
    const { company_name, wilaya, data } = profile;
    const rne = data?.rne || {};
    const type = rne.charika_type;

    return (
        <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-l from-emerald-500/10 to-transparent px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        البيانات التصريحية
                    </h3>
                </div>
                <div className="px-5 py-2">
                    <InfoRow icon={Briefcase} label="إسم الشركة" value={company_name} />
                    <InfoRow icon={MapPin} label="الولاية" value={wilaya} />
                    <InfoRow icon={MapPin} label="المعتمدية" value={rne.delegation} />
                    <InfoRow icon={MapPin} label="المنطقة" value={rne.founding_location} />
                    <InfoRow
                        icon={Shield}
                        label="النوع"
                        value={
                            type === "jihawiya"
                                ? "شركة أهلية جهوية"
                                : type === "mahaliya"
                                    ? "شركة أهلية محلية"
                                    : type || "—"
                        }
                    />
                    <InfoRow icon={Calendar} label="تاريخ التأسيس" value={rne.start_date_raw || rne.founding_date_iso} />
                </div>
            </div>

            {/* Shareholders / Founders */}
            {rne.shareholders && rne.shareholders.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-l from-indigo-500/10 to-transparent px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            المؤسسون والمساهمون ({rne.shareholders.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-5 py-3 font-medium">الإسم</th>
                                    <th className="px-5 py-3 font-medium">الصفة</th>
                                    <th className="px-5 py-3 font-medium">النسبة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {rne.shareholders.map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.role}</td>
                                        <td className="px-5 py-3">
                                            <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs">
                                                {s.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tab 2: Archives JORT ─────────────────────────────────────────────

function JortTab({ profile }) {
    const announcements = profile?.data?.jort?.announcements || [];
    const [expandedIdx, setExpandedIdx] = useState(null);

    if (announcements.length === 0) {
        return (
            <div className="text-center py-16">
                <Newspaper className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">لا توجد إعلانات مسجلة في الرائد الرسمي</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Aucune publication JORT trouvée</p>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {/* Timeline */}
            <div className="relative pr-8">
                {/* Vertical line */}
                <div className="absolute top-0 right-3 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-slate-200 dark:from-amber-500 dark:via-amber-700 dark:to-slate-700" />

                {announcements.map((ann, idx) => {
                    const score = ann.confidence_score ?? null;
                    const scoreColor = score !== null ? confidenceColor(score) : null;
                    const isExpanded = expandedIdx === idx;

                    return (
                        <div key={idx} className="relative pb-6 last:pb-0">
                            {/* Timeline dot */}
                            <div className={`absolute right-1.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ${scoreColor === "emerald" ? "bg-emerald-500" :
                                scoreColor === "amber" ? "bg-amber-500" :
                                    scoreColor === "red" ? "bg-red-500" : "bg-slate-400"
                                }`} />

                            {/* Card */}
                            <div
                                className="mr-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                            >
                                <div className="px-4 py-3">
                                    {/* Top row: date + badges */}
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                                {ann.date}
                                            </span>
                                            {ann.year && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    {ann.year}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {score !== null && (
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${scoreColor}-100 dark:bg-${scoreColor}-900/30 text-${scoreColor}-700 dark:text-${scoreColor}-300 border border-${scoreColor}-200 dark:border-${scoreColor}-800`}>
                                                    {score}%
                                                </span>
                                            )}
                                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-medium">
                                                {ann.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* JORT Number */}
                                    {ann.jort_number && (
                                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            JORT N° {ann.jort_number}
                                        </div>
                                    )}

                                    {/* Content preview */}
                                    <p className={`text-sm text-slate-700 dark:text-slate-300 leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}>
                                        {ann.content}
                                    </p>

                                    {/* Expand indicator */}
                                    {ann.content && ann.content.length > 120 && (
                                        <div className="flex items-center justify-center mt-2">
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </div>
                                    )}
                                </div>

                                {/* PDF Link footer */}
                                {ann.jort_number && (
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 rounded-b-xl">
                                        <a
                                            href={`https://www.iort.gov.tn/WD120AWP/WD120Awp.exe/CONNECT/SITEJORT?ticket=${ann.jort_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Voir le PDF
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Tab 3: Registre RNE ──────────────────────────────────────────────

function RneTab({ profile }) {
    const rne = profile?.data?.rne || {};

    return (
        <div className="space-y-6">
            {/* Administrative Data */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-l from-blue-500/10 to-transparent px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-blue-600" />
                        البيانات الإدارية
                    </h3>
                </div>
                <div className="px-5 py-2">
                    <InfoRow
                        icon={BadgeDollarSign}
                        label="رأس المال"
                        value={
                            (rne.capital || rne.capital_social)
                                ? `${(rne.capital || rne.capital_social).toLocaleString()} د.ت`
                                : null
                        }
                        mono
                    />
                    <InfoRow icon={Shield} label="الشكل القانوني" value={rne.legal_form} />
                    <InfoRow icon={Hash} label="المعرف الجبائي" value={rne.tax_id} mono />
                    <InfoRow icon={Hash} label="رقم السجل التجاري" value={rne.rc_number} mono />
                    <InfoRow icon={Hash} label="معرف الشركة" value={rne.charika_id} mono />
                    <InfoRow
                        icon={Calendar}
                        label="تاريخ التسجيل"
                        value={
                            rne.founding_date_iso || rne.registration_date
                                ? new Date(rne.founding_date_iso || rne.registration_date).toLocaleDateString("ar-TN")
                                : null
                        }
                    />
                    <InfoRow icon={Calendar} label="تاريخ التأسيس (النص)" value={rne.start_date_raw} />
                    <InfoRow icon={MapPin} label="الولاية" value={rne.wilaya} />
                    <InfoRow icon={MapPin} label="المعتمدية" value={rne.delegation} />
                    <InfoRow icon={MapPin} label="العنوان" value={rne.address} />
                    <InfoRow icon={MapPin} label="الرمز البريدي" value={rne.zipcode_detail || rne.zipcode_list} mono />
                </div>
            </div>

            {/* Trovit / Source link */}
            {rne.detail_url && (
                <div className="flex justify-center">
                    <a
                        href={rne.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                    >
                        <ExternalLink className="w-4 h-4" />
                        عرض صفحة المصدر (Trovit / RNE)
                    </a>
                </div>
            )}

            {/* Shareholders table (also shown in RNE tab) */}
            {rne.shareholders && rne.shareholders.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-l from-indigo-500/10 to-transparent px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            الهيكل المساهماتي
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-5 py-3 font-medium">المساهم</th>
                                    <th className="px-5 py-3 font-medium">الصفة</th>
                                    <th className="px-5 py-3 font-medium">النسبة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {rne.shareholders.map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{s.role}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden max-w-[80px]">
                                                    <div
                                                        className="h-full rounded-full bg-indigo-500"
                                                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">{s.percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function CompanyIntelligenceView({ isOpen, onClose, profile, onEdit }) {
    const [activeTab, setActiveTab] = useState(0);
    const [direction, setDirection] = useState(0);

    const verification = useMemo(() => getVerificationStatus(profile), [profile]);
    const divergence = useMemo(() => detectCapitalDivergence(profile), [profile]);

    if (!isOpen || !profile) return null;

    const handleTabChange = (idx) => {
        setDirection(idx > activeTab ? 1 : -1);
        setActiveTab(idx);
    };

    const StatusIcon = verification.icon;

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center" dir="rtl">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 border border-slate-200 dark:border-slate-700"
            >
                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: company info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                        {profile.company_name}
                                    </h2>
                                    {/* Verification badge */}
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-${verification.color}-100 dark:bg-${verification.color}-900/30 text-${verification.color}-800 dark:text-${verification.color}-300 border border-${verification.color}-200 dark:border-${verification.color}-800`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {verification.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                    <span>ID: {profile.company_id}</span>
                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                    <span>{profile.wilaya}</span>
                                    {profile.enriched_at && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-600">·</span>
                                            <span>{new Date(profile.enriched_at).toLocaleDateString("ar-TN")}</span>
                                        </>
                                    )}
                                </div>

                                {/* Data Completeness Strip */}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    {verification.sources.map((src) => (
                                        <span
                                            key={src.key}
                                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${src.present
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                                                }`}
                                        >
                                            {src.present ? (
                                                <CheckCircle2 className="w-3 h-3" />
                                            ) : (
                                                <XCircle className="w-3 h-3" />
                                            )}
                                            {src.label}
                                        </span>
                                    ))}
                                </div>

                                {/* Red Flag Details (if any) */}
                                {verification.redFlags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {verification.redFlags.map((flag, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                                            >
                                                <AlertTriangle className="w-3 h-3" />
                                                {flag.message_ar}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(profile)}
                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="تعديل البيانات"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    title="طباعة"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── CAPITAL DIVERGENCE ALERT ──────────────────────── */}
                    <AnimatePresence>
                        {divergence && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mx-6 mb-4 px-4 py-3 bg-gradient-to-l from-red-500/10 via-red-50 to-orange-50 dark:from-red-900/20 dark:via-red-900/10 dark:to-orange-900/10 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-red-800 dark:text-red-300">
                                            تباين في البيانات المالية — Divergence de données détectée
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                            RNE: {divergence.rneCapital.toLocaleString()} د.ت · JORT: {divergence.jortCapital.toLocaleString()} د.ت · Écart: {divergence.divergencePct}%
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── TAB BAR ───────────────────────────────────────── */}
                    <div className="px-6 flex gap-1">
                        {TABS.map((tab, idx) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === idx;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(idx)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${isActive
                                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <TabIcon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden text-[10px]">{tab.labelFr}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── TAB CONTENT ─────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            variants={tabVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                            {activeTab === 0 && <AhlyaTab profile={profile} />}
                            {activeTab === 1 && <JortTab profile={profile} />}
                            {activeTab === 2 && <RneTab profile={profile} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── FOOTER ──────────────────────────────────────────── */}
                <div className="shrink-0 px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        BA7ATH INTELLIGENCE · CROSS-REFERENCE VIEW
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
