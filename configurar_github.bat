@echo off
setlocal EnableDelayedExpansion
set URL=https://github.com/JosimarRiskoski/appcrmigreja.git

echo ==========================================
echo CONFIGURANDO GITHUB (origin: %URL%)
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

echo Inicializando repositorio...
"%GIT_CMD%" init

echo Renomeando branch para main...
"%GIT_CMD%" branch -M main

echo Configurando remoto origin...
"%GIT_CMD%" remote remove origin >nul 2>&1
"%GIT_CMD%" remote add origin %URL%

echo.
echo Pronto. Agora execute 'salvar_no_github.bat' para enviar os arquivos.
pause
