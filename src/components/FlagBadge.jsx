import React from 'react';

const FlagBadge = ({ flag }) => {
    const flagStyles = {
        RESOURCE_DEPENDENT: {
            gradient: 'from-yellow-400 to-orange-500',
            icon: '🏛️',
            ring: 'ring-yellow-400/50'
        },
        ULTRA_CONCENTRATION: {
            gradient: 'from-orange-400 to-red-500',
            icon: '📊',
            ring: 'ring-orange-400/50'
        },
        GOVERNANCE_IMBALANCE: {
            gradient: 'from-red-400 to-purple-500',
            icon: '⚖️',
            ring: 'ring-red-400/50'
        }
    };

    const style = flagStyles[flag.code] || {
        gradient: 'from-gray-400 to-gray-500',
        icon: '⚠️',
        ring: 'ring-gray-400/50'
    };

    return (
        <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full
      bg-gradient-to-r ${style.gradient}
      text-white font-semibold text-sm shadow-lg
      ring-2 ${style.ring}
      hover:scale-105 transition-transform duration-200
      cursor-pointer
    `}>
            <span className="text-lg">{style.icon}</span>
            <span className="text-right">{flag.label_ar}</span>
        </div>
    );
};

export default FlagBadge;
