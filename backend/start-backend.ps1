$ErrorActionPreference = "Stop"

$port = 5000

try {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    Write-Host "Stopping process on port $port (PID $($listener.OwningProcess))..."
    Stop-Process -Id $listener.OwningProcess -Force
    Start-Sleep -Seconds 1
  }
} catch {
  Write-Host "No active listener found on port $port."
}

Write-Host "Starting backend..."
Set-Location -Path $PSScriptRoot
npm start
