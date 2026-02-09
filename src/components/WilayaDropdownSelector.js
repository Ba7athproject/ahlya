import React, { useState, useEffect } from 'react';
import { fetchNationalStats } from '../services/api';

const WilayaDropdownSelector = ({ selected, onSelectionChange, maxSelection = 4 }) => {
    const [allWilayas, setAllWilayas] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchNationalStats()
            .then(data => {
                // Extraire la liste des wilayas depuis data.wilayas
                // data.wilayas is object { "Tunis": 120, "Ariana": 50 ... }
                if (data && data.wilayas) {
                    const wilayasList = Object.keys(data.wilayas).map(name => ({
                        name,
                        count: data.wilayas[name]
                    }));
                    // Sort by count desc
                    wilayasList.sort((a, b) => b.count - a.count);
                    setAllWilayas(wilayasList);
                }
            })
            .catch(err => console.error("Failed to load wilayas", err));
    }, []);

    const toggleWilaya = (wilayaName) => {
        if (selected.includes(wilayaName)) {
            onSelectionChange(selected.filter(w => w !== wilayaName));
        } else if (selected.length < maxSelection) {
            onSelectionChange([...selected, wilayaName]);
        }
    };

    return (
        <div className="relative" dir="rtl">
            {/* Bouton dropdown */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
          w-full px-4 py-3 bg-white border-2 border-gray-300
          rounded-lg flex justify-between items-center
          hover:border-blue-500 transition-colors
        "
            >
                <span className="text-gray-900 font-semibold">
                    {selected.length === 0
                        ? 'اختر الولايات للمقارنة...'
                        : `${selected.length} ولايات محددة`
                    }
                </span>
                <svg
                    className={`w-5 h-5 transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Liste déroulante */}
            {isOpen && (
                <div className="
          absolute top-full left-0 right-0 mt-2
          bg-white border border-gray-300 rounded-lg
          shadow-xl max-h-80 overflow-y-auto z-20
        ">
                    {allWilayas.map(wilaya => {
                        const isSelected = selected.includes(wilaya.name);
                        const isDisabled = !isSelected && selected.length >= maxSelection;

                        return (
                            <label
                                key={wilaya.name}
                                className={`
                  flex items-center gap-3 px-4 py-3
                  hover:bg-gray-50 cursor-pointer
                  border-b border-gray-100 last:border-0
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onChange={() => toggleWilaya(wilaya.name)}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1 text-right flex justify-between items-center">
                                    <span className="font-semibold text-gray-900">
                                        {wilaya.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({wilaya.count} شركة)
                                    </span>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* Wilayas sélectionnées (affichage compact) */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {selected.map(wilaya => (
                        <span
                            key={wilaya}
                            className="
                inline-flex items-center gap-2
                px-3 py-1 bg-blue-100 text-blue-900
                rounded-full text-sm font-semibold
              "
                        >
                            {wilaya}
                            <button
                                onClick={() => toggleWilaya(wilaya)}
                                className="hover:text-red-600 text-lg leading-none"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

export default WilayaDropdownSelector;
