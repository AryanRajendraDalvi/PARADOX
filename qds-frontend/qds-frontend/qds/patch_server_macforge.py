import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

macforge_regex = r"          \} else if \(targetMsg\.valid_mac !== targetMsg\.charlie_mac\) \{\n             targetMsg\.verification_failed = true;\n             targetMsg\.failure_type = 'broken-seal';\n             targetMsg\.failure_reason = 'MAC VERIFICATION FAILURE';"
macforge_replacement = """          } else if (targetMsg.valid_mac !== targetMsg.charlie_mac) {
             targetMsg.verification_failed = true;
             targetMsg.failure_type = 'broken-seal';
             targetMsg.failure_reason = 'MAC VERIFICATION FAILURE';
             targetMsg.locked = false; // content is fine, seal is broken"""
text = re.sub(macforge_regex, macforge_replacement, text)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)