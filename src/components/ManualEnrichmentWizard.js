import React, { useState } from 'react';
import { saveEnrichment } from '../services/api';

// --- Sub-components for Steps ---

const Step1Rne = ({ data, onChange }) => {
    const [showGuide, setShowGuide] = useState(true);

    const addShareholder = () => {
        onChange({
            ...data,
            rne: {
                ...data.rne,
                shareholders: [...data.rne.shareholders, { name: '', percentage: 0, role: 'مساهم' }]
            }
        });
    };

    const updateShareholder = (index, field, value) => {
        const newShareholders = [...data.rne.shareholders];
        newShareholders[index] = { ...newShareholders[index], [field]: value };
        onChange({
            ...data,
            rne: { ...data.rne, shareholders: newShareholders }
        });
    };

    const removeShareholder = (index) => {
        const newShareholders = data.rne.shareholders.filter((_, i) => i !== index);
        onChange({
            ...data,
            rne: { ...data.rne, shareholders: newShareholders }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <span>🏢</span> دليل السجل الوطني للمؤسسات (RNE)
                    </h3>
                    <span className="text-blue-500">{showGuide ? '▲' : '▼'}</span>
                </div>

                {showGuide && (
                    <div className="mt-4 text-sm text-blue-800 space-y-2">
                        <p>1. اذهب إلى موقع <a href="https://www.registre-entreprises.tn" target="_blank" rel="noopener noreferrer" className="underline font-bold">RNE</a>.</p>
                        <p>2. ابحث باسم الشركة أو المعرف الجبائي.</p>
                        <p>3. استخرج البيانات التالية من "المضمون" أو "Statuts".</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">رأس المال (بالدينار)</label>
                    <input
                        type="number"
                        value={data.rne.capital_social}
                        onChange={(e) => onChange({ ...data, rne: { ...data.rne, capital_social: parseFloat(e.target.value) || 0 } })}
                        className="w-full border rounded p-2 text-left dir-ltr"
                        placeholder="e.g. 10000"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الشكل القانوني</label>
                    <select
                        value={data.rne.legal_form}
                        onChange={(e) => onChange({ ...data, rne: { ...data.rne, legal_form: e.target.value } })}
                        className="w-full border rounded p-2"
                    >
                        <option value="">اختر...</option>
                        <option value="SUARL">SUARL (شخص واحد)</option>
                        <option value="SARL">SARL (محدودة المسؤولية)</option>
                        <option value="SA">SA (خفية الاسم)</option>
                        <option value="SNC">SNC (تضامن)</option>
                        <option value="GIE">GIE (مجمع مصالح)</option>
                        <option value="Autre">أخرى</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المعرف الجبائي / السجل</label>
                    <input
                        type="text"
                        value={data.rne.registration_number}
                        onChange={(e) => onChange({ ...data, rne: { ...data.rne, registration_number: e.target.value } })}
                        className="w-full border rounded p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسجيل</label>
                    <input
                        type="date"
                        value={data.rne.registration_date}
                        onChange={(e) => onChange({ ...data, rne: { ...data.rne, registration_date: e.target.value } })}
                        className="w-full border rounded p-2"
                    />
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-gray-900">المساهمون / الشركاء</h4>
                    <button onClick={addShareholder} className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">+ إضافة</button>
                </div>

                {data.rne.shareholders.map((sh, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                        <input
                            type="text"
                            placeholder="الاسم"
                            value={sh.name}
                            onChange={e => updateShareholder(idx, 'name', e.target.value)}
                            className="flex-1 border rounded p-2 text-sm"
                        />
                        <input
                            type="number"
                            placeholder="%"
                            value={sh.percentage}
                            onChange={e => updateShareholder(idx, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-20 border rounded p-2 text-sm text-center"
                        />
                        <select
                            value={sh.role}
                            onChange={e => updateShareholder(idx, 'role', e.target.value)}
                            className="w-32 border rounded p-2 text-sm"
                        >
                            <option value="مساهم">مساهم</option>
                            <option value="مسير">مسير</option>
                            <option value="رئيس مجلس">رئيس مجلس</option>
                            <option value="مستفيد فعلي">مستفيد فعلي</option>
                        </select>
                        <button onClick={() => removeShareholder(idx)} className="text-red-500 font-bold px-2">×</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Step2Jort = ({ data, onChange }) => {
    const addAnnouncement = () => {
        onChange({
            ...data,
            jort: {
                ...data.jort,
                announcements: [...data.jort.announcements, { date: '', type: 'تأسيس', content: '' }]
            }
        });
    };

    const updateAnnouncement = (index, field, value) => {
        const newAnnouncements = [...data.jort.announcements];
        newAnnouncements[index] = { ...newAnnouncements[index], [field]: value };
        onChange({ ...data, jort: { ...data.jort, announcements: newAnnouncements } });
    };

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                    <span>📰</span> الرائد الرسمي (JORT)
                </h3>
                <p className="text-sm text-amber-800 mt-2">
                    ابحث في <a href="https://www.iort.gov.tn" target="_blank" rel="noopener noreferrer" className="underline font-bold">المطبعة الرسمية</a> عن إعلانات قانونية.
                    ابحث عن: تغييرات في رأس المال، تغيير مسيرين، أو حل الشركة.
                </p>
            </div>

            <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900">الإعلانات المنشورة</h4>
                <button onClick={addAnnouncement} className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">+ إضافة إعلان</button>
            </div>

            {data.jort.announcements.map((ann, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 bg-white shadow-sm space-y-3 relative">
                    <button onClick={() => {
                        const newAnnouncements = data.jort.announcements.filter((_, i) => i !== idx);
                        onChange({ ...data, jort: { ...data.jort, announcements: newAnnouncements } });
                    }} className="absolute top-2 left-2 text-red-400 hover:text-red-600">✕</button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500">التاريخ</label>
                            <input type="date" value={ann.date} onChange={e => updateAnnouncement(idx, 'date', e.target.value)} className="w-full border rounded p-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">النوع</label>
                            <select value={ann.type} onChange={e => updateAnnouncement(idx, 'type', e.target.value)} className="w-full border rounded p-1">
                                <option value="تأسيس">تأسيس</option>
                                <option value="تعديل">تعديل نظام أساسي</option>
                                <option value="زيادة رأس مال">زيادة رأس مال</option>
                                <option value="تغيير مسيرين">تغيير مسيرين</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500">ملخص المحتوى</label>
                            <textarea value={ann.content} onChange={e => updateAnnouncement(idx, 'content', e.target.value)} className="w-full border rounded p-1" rows={2} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Step3Markets = ({ data, onChange }) => {
    const addContract = () => {
        onChange({
            ...data,
            marches: {
                ...data.marches,
                contracts: [...data.marches.contracts, { date: '', type: 'طلب عروض', montant: 0, organisme: '', objet: '' }]
            }
        });
    };

    const updateContract = (index, field, value) => {
        const newContracts = [...data.marches.contracts];
        newContracts[index] = { ...newContracts[index], [field]: value };
        onChange({ ...data, marches: { ...data.marches, contracts: newContracts } });
    };

    return (
        <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                    <span>💰</span> الصفقات العمومية (TUNEPS)
                </h3>
                <p className="text-sm text-emerald-800 mt-2">
                    تحقق من موقع <a href="http://www.marchespublics.gov.tn" target="_blank" rel="noopener noreferrer" className="underline font-bold">MarchesPublics.gov.tn</a>.
                    ركز على صفقات "التراضي" (Gré à gré) أو الاستشارات المباشرة.
                </p>
            </div>

            <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900">العقود والصفقات</h4>
                <button onClick={addContract} className="text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">+ إضافة عقد</button>
            </div>

            {data.marches.contracts.map((con, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 bg-white shadow-sm space-y-3 relative">
                    <button onClick={() => {
                        const newContracts = data.marches.contracts.filter((_, i) => i !== idx);
                        onChange({ ...data, marches: { ...data.marches, contracts: newContracts } });
                    }} className="absolute top-2 left-2 text-red-400 hover:text-red-600">✕</button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500">التاريخ</label>
                            <input type="date" value={con.date} onChange={e => updateContract(idx, 'date', e.target.value)} className="w-full border rounded p-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">المبلغ (د.ت)</label>
                            <input type="number" value={con.montant} onChange={e => updateContract(idx, 'montant', parseFloat(e.target.value) || 0)} className="w-full border rounded p-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">المشتري العمومي</label>
                            <input type="text" value={con.organisme} onChange={e => updateContract(idx, 'organisme', e.target.value)} className="w-full border rounded p-1" placeholder="مثلا: بلدية تونس" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">النوع</label>
                            <select value={con.type} onChange={e => updateContract(idx, 'type', e.target.value)} className="w-full border rounded p-1">
                                <option value="طلب عروض">طلب عروض</option>
                                <option value="استشارة">استشارة</option>
                                <option value="تراضي">تراضي (Gré à gré)</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500">موضوع الصفقة</label>
                            <input type="text" value={con.objet} onChange={e => updateContract(idx, 'objet', e.target.value)} className="w-full border rounded p-1" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Step4Summary = ({ data }) => {
    return (
        <div className="space-y-6 text-center">
            <h3 className="text-2xl font-bold text-gray-900">ملخص البيانات</h3>
            <p className="text-gray-600">يرجى مراجعة البيانات قبل الحفظ</p>

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.rne.capital_social.toLocaleString()}</div>
                    <div className="text-xs text-blue-800">رأس المال</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{data.jort.announcements.length}</div>
                    <div className="text-xs text-amber-800">إعلانات رسمية</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">{data.marches.contracts.length}</div>
                    <div className="text-xs text-emerald-800">عقود عمومية</div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded text-right text-sm space-y-2">
                <p><strong>الشركة:</strong> {data.company_name}</p>
                <p><strong>المساهمون:</strong> {data.rne.shareholders.map(s => `${s.name} (${s.percentage}%)`).join(', ')}</p>
                <p><strong>عدد الصفقات:</strong> {data.marches.contracts.length}</p>
            </div>
        </div>
    );
};

// --- Main Component ---

const ManualEnrichmentWizard = ({ isOpen, onClose, company, onComplete, editMode = false, existingData = null }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state from existing data if in edit mode
    const [enrichmentData, setEnrichmentData] = useState(() => {
        if (editMode && existingData?.data) {
            return {
                company_id: existingData.company_id || company?.id || '',
                company_name: existingData.company_name || company?.name || '',
                wilaya: existingData.wilaya || company?.wilaya || '',
                rne: existingData.data.rne || { capital_social: 0, legal_form: '', registration_number: '', registration_date: '', shareholders: [] },
                jort: existingData.data.jort || { announcements: [] },
                marches: existingData.data.marches || { contracts: [] },
                notes: existingData.data.notes || ''
            };
        }
        return {
            company_id: company?.id || '',
            company_name: company?.name || '',
            wilaya: company?.wilaya || '',
            rne: { capital_social: 0, legal_form: '', registration_number: '', registration_date: '', shareholders: [] },
            jort: { announcements: [] },
            marches: { contracts: [] },
            notes: ''
        };
    });

    const handleSave = async () => {
        setIsSaving(true);
        const result = await saveEnrichment({
            company_id: String(company.id || company.name || existingData?.company_id || ''),
            company_name: company.name || existingData?.company_name || '',
            wilaya: company.wilaya || existingData?.wilaya || '',
            data: {
                rne: enrichmentData.rne,
                jort: enrichmentData.jort,
                marches: enrichmentData.marches,
                notes: enrichmentData.notes
            }
        });
        setIsSaving(false);
        if (result) {
            alert(editMode ? 'تم تحديث البيانات بنجاح ✅' : 'تم حفظ البيانات بنجاح ✅');
            if (onComplete) onComplete();
            onClose();
        } else {
            alert('خطأ في الحفظ ❌');
        }
    };

    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/80 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            {editMode ? '✏️ تعديل بيانات الشركة' : '🔍 إثراء بيانات الشركة'}: {company.name}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {editMode ? 'تعديل البيانات المحفوظة مسبقاً' : 'أضف بيانات يدوية من المصادر الرسمية'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">✕</button>
                </div>

                {/* Steps Indicator */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    {['S1: السجل (RNE)', 'S2: الرائد (JORT)', 'S3: الصفقات (Markets)', 'S4: تأكيد'].map((label, idx) => (
                        <div key={idx} className={`flex-1 p-3 text-center text-sm font-medium ${step === idx + 1 ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500'}`}>
                            {label}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {step === 1 && <Step1Rne data={enrichmentData} onChange={setEnrichmentData} />}
                    {step === 2 && <Step2Jort data={enrichmentData} onChange={setEnrichmentData} />}
                    {step === 3 && <Step3Markets data={enrichmentData} onChange={setEnrichmentData} />}
                    {step === 4 && <Step4Summary data={enrichmentData} />}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-between bg-gray-50 shrink-0">
                    <button
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                        السابق
                    </button>
                    <button
                        onClick={() => step === 4 ? handleSave() : setStep(Math.min(4, step + 1))}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-md font-medium"
                    >
                        {step === 4 ? (isSaving ? 'جاري الحفظ...' : (editMode ? '💾 حفظ التعديلات' : '💾 حفظ البيانات')) : 'التالي'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ManualEnrichmentWizard;
