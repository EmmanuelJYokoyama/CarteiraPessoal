@echo off
REM Script para testar permissões do CarteiraPessoal (Windows)
REM Uso: test_permissions.bat [grant|revoke|check|all]

setlocal enabledelayedexpansion

set PACKAGE_NAME=com.carteirapessoal

REM Cores (usando números para echo)
REM Nota: Cores limitadas no CMD, use o '>nul' para sucesso

echo.
echo ========================================
echo    Teste de Permissoes - CarteiraPessoal
echo ========================================
echo.

if "%1"=="" (
    call :show_help
    exit /b 0
)

if "%1"=="grant" (
    call :grant_permissions
    exit /b 0
)

if "%1"=="revoke" (
    call :revoke_permissions
    exit /b 0
)

if "%1"=="check" (
    call :check_permissions
    exit /b 0
)

if "%1"=="logs" (
    call :show_logs
    exit /b 0
)

if "%1"=="all" (
    call :run_all_tests
    exit /b 0
)

call :show_help
exit /b 0

REM ============================================
REM Subrotinas
REM ============================================

:grant_permissions
echo [+] Concedendo todas as permissoes...
adb shell pm grant %PACKAGE_NAME% android.permission.ACCESS_FINE_LOCATION
adb shell pm grant %PACKAGE_NAME% android.permission.ACCESS_COARSE_LOCATION
adb shell pm grant %PACKAGE_NAME% android.permission.SEND_SMS
adb shell pm grant %PACKAGE_NAME% android.permission.READ_SMS
adb shell pm grant %PACKAGE_NAME% android.permission.RECEIVE_SMS
adb shell pm grant %PACKAGE_NAME% android.permission.READ_CONTACTS
adb shell pm grant %PACKAGE_NAME% android.permission.CAMERA
echo [+] Permissoes concedidas com sucesso!
echo.
call :check_permissions
exit /b 0

:revoke_permissions
echo [-] Revogando todas as permissoes...
adb shell pm revoke %PACKAGE_NAME% android.permission.ACCESS_FINE_LOCATION
adb shell pm revoke %PACKAGE_NAME% android.permission.ACCESS_COARSE_LOCATION
adb shell pm revoke %PACKAGE_NAME% android.permission.SEND_SMS
adb shell pm revoke %PACKAGE_NAME% android.permission.READ_SMS
adb shell pm revoke %PACKAGE_NAME% android.permission.RECEIVE_SMS
adb shell pm revoke %PACKAGE_NAME% android.permission.READ_CONTACTS
adb shell pm revoke %PACKAGE_NAME% android.permission.CAMERA
echo [-] Permissoes revogadas com sucesso!
echo.
call :check_permissions
exit /b 0

:check_permissions
echo [?] Status das Permissoes:
echo.

adb shell pm dump %PACKAGE_NAME% | find "ACCESS_FINE_LOCATION" | find "granted" >nul 2>&1
if %errorlevel%==0 (
    echo [+] Localizacao: CONCEDIDA
) else (
    echo [-] Localizacao: NEGADA
)

adb shell pm dump %PACKAGE_NAME% | find "SEND_SMS" | find "granted" >nul 2>&1
if %errorlevel%==0 (
    echo [+] SMS: CONCEDIDA
) else (
    echo [-] SMS: NEGADA
)

adb shell pm dump %PACKAGE_NAME% | find "CAMERA" | find "granted" >nul 2>&1
if %errorlevel%==0 (
    echo [+] Camera: CONCEDIDA
) else (
    echo [-] Camera: NEGADA
)
echo.
exit /b 0

:show_logs
echo [*] Mostrando logs de permissoes (Ctrl+C para parar)...
echo.
adb logcat | findstr /i "permission"
exit /b 0

:run_all_tests
echo [*] Iniciando teste completo...
echo.

echo 1. Estado inicial:
call :check_permissions

echo 2. Concedendo todas as permissoes...
call :grant_permissions

echo 3. Estado apos conceder:
call :check_permissions

echo 4. Revogando todas as permissoes...
call :revoke_permissions

echo 5. Estado apos revogar:
call :check_permissions

echo [+] Teste completo finalizado!
exit /b 0

:show_help
echo Uso: test_permissions.bat [comando]
echo.
echo Comandos disponiveis:
echo   grant   - Conceder todas as permissoes
echo   revoke  - Revogar todas as permissoes
echo   check   - Verificar status das permissoes
echo   logs    - Ver logs de permissoes em tempo real
echo   all     - Executar teste completo
echo.
echo Exemplos:
echo   test_permissions.bat grant
echo   test_permissions.bat check
echo   test_permissions.bat all
echo.
exit /b 0
