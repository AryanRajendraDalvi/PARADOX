import re

with open('index.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_old = """  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }"""

start_new = """  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
      console.log("Raw message from client:", msg);
    } catch {
      return;
    }"""

text = text.replace(start_old, start_new)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(text)