import re

with open('server/index.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_old = """    if (msg.command === 'START') {
      if (identity.account_type !== 'admin') return;"""

start_new = """    if (msg.command === 'START') {
      console.log('Received START command:', msg.attack);
      if (identity.account_type !== 'admin') {
          console.log('Not admin, ignoring');
          return;
      }"""

text = text.replace(start_old, start_new)

with open('server/index.js', 'w', encoding='utf-8') as f:
    f.write(text)