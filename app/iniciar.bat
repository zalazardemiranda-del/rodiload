@echo off
title SERVIDOR CUBICADOR RODIPACK
echo Iniciando servidor local...
powershell -ExecutionPolicy Bypass -File "%~dp0servidor_rodipack.ps1"
pause
