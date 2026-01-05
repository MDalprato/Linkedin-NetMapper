
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { NetworkSummary } from '../types';

interface StatsDashboardProps {
  summary: NetworkSummary;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatsDashboard: React.FC<StatsDashboardProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Metrics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Network Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{summary.totalConnections}</p>
            <p className="text-gray-500 text-sm">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{summary.totalCompanies}</p>
            <p className="text-gray-500 text-sm">Companies</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Top 5 Companies</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.topCompanies.slice(0, 5)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="count" fill="#0a66c2" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsDashboard;
