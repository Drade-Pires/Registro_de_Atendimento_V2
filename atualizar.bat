@echo off
cd /d "%~dp0"

echo Atualizando a aplicacao...
git pull

echo.
echo Atualizacao finalizada.
echo Seu banco local em data\atendimentos.db nao foi alterado pelo Git.
echo.
pause
