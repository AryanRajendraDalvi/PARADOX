import React from 'react';
import { motion } from 'framer-motion';

const BUTTONS = [
  { id: 'intercept', label: 'INTERCEPT', sub: 'eavesdrop tap', color: '#ff003c' },
  { id: 'entangle', label: 'ENTANGLE', sub: 'aux probe', color: '#9d00ff' },
  { id: 'replay', label: 'REPLAY', sub: 'phase buffer', color: '#ffb800' },
  { id: 'batchNoise', label: 'BATCH NOISE', sub: 'thermal jitter', color: '#ffb800' },
  { id: 'blind', label: 'BLIND', sub: 'receiver flare', color: '#00f3ff' },
  { id: 'macForge', label: 'MAC FORGE', sub: 'auth breach', color: '#ff003c' },
  { id: 'impersonate', label: 'IMPERSONATE', sub: 'identity fraud', color: '#ff003c' },
  { id: 'rogue_verifier', label: 'ROGUE VERIFIER', sub: 'hijack verification', color: '#ffb800' },
  { id: 'none', label: 'RESET', sub: 'clean channel', color: '#00ff66' }
];

/**
 * Tactile attack-trigger console. Each switch dispatches
 * {"command": "START", "attack": "<id>"} over the socket.
 */
import { useState, useEffect } from 'react';

export default function CyberDeckControls({ theme = 'dark', activeAttack, onTrigger }) {
  const [localAttack, setLocalAttack] = useState(activeAttack);

  useEffect(() => {
    setLocalAttack(activeAttack);
  }, [activeAttack]);

  const handleTrigger = (id) => {
    setLocalAttack(id);
    onTrigger(id);
  };

  return (
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
              className="relative flex flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left transition-colors"
              style={{
                borderColor: isActive ? btn.color : (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                background: isActive ? `${btn.color}1a` : 'transparent',
                boxShadow: isActive ? `0 0 16px ${btn.color}55` : 'none'
              }}
            >
              <span
                className="text-[11px] font-mono tracking-wide"
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
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
