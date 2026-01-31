
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
  // Always use light theme styling as requested
  const isDark = false; 

  if (data.length === 0) {
    return (
      <div className={`h-64 flex flex-col items-center justify-center rounded-[3rem] bg-white/50 border-2 border-dashed border-black/5 text-[#124559]/30`}>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] font-outfit">Awaiting Reflection</p>
      </div>
    );
  }

  const chartData = data.slice(-7).map(entry => ({
    ...entry,
    displayDate: entry.date ? new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' }) : ''
  }));

  return (
    <div className={`w-full h-[22rem] p-10 rounded-[3.5rem] bg-white border border-black/[0.03] shadow-lg shadow-black/[0.02] relative overflow-hidden`}>
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#598392]/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
      
      <div className="flex justify-between items-center mb-12">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 font-outfit text-black">Weekly Rhythm</h3>
        <div className="flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-[#598392]"></div>
           <div className="w-2 h-2 rounded-full bg-[#598392]/10"></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -35, bottom: 0 }}>
          <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0, 0, 0, 0.04)" />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#124559', fontSize: 11, fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#124559', fontSize: 11, fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }} 
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              border: '1px solid rgba(0,0,0,0.05)', 
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
              fontSize: '11px',
              color: '#01161e',
              fontWeight: '900',
              padding: '16px 24px',
              fontFamily: 'Plus Jakarta Sans'
            }}
          />
          <Bar dataKey="count" radius={[14, 14, 8, 8]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === chartData.length - 1 ? '#7af0bb' : '#124559'} 
                className="transition-all duration-700 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
