import React from 'react';

const ComparisonParametersFilter = ({ selectedParams, onParamsChange }) => {
    const availableParams = [
        { id: 'total', label: 'العدد الإجمالي للشركات', icon: '📊' },
        { id: 'types', label: 'التوزيع محلية/جهوية', icon: '🏛️' },
        { id: 'sectors', label: 'التوزيع حسب القطاعات', icon: '📈' },
        { id: 'top_activities', label: 'أهم الأنشطة', icon: '⭐' },
        { id: 'rank', label: 'الترتيب الوطني', icon: '🏆' }
    ];

    const toggleParam = (paramId) => {
        if (selectedParams.includes(paramId)) {
            onParamsChange(selectedParams.filter(p => p !== paramId));
        } else {
            onParamsChange([...selectedParams, paramId]);
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200" dir="rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-3 text-right">
                اختر معايير المقارنة
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableParams.map(param => (
                    <label
                        key={param.id}
                        className={`
              flex items-center gap-2 p-3 bg-white
              rounded-lg border-2 cursor-pointer
              hover:border-blue-400 transition-colors
              ${selectedParams.includes(param.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200'
                            }
            `}
                    >
                        <input
                            type="checkbox"
                            checked={selectedParams.includes(param.id)}
                            onChange={() => toggleParam(param.id)}
                            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                        />
                        <span className="text-xl">{param.icon}</span>
                        <span className="text-sm font-semibold text-gray-900 text-right flex-1">
                            {param.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default ComparisonParametersFilter;
