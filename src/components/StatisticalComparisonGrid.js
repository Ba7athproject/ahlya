import React, { useState, useEffect } from 'react';
import { fetchWilayaStats } from '../services/api';
import TypesComparisonChart from './TypesComparisonChart';
import SectorsComparisonChart from './SectorsComparisonChart';
import TopActivitiesComparison from './TopActivitiesComparison';
import RankComparison from './RankComparison';

const ComparisonTable = ({ title, data, renderRow }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        {data.map(w => (
                            <th key={w.wilaya} className="px-6 py-3 text-sm font-semibold text-gray-700">
                                {w.wilaya}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    <tr>
                        {data.map(w => (
                            <td key={w.wilaya} className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    {renderRow(w)}
                                </div>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

const StatisticalComparisonGrid = ({ wilayas, selectedParams, nationalStats }) => {
    const [wilayasData, setWilayasData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (wilayas.length === 0) {
            setWilayasData([]);
            return;
        }

        setLoading(true);
        Promise.all(
            wilayas.map(wilaya => fetchWilayaStats(wilaya)
                .then(data => ({ ...data, wilaya })) // Ensure wilaya name is attached
                .catch(err => {
                    console.error(`Failed to fetch stats for ${wilaya}`, err);
                    return { wilaya, count: 0, error: true };
                })
            )
        )
            .then(data => {
                // Normalize data
                const normalizedData = data.map(w => {
                    const count = w.count !== undefined ? w.count : (w.total || w.total_companies || 0);
                    const totalNational = nationalStats?.total || 1;
                    const share = w.national_share !== undefined ? w.national_share : ((count / totalNational) * 100);

                    // If types are missing, try to infer or default
                    const types = w.types || w.types_breakdown || { "محلية": 0, "جهوية": 0 };

                    // If groups is missing but top_groups exists
                    const groups = w.groups || w.top_groups || {};

                    // If top_activities missing but top_groups exists, map it
                    let topActivities = w.top_activities;
                    if (!topActivities && w.top_groups) {
                        topActivities = Object.entries(w.top_groups).map(([name, val]) => ({ name, count: val }));
                        topActivities.sort((a, b) => b.count - a.count);
                    }

                    // Calculate rank if missing
                    let rank = w.rank;
                    if (!rank && nationalStats?.wilayas) {
                        const sortedNames = Object.entries(nationalStats.wilayas).sort((a, b) => b[1] - a[1]).map(([name]) => name);
                        rank = sortedNames.indexOf(w.wilaya) + 1;
                    }

                    return {
                        ...w,
                        total: count,
                        national_share: share,
                        types,
                        groups,
                        top_activities: topActivities || [],
                        rank: rank || '-'
                    };
                });
                setWilayasData(normalizedData);
                setLoading(false);
            });
    }, [wilayas, nationalStats]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500">جاري تحميل البيانات الإحصائية...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* 1. Tableau de comparaison globale */}
            {selectedParams.includes('total') && (
                <ComparisonTable
                    title="العدد الإجمالي للشركات"
                    data={wilayasData}
                    renderRow={(w) => (
                        <>
                            <span className="font-bold text-3xl text-blue-600 block mb-2">{w.total || w.total_companies || 0}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                                {(w.national_share || 0).toFixed(1)}% من الإجمالي الوطني
                            </span>
                        </>
                    )}
                />
            )}

            {/* 2. Comparaison محلية/جهوية */}
            {selectedParams.includes('types') && (
                <TypesComparisonChart wilayas={wilayasData} />
            )}

            {/* 3. Distribution par secteurs */}
            {selectedParams.includes('sectors') && (
                <SectorsComparisonChart wilayas={wilayasData} />
            )}

            {/* 4. Top activités */}
            {selectedParams.includes('top_activities') && (
                <TopActivitiesComparison wilayas={wilayasData} />
            )}

            {/* 5. Classement */}
            {selectedParams.includes('rank') && (
                <RankComparison wilayas={wilayasData} />
            )}
        </div>
    );
};

export default StatisticalComparisonGrid;
