@echo off
cd /d "%~dp0"
echo Starting local preview at http://127.0.0.1:4175/
python -m http.server 4175 --bind 127.0.0.1
pause