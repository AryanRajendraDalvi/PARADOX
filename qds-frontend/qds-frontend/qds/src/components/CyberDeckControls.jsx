import React, { useState, useEffect, useRef } from 'react';
import { ThreatVectorHUD } from './ThreatVectorHUD';
import { motion } from 'framer-motion';

const BUTTONS = [
  { id: 'intercept', label: 'INTERCEPT', sub: 'eavesdrop tap', color: '#DC2626' },
  { id: 'entangle', label: 'ENTANGLE', sub: 'aux probe', color: '#6D28D9' },
  { id: 'replay', label: 'REPLAY', sub: 'phase buffer', color: '#F59E0B' },
  { id: 'batchNoise', label: 'BATCH NOISE', sub: 'thermal jitter', color: '#F59E0B' },
  { id: 'blind', label: 'BLIND', sub: 'receiver flare', color: '#8B5CF6' },
  { id: 'macForge', label: 'MAC FORGE', sub: 'auth breach', color: '#DC2626' },
  { id: 'impersonate', label: 'IMPERSONATE', sub: 'identity fraud', color: '#DC2626' },
  { id: 'rogue_verifier', label: 'ROGUE VERIFIER', sub: 'hijack verification', color: '#F59E0B' },
  { id: 'none', label: 'RESET', sub: 'clean channel', color: '#22C55E' }
];

/**
 * Tactile attack-trigger console. Each switch dispatches
 * {"command": "START", "attack": "<id>"} over the socket.
 */

export default function CyberDeckControls({ theme = 'dark', activeAttack, onTrigger }) {
  const [hudAttack, setHudAttack] = useState(null);
  const hudTimer = useRef(null);
  const [localAttack, setLocalAttack] = useState(activeAttack);

  useEffect(() => {
    setLocalAttack(activeAttack);
  }, [activeAttack]);

  const handleTrigger = (id) => {
    setLocalAttack(id);
    onTrigger(id);
  };

  return (
    <>
      <ThreatVectorHUD attackId={hudAttack} onClose={() => setHudAttack(null)} />
    <div className="w-full h-full flex flex-col justify-center">
      
      <div className="grid grid-cols-2 gap-4">
        {BUTTONS.map((btn) => {
          const isActive = localAttack === btn.id;
          return (
            <motion.button
              key={btn.id}
              onClick={() => handleTrigger(btn.id)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -1 }}
              className={`relative flex flex-col items-start gap-1 rounded-md border ${theme === 'dark' ? 'bg-[#111827] border-[#1F2937]' : 'bg-white border-[#E5E7EB]'} px-3 py-2.5 text-left transition-colors`}
              style={{
                borderLeft: isActive ? `4px solid ${btn.color}` : (theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB'),
                borderLeftWidth: isActive ? '4px' : '1px'
              }}
            >
              <span
                className="text-[11px]  tracking-wide"
                style={{ color: isActive ? btn.color : (theme === 'dark' ? '#c3cfe8' : '#475569') }}
              >
                {btn.label}
              </span>
              <span className="text-[9px] text-slate-500">{btn.sub}</span>
              {isActive && (
                <motion.span
                  layoutId="active-attack-dot"
                  className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                  style={{ background: btn.color, boxShadow: `0 0 6px ${btn.color}` }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              
              <div 
                onClick={(e) => { e.stopPropagation(); setHudAttack(btn.id); }}
                className="absolute top-2 right-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors hover:scale-110"
                style={{ 
                  border: `1px solid ${isActive ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')}`,
                  color: isActive ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                  background: 'transparent'
                }}
              >
                i
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
    </>
  );
}
