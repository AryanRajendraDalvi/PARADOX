import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Sub-component for individual charts
export function TimeSeriesChart({ data, dataKey, color, label, thresholdKey, thresholdColor, domain, formatPercent, theme }) {
  const chartData = useMemo(() => {
    // Only take the last 50 points to prevent squishing
    const recent = data.slice(-50);
    return recent.map((r, idx) => {
       const qber = r?.checks?.decoy_qber ?? 0;
       const tau_hoeffding = r?.checks?.tau_hoeffding ?? 0;
       const tau_cefb = r?.checks?.tau_cefb ?? 0;
       const mermin = r?.checks?.mermin_value ?? -999;
       return {
         time: r?.metrics?.total_rounds ?? idx,
         qber: qber * 100, // percentage
         hoeffding: tau_hoeffding * 100,
         cefb: tau_cefb * 100,
         mermin: mermin === -999 ? null : mermin // handle missing mermin
       };
    });
  }, [data]);

  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'; // slate-700 / slate-200

  const formatter = (value) => formatPercent ? `${value.toFixed(2)}%` : value.toFixed(2);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
            dataKey="time" 
            stroke={tickColor} 
            fontSize={10} 
            tickMargin={8} 
            tickFormatter={(val) => `#${val}`}
        />
        <YAxis 
            stroke={tickColor} 
            fontSize={10} 
            domain={domain}
            tickFormatter={formatter}
        />
        <Tooltip 
          contentStyle={{ 
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              color: theme === 'dark' ? '#f8fafc' : '#0f172a'
          }}
          formatter={(value, name) => [formatter(value), name === dataKey ? label : name]}
          labelFormatter={(label) => `Round ${label}`}
        />
        {thresholdKey && (
           <Line 
             type="stepAfter" 
             dataKey={thresholdKey} 
             stroke={thresholdColor} 
             strokeDasharray="4 4" 
             dot={false} 
             isAnimationActive={false}
             name={`${label} Threshold`}
           />
        )}
        <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
            name={label}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function LiveCharts({ history, theme }) {
  const chartConfig = [
    {
      title: 'Decoy QBER Over Time',
      dataKey: 'qber',
      thresholdKey: 'hoeffding',
      color: theme === 'dark' ? '#38bdf8' : '#0284c7', // light-blue / sky
      thresholdColor: theme === 'dark' ? '#fbbf24' : '#d97706', // amber
      domain: [0, 15],
      formatPercent: true
    },
    {
      title: 'CEFB Bound Over Time',
      dataKey: 'cefb',
      thresholdKey: null,
      color: theme === 'dark' ? '#a78bfa' : '#7c3aed', // purple
      thresholdColor: null,
      domain: [0, 20],
      formatPercent: true
    },
    {
      title: 'Mermin Value Over Time',
      dataKey: 'mermin',
      thresholdKey: null,
      color: theme === 'dark' ? '#34d399' : '#059669', // emerald
      thresholdColor: null,
      domain: [0, 3],
      formatPercent: false
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 shrink-0">
      {chartConfig.map((config, i) => (
        <div key={i} className={`h-64 rounded-xl border p-4 flex flex-col ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937] shadow-xl' : 'bg-white/90 backdrop-blur-md border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
          <h3 className={`text-xs font-semibold mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            {config.title}
          </h3>
          <div className="flex-1 w-full h-full min-h-0">
             <TimeSeriesChart 
               data={history}
               dataKey={config.dataKey}
               color={config.color}
               label={config.title.split(' ')[0]}
               thresholdKey={config.thresholdKey}
               thresholdColor={config.thresholdColor}
               domain={config.domain}
               formatPercent={config.formatPercent}
               theme={theme}
             />
          </div>
        </div>
      ))}
    </div>
  );
}
