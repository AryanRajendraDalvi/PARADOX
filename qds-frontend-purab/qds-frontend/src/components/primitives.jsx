/* ============================================================
   Small shared display primitives: phase badge, verdict chip,
   status badge, flag badge, field readout, panel chrome.
   ============================================================ */

import { AnimatePresence, motion } from 'framer-motion'
import { flagLabel, phaseMeta } from '../lib/protocol.js'

/* ---- Phase badge (brief §4) ----
   The pill morphs between hues and a sheen sweeps across on change.
   layoutId is keyed per-instance so several badges can coexist. */
export function PhaseBadge({ phase, size = 'md' }) {
  const { hue, label } = phaseMeta(phase)
  return (
    <motion.div
      className="phase"
      style={{ '--ph': hue, padding: size === 'sm' ? '3px 9px 3px 8px' : undefined }}
      animate={{ '--ph': hue }}
      transition={{ duration: 0.45 }}
    >
      <motion.span
        className="phase__bg"
        key={`bg-${phase}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <AnimatePresence>
        <motion.span
          className="phase__sheen"
          key={`sheen-${phase}`}
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      </AnimatePresence>
      <span className="phase__dot" />
      <span className="phase__tx" style={{ fontSize: size === 'sm' ? 9 : undefined }}>
        {label}
      </span>
    </motion.div>
  )
}

/* ---- Verdict chip: green ACCEPT / red REJECT (plan §5.2) ---- */
export function VerdictChip({ verdict, size = 'md' }) {
  const ok = verdict === 'ACCEPT'
  const color = verdict ? (ok ? 'var(--emerald)' : 'var(--red)') : 'var(--tx-dim)'
  return (
    <motion.span
      className="verdict"
      style={{ '--vc': color, fontSize: size === 'sm' ? 9 : undefined }}
      key={verdict}
      initial={{ scale: 0.86, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
    >
      {ok ? <CheckIcon size={9} /> : verdict ? <XIcon size={9} /> : null}
      {verdict || 'IDLE'}
    </motion.span>
  )
}

/* ---- Status badge. Hardcoded PROVISIONAL upstream (plan §4 note):
   rendered honestly as a pending state, with no transition logic
   built on top of it. When the backend wires the confirmation
   sweep, this component starts reflecting it with no changes. ---- */
export function StatusBadge({ status }) {
  return (
    <span className="statusb" title="Backend hardcodes this to PROVISIONAL in the current build">
      <span className="statusb__ring" />
      {status || 'PROVISIONAL'}
    </span>
  )
}

/* ---- Flag badges. Empty array renders nothing, not a placeholder
   (plan §5.2). ---- */
export function FlagBadges({ flags, max }) {
  if (!flags || flags.length === 0) return null
  const shown = max ? flags.slice(0, max) : flags
  const rest = max ? flags.length - shown.length : 0
  return (
    <>
      {shown.map((f) => (
        <motion.span
          className="flag"
          key={f}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          title={f}
        >
          {flagLabel(f)}
        </motion.span>
      ))}
      {rest > 0 && <span className="flag">+{rest}</span>}
    </>
  )
}

/* ---- Field readout row with its JSON binding shown as a caption.
   Keeping the binding visible is deliberate: this is an engineering
   console and the field path is the fastest way to reconcile the UI
   against the contract while debugging a live run. ---- */
export function Field({ label, path, value, mono = true, color, nullish }) {
  const isNull = nullish ?? (value === null || value === undefined || value === '—')
  return (
    <div className="field">
      <div>
        <div className="label">{label}</div>
        {path && <div className="jsonpath">{path}</div>}
      </div>
      <motion.div
        className={mono ? 'field__v' : 'field__v'}
        data-null={isNull}
        style={color ? { color } : undefined}
        key={String(value)}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isNull ? '—' : String(value)}
      </motion.div>
    </div>
  )
}

export function Panel({ accent, id, title, desc, right, children, className = '', style }) {
  return (
    <section
      className={`panel ${className}`}
      style={{ '--accent': accent, ...style }}
    >
      <header className="phead">
        {id && <div className="phead__id">{id}</div>}
        <div style={{ minWidth: 0 }}>
          <div className="phead__t">{title}</div>
          {desc && <div className="phead__d">{desc}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {right}
      </header>
      {children}
    </section>
  )
}

export function SectionLabel({ children }) {
  return (
    <div className="sect">
      <span className="label">{children}</span>
    </div>
  )
}

/* ---- icons (inline, no dependency) ---- */

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8.5l3.2 3.2L13 5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function XIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function LockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.4 7V5.2a2.6 2.6 0 015.2 0V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function BoltIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9 1.5L4 9h3l-.6 5.5L12 7H9l0-5.5z"
        fill="currentColor"
      />
    </svg>
  )
}

export function QdsMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="4.4" fill="var(--cyan)" opacity="0.9" />
      <ellipse cx="16" cy="16" rx="14" ry="6" stroke="var(--cyan)" strokeWidth="1.3" opacity="0.55" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="6"
        stroke="var(--violet)"
        strokeWidth="1.3"
        opacity="0.55"
        transform="rotate(60 16 16)"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="6"
        stroke="var(--alice)"
        strokeWidth="1.3"
        opacity="0.55"
        transform="rotate(120 16 16)"
      />
    </svg>
  )
}
