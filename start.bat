@echo off
echo Iniciando API (Backend)...
:: Navega a la carpeta 'backend' y ejecuta dotnet
start "Backend API" cmd /k "cd backend && dotnet run --project Todomotriz.Api.csproj"

echo Iniciando Frontend...
:: Navega a la carpeta 'frontend', instala y ejecuta npm
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo Procesos iniciados en ventanas separadas.