import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon }) => {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
    </div>
  );
};