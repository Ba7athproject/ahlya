import React from 'react';
import MiniRadarChart from './MiniRadarChart';

const WilayaComparisonCard = ({ data, onRemove }) => {
    return (
        <div className="
      bg-gray-800 rounded-xl p-6
      border-2 border-gray-700 hover:border-blue-500
      transition-all duration-300
      relative
    ">
            {onRemove && (
                <button
                    onClick={() => onRemove(data.wilaya)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                    title="إزالة"
                >
                    ✕
                </button>
            )}

            {/* Header */}
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">
                    {data.wilaya}
                </h3>
                <div className="text-5xl font-bold text-blue-400">
                    {data.baath_index.toFixed(1)}
                </div>
                <p className="text-xs text-gray-500 mt-1">مؤشر با7ث</p>
            </div>

            {/* Mini Radar Chart */}
            <div className="mb-4">
                <MiniRadarChart s1={data.s1} s2={data.s2} s3={data.s3} />
            </div>

            {/* Sous-scores en chiffres */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                        {(data.s1 * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">موارد</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                        {(data.s2 * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">تركيز</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                        {(data.s3 * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-400">حوكمة</div>
                </div>
            </div>

            {/* Flags compacts */}
            <div className="space-y-2">
                {data.flags.length > 0 ? (
                    data.flags.map((flag, idx) => (
                        <div
                            key={idx}
                            className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 text-right flex items-center gap-2 justify-between"
                        >
                            <span>{flag.label_ar}</span>
                            {flag.code === 'RESOURCE_DEPENDENT' && <span>🏛️</span>}
                            {flag.code === 'ULTRA_CONCENTRATION' && <span>📊</span>}
                            {flag.code === 'GOVERNANCE_IMBALANCE' && <span>⚖️</span>}
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-emerald-400 text-center py-2 bg-emerald-900/20 rounded">
                        ✅ لا توجد تنبيهات حرجة
                    </div>
                )}
            </div>
        </div>
    );
};

export default WilayaComparisonCard;
