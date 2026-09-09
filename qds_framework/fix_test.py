import re

with open('tests/test_all.cpp', 'r') as f:
    text = f.read()

text = re.sub(
    r'string transcript_str_r1 = [^\n]*\n\s*WegmanCarter::Bytes msg_r1 = WegmanCarter::to_bytes\(transcript_str_r1\);',
    'WegmanCarter::Bytes msg_r1 = WegmanCarter::build_mac_message(1, m1, m2, correction_label);',
    text
)

text = re.sub(
    r'string transcript_str_r500 = [^\n]*\n\s*WegmanCarter::Bytes msg_r500 = WegmanCarter::to_bytes\(transcript_str_r500\);',
    'WegmanCarter::Bytes msg_r500 = WegmanCarter::build_mac_message(500, m1, m2, correction_label);',
    text
)

with open('tests/test_all.cpp', 'w') as f:
    f.write(text)