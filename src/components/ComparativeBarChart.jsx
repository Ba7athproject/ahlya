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

const ComparativeBarChart = ({ wilayas }) => {
    const data = {
        labels: wilayas.map(w => w.wilaya),
        datasets: [
            {
                label: 'الموارد العمومية',
                data: wilayas.map(w => w.s1 * 100),
                backgroundColor: 'rgba(250, 204, 21, 0.7)', // yellow-400
                borderColor: 'rgba(250, 204, 21, 1)',
                borderWidth: 1
            },
            {
                label: 'التركيز القطاعي',
                data: wilayas.map(w => w.s2 * 100),
                backgroundColor: 'rgba(251, 146, 60, 0.7)', // orange-400
                borderColor: 'rgba(251, 146, 60, 1)',
                borderWidth: 1
            },
            {
                label: 'اختلال الحوكمة',
                data: wilayas.map(w => w.s3 * 100),
                backgroundColor: 'rgba(248, 113, 113, 0.7)', // red-400
                borderColor: 'rgba(248, 113, 113, 1)',
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
                    color: '#fff',
                    font: { size: 12, family: 'Cairo, sans-serif' }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#fff', font: { family: 'Cairo, sans-serif' } },
                grid: { color: 'rgba(255,255,255,0.1)' }
            },
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#fff',
                    callback: (value) => `${value}%`
                },
                grid: { color: 'rgba(255,255,255,0.1)' }
            }
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl p-6 mt-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 text-right">
                مقارنة المكونات الثلاثة
            </h3>
            <div className="h-80 md:h-96">
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default ComparativeBarChart;
