@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo ENVIANDO PARA GITHUB (push origin main)
echo ==========================================

rem Detecta git.exe em locais comuns
set GIT_CMD=
for %%P in ("%ProgramFiles%\Git\bin\git.exe" "%ProgramFiles%\Git\cmd\git.exe" "%ProgramFiles(x86)%\Git\bin\git.exe" "%LocalAppData%\Programs\Git\bin\git.exe" "%LocalAppData%\Programs\Git\cmd\git.exe") do (
  if exist %%~P (
    set GIT_CMD=%%~P
    goto :found
  )
)

:found
if not defined GIT_CMD (
  where git >nul 2>&1 && set GIT_CMD=git
)

if not defined GIT_CMD (
  echo [ERRO] Git nao encontrado. Adicione o Git ao PATH ou instale:
  echo   https://git-scm.com/download/win
  pause
  exit /b 1
)

echo Usando Git em: %GIT_CMD%

"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "Atualizacao automatica"
"%GIT_CMD%" push -u origin main

echo.
echo Concluido. Se aparecer "repository not found", crie o repo em:
echo   https://github.com/designeratrioz-del/appcrmigreja
echo ou verifique seu acesso/permissoes.
pause
