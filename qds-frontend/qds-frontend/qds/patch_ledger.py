import re

with open('src/components/SecurityLedger.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = """  const macTag = frame?.auth?.mac_tag ?? null;
  const isRogueVerifier = frame?.event_flags?.includes('unauthorized_verifier_detected') ?? false;
  const macVerified = (frame?.auth?.mac_verified ?? true) && !isRogueVerifier;"""
text = text.replace("  const macTag = frame?.auth?.mac_tag ?? null;\n  const macVerified = frame?.auth?.mac_verified ?? true;", replacement)

with open('src/components/SecurityLedger.jsx', 'w', encoding='utf-8') as f:
    f.write(text)