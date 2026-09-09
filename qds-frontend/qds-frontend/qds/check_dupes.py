import re

with open('src/components/ChatPanel.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# The bug happened because the replacement was applied MULTIPLE TIMES or something, causing duplicate text.
# Let's just fix it by replacing the whole component properly.

# Let's count how many times "Verification Failed: {msg.failure_reason" appears.
print("Count of msg.verification_failed blocks:", text.count("msg.verification_failed && (msg.failure_type ==="))

# I will just extract the whole ChatPanel.jsx up to the bad block, and reconstruct it.
# Actually, the duplicate is just inside the verifyPhase render block.