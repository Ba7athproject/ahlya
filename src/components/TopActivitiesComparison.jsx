import React from 'react';

const TopActivitiesComparison = ({ wilayas }) => {
    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200" dir="rtl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-right">
                أهم 5 أنشطة في كل ولاية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {wilayas.map(wilaya => {
                    const activities = Array.isArray(wilaya.top_activities)
                        ? wilaya.top_activities
                        : Object.entries(wilaya.top_activities || {}).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

                    return (
                        <div key={wilaya.wilaya} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <h4 className="font-bold text-blue-600 mb-3 text-right border-b pb-2">
                                {wilaya.wilaya}
                            </h4>
                            <ol className="space-y-2 text-right">
                                {activities.length > 0 ? (
                                    activities.slice(0, 5).map((activity, idx) => (
                                        <li
                                            key={idx}
                                            className="flex justify-between items-center text-sm"
                                        >
                                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{activity.count}</span>
                                            <span className="text-gray-700 truncate ml-2" title={activity.name}>{activity.name}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-400 text-sm">لا توجد بيانات</li>
                                )}
                            </ol>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopActivitiesComparison;
