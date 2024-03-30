@echo off
python -m venv venv
call venv\Scripts\activate.bat
pip install -q --no-input --force-reinstall -r requirements.txt