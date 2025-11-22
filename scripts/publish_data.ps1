$ErrorActionPreference = "Stop"

Write-Host "[publish_data] Extracting snippets"
cmd /c "npx tsx tools/extract_snippets.ts"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[publish_data] Validating snippets"
cmd /c "npx tsx tools/validate_snippets.ts"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[publish_data] Building vector index"
# Check if python is available, otherwise try .venv
if (Get-Command "python" -ErrorAction SilentlyContinue) {
    python tools/build_index.py
} elseif (Test-Path ".venv/Scripts/python.exe") {
    & ".venv/Scripts/python.exe" tools/build_index.py
} else {
    Write-Error "Python not found. Please activate your virtual environment or ensure python is in your PATH."
    exit 1
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[publish_data] Completed successfully"
