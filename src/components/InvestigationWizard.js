import React, { useState, useEffect } from 'react';
import CompanyOsintMenu from './CompanyOsintMenu';
import { fetchCompanies } from '../services/api';

// --- Sub-components for Steps ---

const Step1ChooseAngle = ({ data, onChange }) => {
    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">اختر زاوية التحقيق</h3>
                <p className="text-gray-600">هل تريد التركيز على منطقة جغرافية أم قطاع نشاط؟</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Option Wilaya */}
                <button
                    onClick={() => onChange({ ...data, angle: 'wilaya', selectedSector: null })}
                    className={`p-8 rounded-2xl border-4 transition-all ${data.angle === 'wilaya'
                        ? 'border-purple-500 bg-purple-50 shadow-xl'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                        }`}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-4">🗺️</div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">تحقيق جهوي</h4>
                        <p className="text-sm text-gray-600">التركيز على ولاية معينة ذات مؤشر با7ث مرتفع</p>
                        {data.angle === 'wilaya' && (
                            <div className="mt-4 inline-block px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-semibold">
                                ✓ محدد
                            </div>
                        )}
                    </div>
                </button>

                {/* Option Sector */}
                <button
                    onClick={() => onChange({ ...data, angle: 'sector', selectedWilaya: null })}
                    className={`p-8 rounded-2xl border-4 transition-all ${data.angle === 'sector'
                        ? 'border-indigo-500 bg-indigo-50 shadow-xl'
                        : 'border-gray-200 hover:border-indigo-300 bg-white'
                        }`}
                >
                    <div className="text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">تحقيق قطاعي</h4>
                        <p className="text-sm text-gray-600">التركيز على نشاط معين (فلاحة، نقل، بيئة...)</p>
                        {data.angle === 'sector' && (
                            <div className="mt-4 inline-block px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-semibold">
                                ✓ محدد
                            </div>
                        )}
                    </div>
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-right">
                <h5 className="font-semibold text-blue-900 mb-2 flex items-center justify-end gap-2">
                    أمثلة
                    <span>💡</span>
                </h5>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li><strong>جهوي:</strong> "هل شركات أهلية في سيدي بوزيد تحصل على أراضٍ دولية دون إنتاج حقيقي؟"</li>
                    <li><strong>قطاعي:</strong> "هل شركات الرسكلة والتطهير تهيمن على صفقات عمومية في عدة ولايات؟"</li>
                </ul>
            </div>
        </div>
    );
};

const Step2SelectTarget = ({ data, onChange, nationalStats, allWilayasRisk }) => {
    const getGroupLabel = (code) => {
        // Basic mapping, ideally import from App.js or constants
        const LABELS = {
            AGRI_NATUREL: "فلاحة و غابات و صيد",
            TRANSPORT: "نقل و خدمات ملحقة به",
            ENVIRONNEMENT: "بيئة، تطهير و رسكلة",
            ENERGIE_MINES: "طاقة و صناعات إستخراجية",
            INDUSTRIE: "صناعات تحويلية و حرفية",
            SERVICES_COM: "خدمات و تجارة",
            LOISIRS_TOURISME: "ترفيه و سياحة",
            AUTRE: "أنشطة أخرى",
        };
        return LABELS[code] || code;
    };

    if (data.angle === 'wilaya') {
        // Filter high risk wilayas (index >= 40 for broader selection, prompt said 70 but 70 is very high)
        // Let's list top 6 by risk for better UX
        const sortedWilayas = [...allWilayasRisk].sort((a, b) => b.baath_index - a.baath_index).slice(0, 8);

        return (
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">اختر الولاية المستهدفة</h3>
                <p className="text-gray-600 mb-6 text-center">الولايات ذات أعلى مؤشر مخاطر:</p>

                <div className="grid md:grid-cols-2 gap-4">
                    {sortedWilayas.map(wilaya => (
                        <button
                            key={wilaya.wilaya}
                            onClick={() => onChange({ ...data, selectedWilaya: wilaya.wilaya })}
                            className={`p-4 rounded-lg border-2 text-right transition-all ${data.selectedWilaya === wilaya.wilaya
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300 bg-white'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-lg">{wilaya.wilaya}</h4>
                                <span className={`text-2xl font-bold text-${wilaya.color || 'gray'}-600`}>
                                    {wilaya.baath_index.toFixed(0)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 truncate">{wilaya.comment_ar || '...'}</p>
                            <div className="flex flex-wrap gap-1">
                                {wilaya.flags.slice(0, 2).map(flag => (
                                    <span key={flag.code} className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                                        {flag.label_ar}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    } else {
        const sectors = Object.keys(nationalStats.top_groups || {});

        return (
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">اختر القطاع المستهدف</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {sectors.map(sector => (
                        <button
                            key={sector}
                            onClick={() => onChange({ ...data, selectedSector: sector })}
                            className={`p-6 rounded-lg border-2 transition-all ${data.selectedSector === sector
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300 bg-white'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <h4 className="font-bold text-sm">{getGroupLabel(sector)}</h4>
                                <p className="text-xs text-gray-500 mt-1">{nationalStats.top_groups[sector]} شركة</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }
};

const Step3ViewData = ({ data }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = { limit: 20 }; // Top 20 relevant companies
        if (data.angle === 'wilaya' && data.selectedWilaya) {
            params.wilaya = data.selectedWilaya;
        }
        // Note currently API might not support filtering by activity_group directly comfortably without client side filter
        // But let's fetch strictly for wilaya if wilaya selected.
        // If sector selected, we might need to fetch more and filter client side or update API.
        // For V1, let's assume client side filter for sector on a larger batch if needed or just show top companies.

        fetchCompanies({ limit: 100, wilaya: data.selectedWilaya }).then(res => {
            let filtered = res;
            if (data.angle === 'sector' && data.selectedSector) {
                filtered = res.filter(c => c.activity_group === data.selectedSector);
            }
            // Sort or prioritize? For now, just take first 10
            setCompanies(filtered.slice(0, 10));
            setLoading(false);
        });
    }, [data]);

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">البيانات المستهدفة</h3>
            <p className="text-gray-600 mb-6 text-center">أبرز الشركات التي تطابق معاييرك:</p>

            {loading ? (
                <div className="text-center py-10">جاري التحميل...</div>
            ) : (
                <div className="space-y-3">
                    {companies.map(c => (
                        <div key={c.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all gap-4">
                            <div className="text-right flex-1">
                                <h4 className="font-bold text-gray-800">{c.name}</h4>
                                <p className="text-xs text-gray-500">{c.activity_normalized}</p>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 mt-1 inline-block">{c.wilaya}</span>
                            </div>
                            <div className="flex-shrink-0">
                                <CompanyOsintMenu company={c} />
                            </div>
                        </div>
                    ))}
                    {companies.length === 0 && (
                        <div className="text-center text-gray-500">لا توجد شركات مطابقة في هذه العينة.</div>
                    )}
                </div>
            )}
        </div>
    );
};

const Step4Checklist = ({ data, onChange }) => {
    const checklistItems = [
        { id: 'rne_capital', label: 'هل تم التحقق من رأس المال في RNE؟', source: 'RNE', critical: true },
        { id: 'rne_shareholders', label: 'هل تم تحديد المساهمين الحقيقيين؟', source: 'RNE', critical: true },
        { id: 'jort_announcements', label: 'هل توجد إعلانات قانونية في الرائد الرسمي؟', source: 'JORT', critical: false },
        { id: 'tuneps_contracts', label: 'هل ظهرت الشركة في صفقات عمومية (TUNEPS)؟', source: 'TUNEPS', critical: true },
        { id: 'otd_lands', label: 'هل لديها أراضٍ دولية مُسندة (OTD)؟', source: 'OTD', critical: true },
        { id: 'bts_loans', label: 'هل حصلت على قروض بنكية (BTS)؟', source: 'BTS', critical: false },
        { id: 'field_visit', label: 'هل تم القيام بزيارة ميدانية؟', source: 'FIELD', critical: false }
    ];

    const handleCheck = (itemId) => {
        onChange({
            ...data,
            checklist: {
                ...data.checklist,
                [itemId]: !data.checklist[itemId]
            }
        });
    };

    const completedCount = Object.values(data.checklist || {}).filter(Boolean).length;
    const progressPct = (completedCount / checklistItems.length) * 100;

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">قائمة التحقق OSINT</h3>
            <p className="text-gray-600 mb-6 text-center">تتبع تقدم التحقيق خطوة بخطوة (يُحفظ محليا)</p>

            {/* Progress */}
            <div className="bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>
            <p className="text-sm text-gray-600 text-center mb-6">
                {completedCount} / {checklistItems.length} منجز ({progressPct.toFixed(0)}%)
            </p>

            {/* Checklist */}
            <div className="space-y-3">
                {checklistItems.map(item => (
                    <label
                        key={item.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${data.checklist?.[item.id]
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}
                    >
                        <input
                            type="checkbox"
                            checked={data.checklist?.[item.id] || false}
                            onChange={() => handleCheck(item.id)}
                            className="w-5 h-5 mt-0.5 text-purple-500 rounded"
                        />
                        <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                {item.critical && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">حرج</span>
                                )}
                                <span className="font-semibold text-gray-900">{item.label}</span>
                            </div>
                            <span className="text-xs text-gray-500 block">المصدر: {item.source}</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};

// --- Main Wizard Component ---

const InvestigationWizard = ({ isOpen, onClose, nationalStats, allWilayasRisk }) => {
    const [step, setStep] = useState(1);
    const [investigationData, setInvestigationData] = useState({
        angle: null,
        selectedWilaya: null,
        selectedSector: null,
        checklist: {}
    });

    // Load from localStorage on open
    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('ba7ath_investigation');
            if (saved) {
                setInvestigationData(JSON.parse(saved));
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 4) {
            localStorage.setItem('ba7ath_investigation', JSON.stringify(investigationData));
            alert('تم حفظ التحقيق محليا في المتصفح ✅');
            onClose();
        } else {
            setStep(prev => Math.min(4, prev + 1));
        }
    };

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/70 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header / Progress */}
                <div className="bg-gradient-to-l from-purple-600 to-indigo-700 p-6 text-white shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <span className="text-3xl">🔍</span>
                            مساعد التحقيق الموجّه
                        </h2>
                        <button onClick={onClose} className="text-white hover:text-purple-200 text-3xl">✕</button>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`flex-1 h-2 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-purple-400/30'}`} />
                        ))}
                    </div>
                    <p className="text-purple-100 text-sm mt-2">الخطوة {step} من 4</p>
                </div>

                {/* Content Body */}
                <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
                    {step === 1 && <Step1ChooseAngle data={investigationData} onChange={setInvestigationData} />}
                    {step === 2 && <Step2SelectTarget data={investigationData} onChange={setInvestigationData} nationalStats={nationalStats} allWilayasRisk={allWilayasRisk} />}
                    {step === 3 && <Step3ViewData data={investigationData} />}
                    {step === 4 && <Step4Checklist data={investigationData} onChange={setInvestigationData} />}
                </div>

                {/* Footer Navigation */}
                <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-white shrink-0">
                    <button
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← السابق
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-semibold shadow-md"
                    >
                        {step === 4 ? 'حفظ وإغلاق' : 'التالي →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvestigationWizard;
