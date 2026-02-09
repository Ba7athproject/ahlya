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

// Register ChartJS components if not already registered globally or in App.js
// It's safe to register again.
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const MiniRadarChart = ({ s1, s2, s3 }) => {
    const data = {
        labels: ['موارد', 'تركيز', 'حوكمة'],
        datasets: [{
            data: [s1 * 100, s2 * 100, s3 * 100],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 3
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
            r: {
                angleLines: { color: 'rgba(255,255,255,0.1)' },
                grid: { color: 'rgba(255,255,255,0.1)' },
                pointLabels: {
                    color: '#9ca3af',
                    font: { size: 9, family: 'Cairo, sans-serif' }
                },
                ticks: { display: false },
                min: 0,
                max: 100
            }
        }
    };

    return (
        <div className="h-32 w-full flex justify-center">
            <Radar data={data} options={options} />
        </div>
    );
};

export default MiniRadarChart;
