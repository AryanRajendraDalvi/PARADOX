import React from 'react';

const CONN_LABEL = {
  live: { text: 'LIVE STREAM', color: '#22C55E' },
  mock: { text: 'SIMULATED FEED', color: '#F59E0B' },
  connecting: { text: 'CONNECTING…', color: '#8ea0c9' }
};

const PHASE_LABEL = {
  signing: 'SIGNING',
  verification: 'CORRELATION VERIFY',
  mermin_test: 'MERMIN HARDWARE TEST'
};

export default function PanelHeader({ title, subtitle, frame, connection }) {
  const conn = CONN_LABEL[connection] ?? CONN_LABEL.connecting;
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 className=" text-2xl text-slate-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-[10px] tracking-wide text-slate-500">ROUND</div>
          <div className=" text-lg text-cyan mono-nums">
            {frame ? String(frame.round_id).padStart(4, '0') : '----'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-wide text-slate-500">PHASE</div>
          <div className=" text-xs text-slate-300">
            {frame ? PHASE_LABEL[frame.phase] ?? frame.phase : '—'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: conn.color, boxShadow: `0 0 6px ${conn.color}` }}
          />
          <span className="text-[10px] " style={{ color: conn.color }}>
            {conn.text}
          </span>
        </div>
      </div>
    </div>
  );
}
