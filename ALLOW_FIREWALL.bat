@echo off
title YoYo Voice - Open Port 5000 in Windows Firewall
echo ==========================================================
echo  YoYo Voice: Firewall Configuration for Port 5000
echo ==========================================================

:: Check for administrative rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges to add firewall rule...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo.
echo [1/2] Removing old rule if exists...
netsh advfirewall firewall delete rule name="YoYo Backend Port 5000" >nul 2>&1

echo [2/2] Adding Inbound TCP rule for Port 5000 (Profile: Any - Home, Office, Hotspot)...
netsh advfirewall firewall add rule name="YoYo Backend Port 5000" dir=in action=allow protocol=TCP localport=5000 profile=any

echo.
echo ==========================================================
echo  SUCCESS! Port 5000 is now permanently allowed on all networks.
echo  Expo Go and mobile devices can now connect smoothly!
echo ==========================================================
echo.
pause
