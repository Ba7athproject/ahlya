import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TypesComparisonChart = ({ wilayas }) => {
    const data = {
        labels: wilayas.map(w => w.wilaya),
        datasets: [
            {
                label: 'محلية',
                data: wilayas.map(w => w.types ? w.types['محلية'] || 0 : 0),
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // Bleu
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            },
            {
                label: 'جهوية',
                data: wilayas.map(w => w.types ? w.types['جهوية'] || 0 : 0),
                backgroundColor: 'rgba(16, 185, 129, 0.7)', // Vert
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#1f2937', // text-gray-900
                    font: { size: 14, family: 'Cairo, sans-serif' }
                }
            },
            title: {
                display: true,
                text: 'التوزيع: شركات محلية مقابل جهوية',
                color: '#1f2937',
                font: { size: 16, weight: 'bold', family: 'Cairo, sans-serif' }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#4b5563', font: { family: 'Cairo, sans-serif' } },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: { color: '#4b5563', font: { family: 'Cairo, sans-serif' } },
                grid: { color: 'rgba(0,0,0,0.05)' }
            }
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-80">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default TypesComparisonChart;
