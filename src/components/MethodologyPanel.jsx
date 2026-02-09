import React, { useState } from 'react';

const MethodologyPanel = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState('hypothesis');

    const sections = {
        hypothesis: {
            icon: '💡',
            title: 'الفرضية التحريرية',
            content: `
        هذا المشروع يختبر فرضية أن العديد من الشركات الأهلية قد تستفيد من 
        **الدعم السياسي** (الأراضي العمومية، التراخيص، الصفقات) أكثر من تحقيق 
        **مردودية اقتصادية حقيقية** أو **منفعة اجتماعية**.
      `
        },
        methodology: {
            icon: '🔍',
            title: 'خطوات المنهجية',
            steps: [
                {
                    number: 1,
                    title: 'التنظيف والتطبيع',
                    description: 'توحيد أسماء الأنشطة وتجميعها في 8 مجموعات رئيسية'
                },
                {
                    number: 2,
                    title: 'التقاطع مع المصادر',
                    description: 'RNE، JORT، TUNEPS، CRDA، BTS'
                },
                {
                    number: 3,
                    title: 'رسم خرائط الموارد',
                    description: 'الأراضي الدولية، التراخيص، الصفقات'
                },
                {
                    number: 4,
                    title: 'بناء مؤشر الاعتماد',
                    description: 'مؤشر ba7ath (0-100) + تحليل متقدم'
                }
            ]
        },
        indicators: {
            icon: '📊',
            title: 'كيف نقرأ المؤشرات؟',
            ranges: [
                { min: 0, max: 40, label: 'اعتماد ضعيف', color: 'text-green-600 bg-green-50' },
                { min: 40, max: 70, label: 'اعتماد متوسط', color: 'text-yellow-600 bg-yellow-50' },
                { min: 70, max: 100, label: 'اعتماد مرتفع', color: 'text-red-600 bg-red-50' }
            ]
        },
        questions: {
            icon: '❓',
            title: 'أسئلة تحقيقية رئيسية',
            questions: [
                'من يسيطر فعليا؟ (المساهمون، الروابط السياسية)',
                'ما هي الموارد العمومية المعبأة؟',
                'ما هي النتائج الاقتصادية الفعلية؟',
                'ما هي الآثار البيئية والاجتماعية؟'
            ]
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span>📚</span>
                        منهجية القراءة والتحقيق
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 bg-gray-50 border-l border-gray-200 p-4 space-y-2 shrink-0">
                        {Object.entries(sections).map(([key, section]) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={`
                  w-full text-right px-4 py-3 rounded-lg text-sm font-semibold
                  transition-all flex items-center gap-2
                  ${activeSection === key
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                                    }
                `}
                            >
                                <span>{section.icon}</span>
                                {section.title}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-white">
                        {activeSection === 'hypothesis' && (
                            <div className="prose prose-lg max-w-none text-right">
                                <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-lg mb-6">
                                    <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <span className="text-2xl">💡</span>
                                        الفرضية التحريرية
                                    </h3>
                                    <p className="text-gray-800 leading-relaxed text-lg">
                                        {sections.hypothesis.content}
                                    </p>
                                </div>
                                <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-lg">
                                    <p className="text-amber-900 font-semibold flex items-center gap-2">
                                        <span>🎯</span>
                                        الهدف: تحديد المناطق والقطاعات التي تستحق تحقيقا معمقا
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeSection === 'methodology' && (
                            <div className="space-y-4">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 border-b pb-2">خطوات العمل</h3>
                                    <p className="text-gray-600 text-sm">كيف تم بناء هذه البيانات ومعالجتها</p>
                                </div>
                                {sections.methodology.steps.map((step) => (
                                    <div
                                        key={step.number}
                                        className="flex gap-4 items-start bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-blue-600 transition-colors">
                                            {step.number}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSection === 'indicators' && (
                            <div className="space-y-6">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 border-b pb-2">مؤشر Ba7ath</h3>
                                    <p className="text-gray-600">مقياس من 0 إلى 100 لتقييم مخاطر الاعتماد المؤسساتي</p>
                                </div>

                                <div className="grid gap-4">
                                    {sections.indicators.ranges.map((range) => (
                                        <div
                                            key={range.min}
                                            className={`p-5 rounded-xl border-2 transition-transform hover:scale-[1.01] ${range.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className={`text-3xl font-bold ${range.color.split(' ')[0]}`}>
                                                    {range.min}-{range.max}
                                                </div>
                                                <div className={`text-lg font-bold px-4 py-1 rounded-full ${range.color}`}>
                                                    {range.label}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 border border-gray-200 mt-4">
                                    <strong>ملاحظة:</strong> المؤشر المرتفع لا يعني بالضرورة وجود فساد، بل يشير إلى ضرورة التدقيق في تداخل المصالح والجدوى الاقتصادية.
                                </div>
                            </div>
                        )}

                        {activeSection === 'questions' && (
                            <div className="space-y-4">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 border-b pb-2">دليل المحقق</h3>
                                    <p className="text-gray-600">الأسئلة الجوهرية التي يجب طرحها عند تحليل البيانات</p>
                                </div>
                                {sections.questions.questions.map((question, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-4 items-center bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors"
                                    >
                                        <span className="text-2xl h-10 w-10 flex items-center justify-center bg-white rounded-full shadow-sm">❓</span>
                                        <p className="flex-1 text-right text-gray-800 font-bold text-lg">
                                            {question}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MethodologyPanel;
