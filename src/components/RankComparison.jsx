import React from 'react';

const RankComparison = ({ wilayas }) => {
    // Sort wilayas key by rank for better visualization if needed, but grid usually matches selection order
    // Let's display them cards style
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200" dir="rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-right">
                الترتيب الوطني (من حيث عدد الشركات)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wilayas.map(w => (
                    <div key={w.wilaya} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-lg font-bold text-slate-700 mb-2">{w.wilaya}</span>
                        <div className="relative">
                            <svg className="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800 pt-2">
                                {w.rank}
                            </span>
                        </div>
                        <span className="text-sm text-slate-500 mt-2">ترتيب وطني</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RankComparison;
