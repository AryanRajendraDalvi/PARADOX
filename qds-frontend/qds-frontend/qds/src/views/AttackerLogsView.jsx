import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PanelHeader from '../components/PanelHeader.jsx';
import CyberDeckControls from '../components/CyberDeckControls.jsx';
import EventLogStream from '../components/EventLogStream.jsx';
import SecurityLedger from '../components/SecurityLedger.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';

export default function AttackerLogsView({ frame, history, connection, sendCommand }) {
  const attackActive = frame?.attack?.active ?? false;

  const handleTrigger = (attackId) => {
    sendCommand({ command: 'START', attack: attackId });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 relative">
      <AnimatePresence>
        {attackActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 top-0 h-1.5 z-50 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, #DC2626, transparent)',
              boxShadow: 'none'
            }}
          >
            <motion.div
              className="w-full h-full"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PanelHeader
        title="Attacker & Logs"
        subtitle="Attack console, security ledger, and the full event feed"
        frame={frame}
        connection={connection}
      />

      <div className="mb-6">
        <CyberDeckControls activeAttack={frame?.attack?.type ?? 'none'} onTrigger={handleTrigger} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <SecurityLedger frame={frame} />
        <NetworkTopology frame={frame} compact />
      </div>

      <EventLogStream history={history} />
    </div>
  );
}
