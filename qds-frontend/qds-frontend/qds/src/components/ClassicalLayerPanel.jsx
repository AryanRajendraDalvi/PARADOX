import React from 'react';
import { AlertTriangle, Activity, ShieldAlert, Cpu } from 'lucide-react';

export default function ClassicalLayerPanel({ theme, classicalFlags = [], fpRate = 0, fnRate = 0, active = false }) {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-black border-orange-500/30' : 'bg-gray-50 border-gray-300';
  const textClass = isDark ? 'text-orange-500' : 'text-gray-800';
  const activeClass = isDark ? 'text-red-500 border-red-500/50' : 'text-red-600 border-red-500';
  const inactiveClass = isDark ? 'text-gray-600 border-gray-800' : 'text-gray-400 border-gray-200';

  const hasFlag = (flag) => classicalFlags.includes(flag);

  return (
    <div className={`p-4 border-2 rounded-xl h-full flex flex-col ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={` font-bold tracking-wider ${textClass} flex items-center gap-2`}>
          <ShieldAlert size={18} className={active ? 'text-red-500 animate-pulse' : ''} />
          CONTROL-PLANE HARDENING
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 border rounded flex flex-col items-center justify-center ${hasFlag('control_channel_burst') || hasFlag('automated_recon_suspected') ? activeClass : inactiveClass}`}>
          <Activity size={24} className="mb-2" />
          <span className="text-xs  text-center">ANOMALY / BURST</span>
        </div>
        <div className={`p-3 border rounded flex flex-col items-center justify-center ${hasFlag('control_replay_detected') ? activeClass : inactiveClass}`}>
          <Cpu size={24} className="mb-2" />
          <span className="text-xs  text-center">REPLAY GUARD</span>
        </div>
        <div className={`p-3 border rounded flex flex-col items-center justify-center col-span-2 ${hasFlag('brute_force_suspected') || hasFlag('premature_command') ? activeClass : inactiveClass}`}>
          <AlertTriangle size={24} className="mb-2" />
          <span className="text-xs  text-center">HANDSHAKE INTEGRITY</span>
        </div>
      </div>

      <div className={`mt-auto pt-4 border-t border-dashed ${isDark ? 'border-orange-500/30 text-orange-400/80' : 'border-gray-300 text-gray-600'} text-xs `}>
        <p className="mb-2 font-bold flex justify-between">
          <span>FP RATE: {(fpRate * 100).toFixed(1)}%</span>
          <span>FN RATE: {(fnRate * 100).toFixed(1)}%</span>
        </p>
        <p className="leading-relaxed">
          <strong className="block mb-1">Threat Model:</strong>
          Defends against LLM-accelerated phishing and automated reconnaissance targeting the classical basis-reconciliation and authentication channels.
        </p>
      </div>
    </div>
  );
}