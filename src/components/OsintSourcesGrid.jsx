import React from 'react';
import sources from '../data/osintSources.json';

const OsintSourcesGrid = ({ wilaya }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                مصادر خارجية للتحقق من {wilaya}
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
                {sources.map(source => (
                    <a
                        key={source.id}
                        href={source.url_template.replace('{wilaya}', encodeURIComponent(wilaya))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-${source.color}-400 hover:shadow-md transition-all group`}
                    >
                        <span className="text-2xl">{source.icon}</span>
                        <div className="flex-1 text-right">
                            <h5 className="font-semibold text-gray-900 text-sm">{source.name}</h5>
                            <p className="text-xs text-gray-600">{source.description}</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 group-hover:text-${source.color}-600 transform rotate-180`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                ))}
            </div>

            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-right">
                <p className="text-xs text-amber-900 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span><strong>أسئلة للتحقيق:</strong> هل تتماشى الوعود بالتشغيل مع أرقام البطالة؟ هل الشركات الفلاحية تُسند أراضٍ دولية؟ ما هي الصفقات العمومية المُحصّلة؟</span>
                </p>
            </div>
        </div>
    );
};

export default OsintSourcesGrid;
