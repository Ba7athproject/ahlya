import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const SubScoresRadar = ({ s1, s2, s3 }) => {
    const data = {
        labels: [
            'الاعتماد على الموارد العمومية',
            'التركيز القطاعي',
            'اختلال الحوكمة'
        ],
        datasets: [{
            label: 'النتيجة الجزئية',
            data: [s1 * 100, s2 * 100, s3 * 100],
            backgroundColor: 'rgba(59, 130, 246, 0.2)', // Tailwind blue-500 opacity 20%
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
        }]
    };

    const options = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: {
                    color: '#fff',
                    font: { size: 12, family: 'Cairo, sans-serif' }
                },
                ticks: {
                    backdropColor: 'transparent',
                    color: '#9ca3af',
                    stepSize: 25,
                    font: { size: 10 }
                },
                min: 0,
                max: 100
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed.r.toFixed(1)}%`
                }
            }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="w-full h-64 md:h-80 mx-auto relative">
            <Radar data={data} options={options} />
            <div className="mt-2 text-xs text-slate-400 text-center">
                <p>نتائج جزئية (0-100): كلما ارتفعت، زاد المؤشر المركّب</p>
            </div>
        </div>
    );
};

export default SubScoresRadar;
