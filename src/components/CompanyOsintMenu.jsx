import React, { useState, useRef, useEffect } from 'react';
import ManualEnrichmentWizard from './ManualEnrichmentWizard';
import EnrichedProfileModal from './EnrichedProfileModal';
import { checkEnrichmentStatus, getEnrichedProfile } from '../services/api';

const CompanyOsintMenu = ({ company }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isEnriched, setIsEnriched] = useState(false);
    const [enrichedProfile, setEnrichedProfile] = useState(null);
    const menuRef = useRef(null);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Check status when opening menu
            checkEnrichmentStatus(company.id).then(res => setIsEnriched(res?.is_enriched || false));
        }
    };

    const handleOpenProfile = async () => {
        const profile = await getEnrichedProfile(company.id);
        if (profile) {
            setEnrichedProfile(profile);
            setShowProfile(true);
            setIsOpen(false);
        }
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const osintLinks = [
        {
            id: 'rne',
            label: 'RNE -(بديل مجاني) السجل الوطني',
            icon: '🏢',
            url: `https://www.google.com/search?q=site:trovit.tn+"${encodeURIComponent(company.name)}"`,
            tooltip: 'البحث عن: رأس المال، المساهمون، الشكل القانوني'
        },
        {
            id: 'jort',
            label: 'JORT - الرائد الرسمي',
            icon: '📰',
            url: `https://www.google.com/search?q=site:iort.gov.tn+"${encodeURIComponent(company.name)}"`,
            tooltip: 'الإعلانات القانونية، التصفيات، التعديلات'
        },
        {
            id: 'tuneps',
            label: 'TUNEPS - صفقات عمومية',
            icon: '💰',
            url: `https://www.google.com/search?q=site:tuneps.tn+"${encodeURIComponent(company.name)}"`,
            tooltip: 'الصفقات، الاستشارات، المشتريات'
        },
        {
            id: 'google_general',
            label: 'بحث عام Google',
            icon: '🔍',
            url: `https://www.google.com/search?q="${encodeURIComponent(company.name)}"+${encodeURIComponent(company.wilaya || '')}`,
            tooltip: 'أخبار، مقالات، شكاوى'
        }
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                تدقيق OSINT
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-30 p-2 text-right">

                    {/* Enrichment Actions */}
                    <div className="mb-2 pb-2 border-b border-gray-100 space-y-1">
                        {!isEnriched ? (
                            <button
                                onClick={() => { setShowWizard(true); setIsOpen(false); }}
                                className="w-full flex items-center justify-between p-2 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                            >
                                <span className="text-xs font-bold">🔍 إثراء البيانات</span>
                                <span>+</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleOpenProfile}
                                className="w-full flex items-center justify-between p-2 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                                <span className="text-xs font-bold">� عرض الملف الكامل</span>
                                <span>👁️</span>
                            </button>
                        )}
                    </div>

                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 border-b border-gray-100 mb-1">
                        مصادر خارجية لـ: {company.name}
                    </div>
                    {osintLinks.map(link => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-md transition-colors group"
                            title={link.tooltip}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm group-hover:text-blue-600">{link.label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{link.tooltip}</div>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    ))}
                </div>
            )}

            <ManualEnrichmentWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                company={company}
            />

            <EnrichedProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                profile={enrichedProfile}
            />
        </div>
    );
};

export default CompanyOsintMenu;
