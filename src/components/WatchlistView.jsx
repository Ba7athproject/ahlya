
import React, { useState, useEffect } from 'react';
import {
    Building2,
    MapPin,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../services/config';

const API_BASE = `${API_BASE_URL}/enrichment`;

const WatchlistView = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [wilayaFilter, setWilayaFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch watchlist data
    useEffect(() => {
        const fetchWatchlist = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append('q', search);
                if (wilayaFilter) params.append('wilaya', wilayaFilter);
                if (statusFilter) params.append('etat', statusFilter);

                const res = await fetch(`${API_BASE}/watch-companies?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch watchlist');
                const data = await res.json();
                setCompanies(data);
            } catch (err) {
                console.error(err);
                setError('تعذر تحميل القائمة. الرجاء المحاولة لاحقاً.');
            } finally {
                setLoading(false);
            }
        };

        fetchWatchlist();
    }, [search, wilayaFilter, statusFilter]);

    // Unique Wilayas for filter
    const wilayas = [...new Set(companies.map(c => c.wilaya).filter(Boolean))].sort();

    // Status Badge Helper
    const getStatusBadge = (status) => {
        switch (status) {
            case 'watch':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        <AlertCircle size={12} />
                        قيد المتابعة
                    </span>
                );
            case 'detected_trovit':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        ظهرت في تروفيت
                    </span>
                );
            case 'detected_rne':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Building2 size={12} />
                        في السجل الوطني
                    </span>
                );
            case 'archived':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        مؤرشفة
                    </span>
                );
            default:
                return <span className="text-xs text-slate-500">{status}</span>;
        }
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="text-indigo-600" />
                        سجل الشركات غير المسجلة بعد
                    </h1>
                    <p className="text-slate-500 mt-1">
                        قائمة الشركات الأهلية التي تم الإعلان عنها ولكن لم تظهر بعد في السجلات الرسمية (Trovit/RNE).
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                    <span className="text-sm text-slate-500">إجمالي الشركات:</span>
                    <span className="text-lg font-bold text-indigo-600">{companies.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="بحث باسم الشركة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        value={wilayaFilter}
                        onChange={(e) => setWilayaFilter(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                        <option value="">كل الولايات</option>
                        {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                        <option value="">كل الحالات</option>
                        <option value="watch">قيد المتابعة</option>
                        <option value="detected_trovit">ظهرت في تروفيت</option>
                        <option value="detected_rne">في السجل الوطني</option>
                        <option value="archived">مؤرشفة</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center items-center text-slate-500">
                        <Loader2 className="animate-spin mr-2" /> جارٍ التحميل...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500 bg-red-50">
                        {error}
                    </div>
                ) : companies.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        لا توجد شركات مطابقة للبحث.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50 text-slate-600 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-4">اسم الشركة</th>
                                    <th className="px-6 py-4">الموقع</th>
                                    <th className="px-6 py-4">النشاط</th>
                                    <th className="px-6 py-4">تاريخ الإعلان</th>
                                    <th className="px-6 py-4">الحالة</th>
                                    <th className="px-6 py-4">المصدر</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {company.name_ar}
                                            {company.type && (
                                                <span className="mr-2 text-xs text-slate-400 font-normal">({company.type})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span>{company.wilaya}</span>
                                                {company.delegation && <span className="text-slate-400 text-xs"> - {company.delegation}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm max-w-[200px] truncate" title={company.activity}>
                                            {company.activity || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm" dir="ltr">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>{company.date_annonce || '—'}</span>
                                                <Calendar size={14} className="text-slate-400" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(company.etat_enregistrement)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {company.detected_trovit_url ? (
                                                <a
                                                    href={company.detected_trovit_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    <span>تروفيت</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchlistView;
