import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../services/config';

const API_BASE = `${API_BASE_URL}/enrichment`;

// --- Sub-components ---

const RedFlagBadge = ({ flag }) => {
    const color = flag.severity === 'HIGH' ? 'red' : 'amber';
    return (
        <div className={`flex items-start gap-2 p-3 bg-${color}-50 border border-${color}-200 rounded-lg animate-fadeIn`}>
            <span className={`text-xl ${flag.severity === 'HIGH' ? 'animate-pulse' : ''}`}>
                {flag.severity === 'HIGH' ? '🚨' : '⚠️'}
            </span>
            <div>
                <h5 className={`font-bold text-${color}-800 text-sm`}>{flag.type}</h5>
                <p className={`text-${color}-700 text-xs`}>{flag.message_ar}</p>
            </div>
        </div>
    );
};

const MetricsCard = ({ title, value, subtext, color = 'blue' }) => (
    <div className={`p-4 bg-${color}-50 border border-${color}-100 rounded-lg text-center`}>
        <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
        <div className={`text-xs text-${color}-800 font-medium`}>{title}</div>
        {subtext && <div className={`text-[10px] text-${color}-500 mt-1`}>{subtext}</div>}
    </div>
);

const NoteCard = ({ note, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    const dateLabel = note.created_at
        ? new Date(note.created_at).toLocaleString('ar-TN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : '';

    return (
        <div className="bg-white border-2 border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-all">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-lg">{note.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>🕒 {dateLabel}</span>
                        {note.created_by && <span>👤 {note.created_by}</span>}
                        {note.updated_at && note.updated_at !== note.created_at && (
                            <span className="text-amber-600">✏️ معدّلة</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="تعديل"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="حذف"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {note.tags.map((tag, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full border border-purple-200"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className={`text-sm text-slate-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
                {note.content}
            </div>

            {note.content && note.content.length > 160 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                    {expanded ? 'عرض أقل ▲' : 'عرض المزيد ▼'}
                </button>
            )}
        </div>
    );
};

// --- Main Component ---

const EnrichedProfileModal = ({ isOpen, onClose, profile, onEdit }) => {
    const [notes, setNotes] = useState([]);
    const [addingNote, setAddingNote] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [noteForm, setNoteForm] = useState({ title: '', content: '', tags: [] });
    const [savingNote, setSavingNote] = useState(false);

    // Ref for printable content
    const reportRef = useRef(null);

    const companyId = profile?.company_id;

    const fetchNotes = useCallback(async () => {
        if (!companyId) return;
        try {
            const res = await fetch(`${API_BASE}/${companyId}/notes`);
            if (!res.ok) throw new Error('Failed to fetch notes');
            const data = await res.json();
            setNotes(data.notes || []);
        } catch (e) {
            console.error(e);
            setNotes([]);
        }
    }, [companyId]);

    // Fetch notes when modal opens
    useEffect(() => {
        if (isOpen && companyId) {
            fetchNotes();
        }
    }, [isOpen, companyId, fetchNotes]);

    const handleSaveNote = async () => {
        if (!noteForm.title.trim() || !noteForm.content.trim()) {
            alert('الرجاء ملء العنوان والمحتوى');
            return;
        }

        setSavingNote(true);

        try {
            if (editingNote) {
                const res = await fetch(`${API_BASE}/${companyId}/notes/${editingNote.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: noteForm.title,
                        content: noteForm.content,
                        tags: noteForm.tags
                    })
                });
                if (!res.ok) throw new Error('Failed to update note');
            } else {
                const res = await fetch(`${API_BASE}/${companyId}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: noteForm.title,
                        content: noteForm.content,
                        created_by: 'المحقق',
                        tags: noteForm.tags
                    })
                });
                if (!res.ok) throw new Error('Failed to create note');
            }

            await fetchNotes();
            setAddingNote(false);
            setEditingNote(null);
            setNoteForm({ title: '', content: '', tags: [] });

        } catch (e) {
            console.error(e);
            alert('خطأ في حفظ الملاحظة');
        } finally {
            setSavingNote(false);
        }
    };

    const handleEditNote = (note) => {
        setEditingNote(note);
        setAddingNote(true);
        setNoteForm({
            title: note.title || '',
            content: note.content || '',
            tags: note.tags || []
        });
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

        try {
            const res = await fetch(`${API_BASE}/${companyId}/notes/${noteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete note');
            await fetchNotes();
        } catch (e) {
            console.error(e);
            alert('خطأ في حذف الملاحظة');
        }
    };

    // Print handler
    const handlePrintReport = () => {
        document.body.classList.add('printing');
        if (reportRef.current) {
            reportRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        setTimeout(() => {
            window.print();
            document.body.classList.remove('printing');
        }, 100);
    };

    if (!isOpen || !profile) return null;

    const { data, metrics } = profile;

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header - no-print */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start no-print">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold">{profile.company_name}</h2>
                            <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded font-mono">ENRICHED</span>
                            {/* NEW: Charika Type Badge */}
                            {data.rne.charika_type && (
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${data.rne.charika_type === 'jihawiya'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-indigo-500 text-white'
                                    }`}>
                                    {data.rne.charika_type === 'jihawiya' ? 'شركة أهلية جهوية' : 'شركة أهلية محلية'}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-xs font-mono">
                            ID: {profile.company_id} · BY: {profile.enriched_by} · AT: {new Date(profile.enriched_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrintReport}
                            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-300 flex items-center gap-2"
                        >
                            <span>🖨️</span>
                            <span>طباعة التقرير</span>
                        </button>
                        {onEdit && (
                            <button
                                onClick={() => onEdit(profile)}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1"
                            >
                                ✏️ تعديل البيانات
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">✕</button>
                    </div>
                </div>

                {/* Printable Body */}
                <div ref={reportRef} className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 print-view" dir="rtl">

                    {/* 1. Red Flags Section */}
                    {metrics.red_flags.length > 0 && (
                        <div className="grid md:grid-cols-3 gap-4">
                            {metrics.red_flags.map((flag, idx) => (
                                <RedFlagBadge key={idx} flag={flag} />
                            ))}
                        </div>
                    )}

                    {/* 2. Metrics Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricsCard title="رأس المال" value={`${(data.rne.capital || data.rne.capital_social).toLocaleString()} د.ت`} color="blue" />
                        <MetricsCard title="عدد العقود" value={metrics.total_contracts} color="emerald" />
                        <MetricsCard title="قيمة العقود" value={`${metrics.total_contracts_value.toLocaleString()} د.ت`} color="emerald" />
                        <MetricsCard
                            title="المؤشر المالي"
                            value={`${metrics.capital_to_contracts_ratio.toFixed(1)}x`}
                            subtext="عقود / رأس مال"
                            color={metrics.capital_to_contracts_ratio > 10 ? 'red' : 'gray'}
                        />
                    </div>

                    <div className="grid md:grid-cols-12 gap-6">

                        {/* LEFT COLUMN: RNE & JORT */}
                        <div className="md:col-span-5 space-y-6">

                            {/* RNE Card */}
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                                    <h3 className="font-bold text-blue-900 text-sm">🏢 السجل الوطني للمؤسسات</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    {/* Legal Form */}
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 text-sm">الشكل القانوني</span>
                                        <span className="font-bold text-slate-800">{data.rne.legal_form || "غير متوفر"}</span>
                                    </div>

                                    {/* Identifiers (Tax ID / RC) */}
                                    {(data.rne.tax_id || data.rne.registration_number) && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">المعرف الجبائي / السجل</span>
                                            <span className="font-mono text-slate-800 dir-ltr">{data.rne.tax_id || data.rne.registration_number}</span>
                                        </div>
                                    )}

                                    {/* RC Number specifically if available */}
                                    {data.rne.rc_number && (data.rne.rc_number !== data.rne.tax_id) && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">رقم السجل التجاري</span>
                                            <span className="font-mono text-slate-800 dir-ltr">{data.rne.rc_number}</span>
                                        </div>
                                    )}

                                    {/* Capital */}
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 text-sm">رأس المال</span>
                                        <span className="font-bold text-green-700">{(data.rne.capital || data.rne.capital_social).toLocaleString()} د.ت</span>
                                    </div>

                                    {/* Founding Date */}
                                    {(data.rne.founding_date_iso || data.rne.registration_date) && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">تاريخ التسجيل</span>
                                            <span className="font-bold text-slate-800">
                                                {new Date(data.rne.founding_date_iso || data.rne.registration_date).toLocaleDateString('ar-TN')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Original Date Text (if available) */}
                                    {data.rne.start_date_raw && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">تاريخ التأسيس (النص)</span>
                                            <span className="text-slate-800 text-sm">{data.rne.start_date_raw}</span>
                                        </div>
                                    )}

                                    {/* Address / Location */}
                                    {(data.rne.wilaya || data.rne.delegation) && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">المقر</span>
                                            <span className="text-slate-800 text-left dir-ltr">
                                                {data.rne.delegation ? `${data.rne.delegation}, ` : ''}{data.rne.wilaya}
                                            </span>
                                        </div>
                                    )}

                                    {data.rne.address && (
                                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 text-sm">العنوان الكامل</span>
                                            <span className="text-slate-800 text-sm leading-relaxed">
                                                {data.rne.address}
                                                {(data.rne.zipcode_detail || data.rne.zipcode_list) &&
                                                    <span className="text-slate-400 mr-1">({data.rne.zipcode_detail || data.rne.zipcode_list})</span>
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {/* Trovit Link */}
                                    {data.rne.detail_url && (
                                        <div className="pt-2 text-center no-print">
                                            <a
                                                href={data.rne.detail_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                <span>🔗</span>
                                                <span>عرض صفحة المصدر (Trovit)</span>
                                            </a>
                                        </div>
                                    )}

                                    <div>
                                        <h4 className="text-xs font-bold text-slate-700 mb-2 border-b pb-1">المساهمون</h4>
                                        <ul className="space-y-2">
                                            {data.rne.shareholders.map((s, i) => (
                                                <li key={i} className="flex justify-between text-sm">
                                                    <span>{s.name} <span className="text-slate-400 text-xs">({s.role})</span></span>
                                                    <span className="font-mono bg-slate-100 px-1 rounded">{s.percentage}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* JORT Card */}
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
                                    <h3 className="font-bold text-amber-900 text-sm">📰 إعلانات الرائد الرسمي ({data.jort.announcements.length})</h3>
                                </div>
                                <div className="p-4 max-h-60 overflow-y-auto space-y-3">
                                    {data.jort.announcements.map((ann, i) => (
                                        <div key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>{ann.date}</span>
                                                <span className="bg-amber-100 text-amber-800 px-1.5 rounded">{ann.type}</span>
                                            </div>
                                            <p className="text-slate-700 line-clamp-2">{ann.content}</p>
                                        </div>
                                    ))}
                                    {data.jort.announcements.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-4">لا توجد إعلانات مسجلة</p>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: CONTRACTS */}
                        <div className="md:col-span-7">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-full">
                                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex justify-between items-center">
                                    <h3 className="font-bold text-emerald-900 text-sm">💰 الصفقات العمومية ({data.marches.contracts.length})</h3>
                                    <span className="text-xs text-emerald-700 font-mono">Total: {metrics.total_contracts_value.toLocaleString()} TND</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs">
                                            <tr>
                                                <th className="px-4 py-2">التاريخ</th>
                                                <th className="px-4 py-2">المشتري</th>
                                                <th className="px-4 py-2">الموضوع</th>
                                                <th className="px-4 py-2">النوع</th>
                                                <th className="px-4 py-2">المبلغ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.marches.contracts.map((c, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 font-mono text-slate-500 text-xs">{c.date}</td>
                                                    <td className="px-4 py-2 font-medium text-slate-700">{c.organisme}</td>
                                                    <td className="px-4 py-2 text-slate-600 max-w-xs truncate" title={c.objet}>{c.objet}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${c.type.includes('تراضي') ? 'bg-red-100 text-red-700 font-bold' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {c.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-emerald-600">{c.montant.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {data.marches.contracts.length === 0 && (
                                        <div className="p-8 text-center text-slate-400">لا توجد صفقات مسجلة</div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* INVESTIGATION NOTES SECTION */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                📝 ملاحظات التحقيق
                                <span className="text-sm font-normal text-slate-500">
                                    ({notes.length})
                                </span>
                            </h3>
                            <button
                                onClick={() => {
                                    setAddingNote(true);
                                    setEditingNote(null);
                                    setNoteForm({ title: '', content: '', tags: [] });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md text-sm"
                            >
                                <span>➕</span>
                                <span>إضافة ملاحظة</span>
                            </button>
                        </div>

                        {notes.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                                <div className="text-4xl mb-2">📝</div>
                                <p className="text-slate-600 font-medium">لا توجد ملاحظات بعد</p>
                                <p className="text-sm text-slate-400 mt-1">ابدأ بتوثيق خطوات التحقيق، الاتصالات، والشبهات.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={() => handleEditNote(note)}
                                        onDelete={() => handleDeleteNote(note.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer Actions - no-print */}
                <div className="bg-white p-4 border-t border-slate-200 shrink-0 flex justify-end gap-2 no-print">
                    <button
                        onClick={handlePrintReport}
                        className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <span>🖨️</span>
                        <span>طباعة التقرير</span>
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">إغلاق</button>
                </div>

            </div>

            {/* Note Editor Modal */}
            {(addingNote || editingNote) && (
                <div className="fixed inset-0 z-[9500] flex items-center justify-center p-4" dir="rtl">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => {
                            setAddingNote(false);
                            setEditingNote(null);
                            setNoteForm({ title: '', content: '', tags: [] });
                        }}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            {editingNote ? '✏️ تعديل الملاحظة' : '📝 إضافة ملاحظة جديدة'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    العنوان *
                                </label>
                                <input
                                    type="text"
                                    value={noteForm.title}
                                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="مثال: اتصال بمصدر، مراجعة وثائق، زيارة ميدانية..."
                                    maxLength={120}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    المحتوى *
                                </label>
                                <textarea
                                    rows={7}
                                    value={noteForm.content}
                                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                                    placeholder="دوّن ملاحظاتك، الأسئلة المفتوحة، الشبهات، مسارات التحقيق..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    الوسوم (اختياري)
                                </label>
                                <input
                                    type="text"
                                    placeholder="أدخل الوسوم مفصولة بفواصل: ميداني، مصدر، تمويل..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ',') {
                                            e.preventDefault();
                                            const value = e.currentTarget.value.trim().replace(/,$/, '');
                                            if (!value) return;
                                            if (!noteForm.tags.includes(value)) {
                                                setNoteForm({ ...noteForm, tags: [...noteForm.tags, value] });
                                            }
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {noteForm.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setNoteForm({
                                                        ...noteForm,
                                                        tags: noteForm.tags.filter((_, idx) => idx !== i)
                                                    })
                                                }
                                                className="text-purple-900 hover:text-purple-600"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setAddingNote(false);
                                    setEditingNote(null);
                                    setNoteForm({ title: '', content: '', tags: [] });
                                }}
                                className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSaveNote}
                                disabled={savingNote || !noteForm.title.trim() || !noteForm.content.trim()}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-sm font-semibold"
                            >
                                {savingNote ? '⏳ جاري الحفظ...' : '💾 حفظ الملاحظة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrichedProfileModal;
