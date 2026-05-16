@echo off
setlocal EnableDelayedExpansion
title Tech-Titan :: Verificacion del Sistema

echo.
echo  ████████╗███████╗ ██████╗██╗  ██╗    ████████╗██╗████████╗ █████╗ ███╗   ██╗
echo  ╚══██╔══╝██╔════╝██╔════╝██║  ██║    ╚══██╔══╝██║╚══██╔══╝██╔══██╗████╗  ██║
echo     ██║   █████╗  ██║     ███████║       ██║   ██║   ██║   ███████║██╔██╗ ██║
echo     ██║   ██╔══╝  ██║     ██╔══██║       ██║   ██║   ██║   ██╔══██║██║╚██╗██║
echo     ██║   ███████╗╚██████╗██║  ██║       ██║   ██║   ██║   ██║  ██║██║ ╚████║
echo     ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝       ╚═╝   ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝
echo.
echo  [ VERIFICACION DE SERVICIOS ] %DATE% %TIME%
echo  =========================================================================
echo.

set PASS=0
set FAIL=0

REM ── 1. PostgreSQL (puerto 5433) ──────────────────────────────────────────────
echo  [1/4] PostgreSQL (localhost:5433) ...
powershell -NoProfile -Command "try { $tcp = New-Object Net.Sockets.TcpClient; $tcp.Connect('localhost', 5433); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo       [OK]  PostgreSQL ACTIVO en puerto 5433
    set /a PASS+=1
) else (
    echo       [XX]  PostgreSQL NO RESPONDE en puerto 5433
    echo             Ejecuta: cd capa-datos ^&^& docker compose up -d postgres
    set /a FAIL+=1
)

REM ── 2. Redis (puerto 6379) ───────────────────────────────────────────────────
echo.
echo  [2/4] Redis (localhost:6379) ...
powershell -NoProfile -Command "try { $tcp = New-Object Net.Sockets.TcpClient; $tcp.Connect('localhost', 6379); $tcp.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo       [OK]  Redis ACTIVO en puerto 6379
    set /a PASS+=1
) else (
    echo       [XX]  Redis NO RESPONDE en puerto 6379
    echo             Ejecuta: cd capa-datos ^&^& docker compose up -d redis
    set /a FAIL+=1
)

REM ── 3. Backend MedusaJS (puerto 9000) ────────────────────────────────────────
echo.
echo  [3/4] Backend API (localhost:9000) ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:9000/health' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo       [OK]  Backend MedusaJS ACTIVO en puerto 9000
    set /a PASS+=1
) else (
    echo       [XX]  Backend NO RESPONDE en puerto 9000
    echo             Ejecuta: cd capa-negocio ^&^& npm run develop
    set /a FAIL+=1
)

REM ── 4. Frontend Next.js (puerto 3000) ────────────────────────────────────────
echo.
echo  [4/4] Frontend Next.js (localhost:3000) ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo       [OK]  Frontend Next.js ACTIVO en puerto 3000
    set /a PASS+=1
) else (
    echo       [XX]  Frontend NO RESPONDE en puerto 3000
    echo             Ejecuta: cd capa-presentacion ^&^& npm run dev
    set /a FAIL+=1
)

REM ── Resumen ──────────────────────────────────────────────────────────────────
echo.
echo  =========================================================================
echo  RESULTADO: !PASS!/4 servicios activos  ^|  !FAIL! caido(s)
echo  =========================================================================
echo.

if !FAIL!==0 (
    echo  SISTEMA LISTO - Todos los servicios operativos.
) else (
    echo  ACCION REQUERIDA - Revisar los servicios marcados con [XX].
    echo.
    echo  Orden de arranque recomendado:
    echo    1^) cd capa-datos   ^&^& docker compose up -d
    echo    2^) cd capa-negocio ^&^& npm run develop
    echo    3^) cd capa-presentacion ^&^& npm run dev
)
echo.
pause
endlocal
