@echo off
title Sistema Efata Delivery - Launcher
color 0B
cls

echo.
echo  ##################################################################
echo  #                                                                #
echo  #                 SISTEMA EFATA DELIVERY v2.0                    #
echo  #           Controle de Vendas, Estoque e Chatbot IA             #
echo  #                                                                #
echo  ##################################################################
echo.

:: 1. Limpando processos antigos
echo  [1/3] Liberando portas e limpando processos...
taskkill /f /im node.exe >nul 2>&1
echo  --- Portas liberadas com sucesso!
echo.

:: 2. Verificando dependencias
echo  [2/3] Validando ambiente de execucao...

if not exist "node_modules" (
    echo  --- Instalando pacotes na raiz...
    call npm install
)

if not exist "backend\node_modules" (
    echo  --- Instalando dependencias do Backend...
    cd backend && call npm install && cd ..
)

if not exist "painel\node_modules" (
    echo  --- Instalando dependencias do Painel...
    cd painel && call npm install && cd ..
)

if not exist "app-cliente\node_modules" (
    echo  --- Instalando dependencias do App Cliente...
    cd app-cliente && call npm install && cd ..
)

echo  --- Dependencias verificadas com sucesso!
echo.

:: 3. Iniciando o sistema completo
echo  [3/3] Iniciando modulos do sistema...
echo.
echo  --------------------------------------------------
echo   MODULO             URL DE ACESSO
echo  --------------------------------------------------
echo   Painel Admin       http://localhost:5174 (PRINCIPAL)
echo   App do Cliente     http://localhost:5173
echo   Backend API        http://localhost:3001
echo  --------------------------------------------------
echo.
echo  Iniciando servidores (isso pode demorar alguns segundos).
echo  Pressione CTRL+C para encerrar todos os servicos.
echo.

call npm start

pause


