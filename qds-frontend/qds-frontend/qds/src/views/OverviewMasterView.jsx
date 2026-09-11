import React from 'react';
import { motion } from 'framer-motion';
import PanelHeader from '../components/PanelHeader.jsx';
import ArcGauge from '../components/ArcGauge.jsx';
import MerminGauge from '../components/MerminGauge.jsx';
import NetworkTopology from '../components/NetworkTopology.jsx';
import CyberDeckControls from '../components/CyberDeckControls.jsx';
import SecurityLedger from '../components/SecurityLedger.jsx';
import EventLogStream from '../components/EventLogStream.jsx';

function QuadrantCard({ title, children }) {
  return (
    <div className="rounded-lg border border-white/5 bg-surface/50 p-4 flex flex-col h-full">
      <div className="text-xs tracking-wide text-slate-500 mb-3">{title}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function OverviewMasterView({ frame, history, connection, sendCommand }) {
  const alice = frame?.parties?.alice;
  const bob = frame?.parties?.bob;
  const charlie = frame?.parties?.charlie;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <PanelHeader title="Mission Control" subtitle="4-quadrant NOC — all parties, all channels" frame={frame} connection={connection} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quadrant 1: Parties snapshot */}
        <QuadrantCard title="PARTIES — ALICE / BOB / CHARLIE">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-white/5 p-3">
              <div className="text-[10px] text-slate-500 mb-1">ALICE</div>
              <div className=" text-xs text-cyan mb-1">{alice?.basis ?? '—'}</div>
              <div className="flex gap-1">
                {(alice?.outcome_bits ?? []).map((b, i) => (
                  <span key={i} className=" text-lg text-slate-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-white/5 p-3">
              <div className="text-[10px] text-slate-500 mb-1">BOB</div>
              <div className=" text-xs text-amber mb-1">
                {bob?.correction_applied ?? 'I'}
              </div>
              <div className=" text-lg text-slate-200">{bob?.outcome ?? '—'}</div>
            </div>
            <div className="rounded-md border border-white/5 p-3">
              <div className="text-[10px] text-slate-500 mb-1">CHARLIE</div>
              <div className=" text-xs text-violet mb-1">{charlie?.basis ?? '—'}</div>
              <div className=" text-lg text-slate-200">{charlie?.outcome ?? '—'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <ArcGauge
              label="Decoy QBER"
              value={frame?.checks?.decoy_qber ?? 0}
              threshold={frame?.checks?.tau_hoeffding ?? 0.061}
              domainMax={0.18}
            />
            <MerminGauge value={frame?.checks?.mermin_value ?? null} attack={frame?.attack?.type} />
          </div>
        </QuadrantCard>

        {/* Quadrant 2: Network topology */}
        <QuadrantCard title="QUANTUM / CLASSICAL CHANNEL">
            <NetworkTopology frame={frame} compact />
            
            <div className="mt-4 p-3 rounded-lg border border-white/5 bg-black/40">
              <div className="text-[10px] tracking-wide text-slate-500 mb-2 ">SIMULATION PERFORMANCE METRICS</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400">GHZ TELEPORTATION THROUGHPUT</span>
                  <span className=" text-cyan text-sm">{frame?.performance?.throughput_hz ? Math.round(frame.performance.throughput_hz).toLocaleString() : '---'} sigs/sec</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400">MEAN ROUND LATENCY</span>
                  <span className=" text-cyan text-sm">{frame?.performance?.latency_us ? frame.performance.latency_us.toFixed(2) : '---'} µs</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-slate-500 italic">
                * Note: Traditional BB84 QDS requires O(L) qubit transmissions at signing time, which severely bottlenecks throughput in physical fiber. This simulation pre-distributes GHZ entanglement, making the signing phase entirely classical.
              </div>
            </div>
          </QuadrantCard>

        {/* Quadrant 3: Attack console + ledger */}
        <QuadrantCard title="ATTACK CONSOLE & LEDGER">
          <div className="space-y-3">
            <CyberDeckControls
              activeAttack={frame?.attack?.type ?? 'none'}
              onTrigger={(id) => sendCommand({ command: 'START', attack: id })}
            />
            <SecurityLedger frame={frame} />
          </div>
        </QuadrantCard>

        {/* Quadrant 4: Log feed */}
        <QuadrantCard title="EVENT LOG">
          <EventLogStream history={history} />
        </QuadrantCard>
      </div>
    </div>
  );
}
