
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NetworkSummary } from '../types';

interface StatsDashboardProps {
  summary: NetworkSummary;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Metrics */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 flex flex-col justify-center">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Network Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-400">{summary.totalConnections}</p>
            <p className="text-slate-500 text-sm">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-emerald-400">{summary.totalCompanies}</p>
            <p className="text-slate-500 text-sm">Companies</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 h-64">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Top 5 Companies</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.topCompanies.slice(0, 5)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ color: '#60a5fa' }}
              cursor={{ fill: '#0f172a' }} 
            />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsDashboard;
