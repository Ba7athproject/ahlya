import React from 'react';
import WilayaComparisonCard from './WilayaComparisonCard';

const ComparisonGrid = ({ wilayas, onRemove }) => {
    const gridCols = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }[wilayas.length] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    return (
        <div className={`grid ${gridCols} gap-6 mb-8`}>
            {wilayas.map(wilaya => (
                <WilayaComparisonCard
                    key={wilaya.wilaya}
                    data={wilaya}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

export default ComparisonGrid;
