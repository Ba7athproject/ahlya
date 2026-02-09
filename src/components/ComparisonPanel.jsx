import React, { useState } from 'react';
import WilayaDropdownSelector from './WilayaDropdownSelector';
import ComparisonParametersFilter from './ComparisonParametersFilter';
import StatisticalComparisonGrid from './StatisticalComparisonGrid';
import { fetchNationalStats } from '../services/api';

const ComparisonPanel = ({ isOpen, selectedWilayas, onClose, onWilayaAdd, onWilayaRemove }) => {
    // We can manage selected wilayas here or accept props. 
    // The App.js manages selectedForComparison, but we need onWilayaAdd/Remove to update it.
    // The new Selector uses internal array logic for toggle, so we need to adapter.
    // Actually, App.js passes `selectedWilayas` and setters.
    // But WilayaDropdownSelector expects `onSelectionChange` which returns the full array.
    // So we need to adapt `onSelectionChange` to call onWilayaAdd/Remove or just update the state in parent.
    // App.js currently has onWilayaAdd(name) and onWilayaRemove(name).
    // Let's create a wrapper function.

    // Actually, to fully support the new Selector pattern (returning full array), 
    // we might want to change App.js/ComparisonPanel interface OR just wrap it here.
    // Let's wrap it to avoid changing App.js too much if possible, 
    // BUT the selector gives a full list. 
    // We can iterate the changes.

    const handleSelectionChange = (newList) => {
        // Find what was added
        newList.forEach(w => {
            if (!selectedWilayas.includes(w)) onWilayaAdd(w);
        });
        // Find what was removed
        selectedWilayas.forEach(w => {
            if (!newList.includes(w)) onWilayaRemove(w);
        });
    };

    const [selectedParams, setSelectedParams] = useState(['total', 'types', 'sectors']);
    const [nationalStats, setNationalStats] = useState(null);

    // Fetch national stats on mount to have context for shares/ranks
    // Note: WilayaDropdownSelector also fetches it, we could reuse or lift state up, 
    // but fetching here ensures Grid has it even if Selector implementation changes.
    // Given React 18+ automatic batching and browser caching, double fetch is low cost.
    React.useEffect(() => {
        fetchNationalStats().then(setNationalStats).catch(console.error);
    }, []);

    return (
        <div className={`
      fixed inset-0 bg-black/60 z-[5000] backdrop-blur-sm
      ${isOpen ? 'flex' : 'hidden'}
      items-center justify-center p-4
    `} dir="rtl">
            <div className="
        bg-white rounded-2xl shadow-2xl
        w-full max-w-7xl h-[90vh]
        overflow-hidden flex flex-col animate-fadeIn font-sans
      ">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center shadow-md shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span>📊</span>
                        مقارنة إحصائيات الولايات
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

                {/* Sélecteur + Filtres - Scrollable part starts below */}
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-6 bg-gray-50 border-b border-gray-200 space-y-4 shrink-0 relative z-20">
                        <WilayaDropdownSelector
                            selected={selectedWilayas}
                            onSelectionChange={handleSelectionChange}
                            maxSelection={4}
                        />

                        {selectedWilayas.length > 0 && (
                            <ComparisonParametersFilter
                                selectedParams={selectedParams}
                                onParamsChange={setSelectedParams}
                            />
                        )}
                    </div>

                    {/* Contenu comparaison */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
                        {selectedWilayas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <div className="text-6xl mb-4">👆</div>
                                <p className="text-xl font-medium">اختر ولايتين على الأقل للبدء في المقارنة</p>
                            </div>
                        ) : (
                            <StatisticalComparisonGrid
                                wilayas={selectedWilayas}
                                selectedParams={selectedParams}
                                nationalStats={nationalStats}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonPanel;
