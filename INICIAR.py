"""Alternativa sem Node: python INICIAR.py e abra http://localhost:8000."""
import http.server
import os
import pathlib
os.chdir(pathlib.Path(__file__).parent / 'dist')
print('AERION em http://localhost:8000 — pressione Ctrl+C para encerrar.')
http.server.test(HandlerClass=http.server.SimpleHTTPRequestHandler, port=8000)
