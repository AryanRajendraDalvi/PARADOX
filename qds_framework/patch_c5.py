import re

with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('mac_key_ab_ = WegmanCarter::generate_key(42);', 'mac_key_ab_ = WegmanCarter::generate_key(42);\n    mac_key_ac_ = WegmanCarter::generate_key(43);')

match_mac = re.search(r'// Compute MAC for transcript', text)
if match_mac:
    replacement = """// Compute Verifier MAC (Charlie's share)
        WegmanCarter::Bytes verifier_msg = WegmanCarter::build_mac_message(round_id_, charlie_out, charlie_out, ""); // Reusing build_mac_message for simplicity
        WegmanCarter::Tag charlie_mac = WegmanCarter::mac(verifier_msg, mac_key_ac_);
        bool charlie_mac_verified = WegmanCarter::verify(verifier_msg, charlie_mac, mac_key_ac_);

        if (cfg_.attack_active && cfg_.attack_type == "rogue_verifier") {
            // Hijack the verifier's transmission with a garbage key
            WegmanCarter::Key garbage_key = WegmanCarter::generate_key(rng_());
            charlie_mac = WegmanCarter::mac(verifier_msg, garbage_key);
            charlie_mac_verified = WegmanCarter::verify(verifier_msg, charlie_mac, mac_key_ac_); // Will fail
        }
        acc.verifier_mac_verified = charlie_mac_verified;

        // Compute MAC for transcript
"""
    text = text[:match_mac.start()] + replacement + text[match_mac.end():]

# For impersonate:
text = text.replace('if (cfg_.attack_active && cfg_.attack_type == "macForge") {\n            mac_verified = false;\n        }', 'if (cfg_.attack_active && cfg_.attack_type == "macForge") {\n            // Modify payload bits\n            msg[0] ^= 0xFF;\n            mac_verified = WegmanCarter::verify(msg, mac_tag, mac_key_ab_);\n        }\n        if (cfg_.attack_active && cfg_.attack_type == "impersonate") {\n            // Use unauthorized key to generate the MAC\n            WegmanCarter::Key unauthorized_key = WegmanCarter::generate_key(rng_());\n            mac_tag = WegmanCarter::mac(msg, unauthorized_key);\n            mac_verified = WegmanCarter::verify(msg, mac_tag, mac_key_ab_);\n        }')

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)