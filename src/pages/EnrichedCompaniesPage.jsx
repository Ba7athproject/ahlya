
import React, { useState, useEffect } from 'react';
import ManualEnrichmentWizard from '../components/ManualEnrichmentWizard';
import WatchlistView from '../components/WatchlistView';
import { API_BASE_URL } from '../services/config';

const API_BASE = `${API_BASE_URL}/enrichment`;

// --- Helper Components ---

const RedFlagBadge = ({ count }) => (
    <div className={`px-2 py-1 rounded-full text-xs font-bold ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {count > 0 ? `🚨 ${count} Red Flags` : '✓ Clean'}
    </div>
);

const MetricPill = ({ label, value, color = 'blue' }) => (
    <div className={`bg-${color}-50 text-${color}-700 px-2 py-1 rounded text-xs font-medium`}>
        {label}: <span className="font-bold">{value}</span>
    </div>
);

const CompanyCard = ({ company, onViewProfile }) => {
    const { company_name, wilaya, enriched_at, metrics, data } = company;
    const redFlagCount = metrics?.red_flags?.length || 0;
    const contractsCount = data?.marches?.contracts?.length || 0;
    const capital = data?.rne?.capital_social || 0;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header with Red Flag Indicator */}
            <div className={`h-2 ${redFlagCount > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}></div>

            <div className="p-5">
                {/* Company Name & Wilaya */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{company_name}</h3>
                        <p className="text-gray-500 text-sm">📍 {wilaya}</p>
                    </div>
                    <RedFlagBadge count={redFlagCount} />
                </div>

                {/* Key Metrics */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <MetricPill label="رأس المال" value={`${capital.toLocaleString()} د.ت`} color="blue" />
                    <MetricPill label="العقود" value={contractsCount} color="emerald" />
                    {metrics?.capital_to_contracts_ratio > 10 && (
                        <MetricPill label="المؤشر" value={`${metrics.capital_to_contracts_ratio.toFixed(1)}x`} color="red" />
                    )}
                </div>

                {/* Red Flags Preview */}
                {redFlagCount > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 mb-4 border border-red-100">
                        <p className="text-red-700 text-xs font-medium">
                            {metrics.red_flags.slice(0, 2).map((f, i) => (
                                <span key={i} className="block">⚠️ {f.message_ar}</span>
                            ))}
                            {redFlagCount > 2 && <span className="text-red-500">+{redFlagCount - 2} المزيد...</span>}
                        </p>
                    </div>
                )}

                {/* Footer: Date & Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                        🕒 {new Date(enriched_at).toLocaleDateString('ar-TN')}
                    </span>
                    <button
                        onClick={() => onViewProfile(company)}
                        className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition-colors font-medium"
                    >
                        عرض الملف الكامل
                    </button>
                </div>
            </div>
        </div>
    );
};

const FilterBar = ({ filters, setFilters, wilayas }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="🔍 البحث باسم الشركة..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Wilaya Filter */}
                <select
                    value={filters.wilaya}
                    onChange={(e) => setFilters({ ...filters, wilaya: e.target.value, page: 1 })}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
                >
                    <option value="">كل الولايات</option>
                    {wilayas.map(w => (
                        <option key={w} value={w}>{w}</option>
                    ))}
                </select>

                {/* Red Flags Filter */}
                <select
                    value={filters.hasRedFlags}
                    onChange={(e) => setFilters({ ...filters, hasRedFlags: e.target.value, page: 1 })}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
                >
                    <option value="">كل الملفات</option>
                    <option value="true">🚨 مع إنذارات</option>
                    <option value="false">✓ بدون إنذارات</option>
                </select>

                {/* Reset */}
                <button
                    onClick={() => setFilters({ search: '', wilaya: '', hasRedFlags: '', page: 1 })}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                    إعادة تعيين
                </button>
            </div>
        </div>
    );
};

const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
                السابق
            </button>
            <span className="text-sm text-gray-600">
                صفحة {page} من {totalPages}
            </span>
            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
                التالي
            </button>
        </div>
    );
};

// --- Main Page Component ---

const EnrichedCompaniesPage = ({ onViewProfile }) => {
    const [activeTab, setActiveTab] = useState('enriched'); // 'enriched' | 'watchlist'

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit wizard state
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardEditMode, setWizardEditMode] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        wilaya: '',
        hasRedFlags: '',
        page: 1
    });
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [wilayas, setWilayas] = useState([]);

    // Fetch companies (only if tab is enriched)
    useEffect(() => {
        if (activeTab !== 'enriched') return;

        const fetchCompanies = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('page', filters.page);
                params.append('per_page', 12);
                if (filters.search) params.append('search', filters.search);
                if (filters.wilaya) params.append('wilaya', filters.wilaya);
                if (filters.hasRedFlags !== '') params.append('has_red_flags', filters.hasRedFlags);

                const response = await fetch(`${API_BASE}/list?${params.toString()}`);
                const data = await response.json();

                setCompanies(data.companies || []);
                setPagination({
                    total: data.total,
                    totalPages: data.total_pages
                });

                if (wilayas.length === 0 && data.companies.length > 0) {
                    const allResponse = await fetch(`${API_BASE}/all`);
                    const allData = await allResponse.json();
                    const uniqueWilayas = [...new Set(allData.map(c => c.wilaya).filter(Boolean))];
                    setWilayas(uniqueWilayas);
                }
            } catch (error) {
                console.error('Error fetching enriched companies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, activeTab]);

    const handleViewProfile = (company) => {
        if (onViewProfile) {
            onViewProfile(company);
        } else {
            console.log('View profile:', company);
        }
    };

    // Render
    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header & Tabs */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">📂 ملفات التحقيق</h1>
                        <p className="text-gray-600">
                            منصة إدارة ومتابعة الشركات الأهلية
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                        <button
                            onClick={() => setActiveTab('enriched')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'enriched'
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            الشركات المُثرَاة
                        </button>
                        <button
                            onClick={() => setActiveTab('watchlist')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'watchlist'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            سجل الشركات غير المسجلة
                        </button>
                    </div>
                </div>

                {/* Content based on Tab */}
                {activeTab === 'watchlist' ? (
                    <WatchlistView />
                ) : (
                    <>
                        {/* Existing Enriched View Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-800">قائمة الشركات ({pagination.total})</h2>
                            </div>
                            <FilterBar filters={filters} setFilters={setFilters} wilayas={wilayas} />
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                <p className="text-gray-500 mt-4">جاري التحميل...</p>
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                                <div className="text-6xl mb-4">📭</div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد ملفات</h3>
                                <p className="text-gray-500">لم يتم إثراء أي شركة بعد، أو لا توجد نتائج مطابقة للفلاتر.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {companies.map((company, idx) => (
                                        <CompanyCard
                                            key={company.company_id || idx}
                                            company={company}
                                            onViewProfile={handleViewProfile}
                                        />
                                    ))}
                                </div>
                                <Pagination
                                    page={filters.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(newPage) => setFilters({ ...filters, page: newPage })}
                                />
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Edit Wizard (Global) */}
            {wizardOpen && editingCompany && (
                <ManualEnrichmentWizard
                    company={editingCompany}
                    isOpen={wizardOpen}
                    onClose={() => {
                        setWizardOpen(false);
                        setWizardEditMode(false);
                        setEditingCompany(null);
                    }}
                    onComplete={() => {
                        setWizardOpen(false);
                        setWizardEditMode(false);
                        setEditingCompany(null);
                        window.location.reload();
                    }}
                    editMode={wizardEditMode}
                    existingData={editingCompany?.existingData}
                />
            )}
        </div>
    );
};

export default EnrichedCompaniesPage;
