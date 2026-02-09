import React, { useState, useEffect } from 'react';
import { fetchAllWilayasRisk } from '../services/api';

const WilayaMultiSelector = ({ selected, onAdd, onRemove, maxSelection }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allWilayas, setAllWilayas] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Determine api base url, assuming standard dev setup or use api service
        // Here we use the service instead of fetch directly to be cleaner
        setLoading(true);
        fetchAllWilayasRisk()
            .then(data => {
                setAllWilayas(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load wilayas list", err);
                setLoading(false);
            });
    }, []);

    const filteredWilayas = allWilayas.filter(w =>
        w.wilaya.includes(searchTerm) && !selected.includes(w.wilaya)
    );

    return (
        <div className="space-y-4" dir="rtl">
            {/* Chips des wilayas sélectionnées */}
            <div className="flex flex-wrap gap-2">
                {selected.map(wilaya => (
                    <div
                        key={wilaya}
                        className="
              flex items-center gap-2 px-3 py-1.5
              bg-blue-600 text-white rounded-full
              text-sm font-semibold shadow-sm
            "
                    >
                        <span>{wilaya}</span>
                        <button
                            onClick={() => onRemove(wilaya)}
                            className="hover:text-red-200 text-lg leading-none px-1"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Dropdown d'ajout */}
            {selected.length < maxSelection && (
                <div className="relative">
                    <input
                        type="text"
                        placeholder={loading ? "جاري التحميل..." : "ابحث عن ولاية لإضافتها..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                        // onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click
                        disabled={loading}
                        className="
              w-full px-4 py-3 bg-gray-800 text-white rounded-lg
              border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              text-right placeholder-gray-500 outline-none transition-all
            "
                    />

                    {isDropdownOpen && searchTerm && (
                        <div className="
              absolute top-full left-0 right-0 mt-2
              bg-gray-800 border border-gray-700 rounded-lg
              max-h-64 overflow-y-auto shadow-xl z-20
            ">
                            {filteredWilayas.map(wilaya => (
                                <button
                                    key={wilaya.wilaya}
                                    onClick={() => {
                                        onAdd(wilaya.wilaya);
                                        setSearchTerm('');
                                        setIsDropdownOpen(false);
                                    }}
                                    className="
                    w-full px-4 py-3 text-right hover:bg-gray-700
                    text-white border-b border-gray-700 last:border-0
                    transition-colors
                  "
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400 font-mono">
                                            {wilaya.baath_index.toFixed(1)}
                                        </span>
                                        <span className="font-semibold">{wilaya.wilaya}</span>
                                    </div>
                                </button>
                            ))}
                            {filteredWilayas.length === 0 && (
                                <div className="px-4 py-3 text-gray-500 text-center">
                                    لا توجد نتائج
                                </div>
                            )}
                        </div>
                    )}

                    {isDropdownOpen && !searchTerm && (
                        <div
                            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg max-h-64 overflow-y-auto shadow-xl z-20 cursor-pointer"
                            onClick={() => setIsDropdownOpen(false)}
                        >
                            <div className="px-4 py-3 text-gray-500 text-center text-sm">
                                ابدأ الكتابة للبحث...
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selected.length >= maxSelection && (
                <p className="text-yellow-500 text-sm text-right flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    الحد الأقصى {maxSelection} ولايات للمقارنة
                </p>
            )}
        </div>
        // Backdrop to close dropdown
        // {isDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>}
    );
};

export default WilayaMultiSelector;
