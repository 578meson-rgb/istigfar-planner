
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LogEntry } from '../types';

interface HistoryChartProps {
  data: LogEntry[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  const isDark = document.documentElement.classList.contains('dark');

  if (data.length === 0) {
    return (
      <div className={`h-72 flex flex-col items-center justify-center rounded-[3rem] glass border-dashed 
        ${isDark ? 'text-stone-700' : 'text-stone-300'}`}>
        <div className="w-16 h-16 rounded-full glass mb-6 flex items-center justify-center cinzel text-3xl font-black">?</div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Chronicles Found</p>
      </div>
    );
  }

  const chartData = data.slice(-7).map(entry => ({
    ...entry,
    displayDate: new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })
  }));

  return (
    <div className={`w-full h-[22rem] p-10 rounded-[3rem] glass shadow-2xl transition-all duration-700`}>
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Spiritual Fluctuations</h3>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Active Week</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"} />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: isDark ? '#34d399' : '#94a3b8', fontSize: 10, fontWeight: 800 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: isDark ? '#34d399' : '#94a3b8', fontSize: 10, fontWeight: 800 }} 
          />
          <Tooltip 
            cursor={{ fill: isDark ? 'rgba(52, 211, 153, 0.05)' : 'rgba(0,0,0,0.02)' }}
            contentStyle={{ 
              backgroundColor: isDark ? '#064e3b' : '#ffffff', 
              borderRadius: '24px', 
              border: 'none', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              fontSize: '12px',
              color: isDark ? '#ecfdf5' : '#1e293b',
              fontWeight: '900',
              padding: '16px 24px'
            }}
          />
          <Bar dataKey="count" radius={[14, 14, 6, 6]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === chartData.length - 1 ? '#10b981' : (isDark ? '#065f46' : '#d1fae5')} 
                className="transition-all duration-1000"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
