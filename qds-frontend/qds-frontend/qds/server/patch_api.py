import re

with open('index.js', 'r', encoding='utf-8') as f:
    text = f.read()

post_old = """  if (req.method === 'POST' && req.url === '/api/auth/login') {"""
post_new = """  console.log(req.method, req.url);
  if (req.method === 'POST' && req.url === '/api/auth/login') {"""

text = text.replace(post_old, post_new)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(text)