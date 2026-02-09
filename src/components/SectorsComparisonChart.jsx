import React from 'react';
import { Bar } from 'react-chartjs-2';

const SectorsComparisonChart = ({ wilayas }) => {
    // Extraire tous les groupes d'activités uniques
    const allGroups = [...new Set(
        wilayas.flatMap(w => Object.keys(w.groups || {}))
    )];

    const groupColors = {
        'AGRI_NATUREL': '#10b981',      // Vert
        'ENVIRONNEMENT': '#3b82f6',     // Bleu
        'TRANSPORT': '#f59e0b',         // Orange
        'ENERGIE_MINES': '#ef4444',     // Rouge
        'INDUSTRIE': '#8b5cf6',         // Violet
        'SERVICES_COM': '#6366f1',      // Indigo
        'LOISIRS_TOURISME': '#ec4899',  // Pink
        'AUTRES': '#6b7280'             // Gris
    };

    const getLabel = (code) => {
        // You might want to import GROUP_LABELS from App.js or define it here/utils
        // For now, simple replacement
        return code.replace('_', ' ');
    }

    const data = {
        labels: wilayas.map(w => w.wilaya),
        datasets: allGroups.map(group => ({
            label: getLabel(group),
            data: wilayas.map(w => (w.groups ? w.groups[group] || 0 : 0)),
            backgroundColor: groupColors[group] || '#6b7280',
            borderWidth: 1
        }))
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#1f2937', font: { size: 12, family: 'Cairo, sans-serif' } }
            },
            title: {
                display: true,
                text: 'التوزيع حسب مجموعات الأنشطة',
                color: '#1f2937',
                font: { size: 16, weight: 'bold', family: 'Cairo, sans-serif' }
            }
        },
        scales: {
            x: { ticks: { color: '#4b5563', font: { family: 'Cairo, sans-serif' } }, grid: { display: false } },
            y: {
                beginAtZero: true,
                ticks: { color: '#4b5563', font: { family: 'Cairo, sans-serif' } },
                grid: { color: 'rgba(0,0,0,0.05)' }
            }
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-96">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default SectorsComparisonChart;
