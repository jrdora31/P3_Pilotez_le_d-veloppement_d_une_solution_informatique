param(
  [string]$ApiUrl = "http://localhost:3000",
  [string]$OutputPath = "docs/LIVRABLES/quality-maintenance/evidence/perf-upload-$(Get-Date -Format 'yyyy-MM-dd').json"
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$tempDir = Join-Path $workspaceRoot ".tmp/perf"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$cases = @(
  [PSCustomObject]@{ Label = "100 Ko"; Bytes = 100KB; FileName = "perf-upload-100kb.bin" },
  [PSCustomObject]@{ Label = "5 Mo"; Bytes = 5MB; FileName = "perf-upload-5mb.bin" },
  [PSCustomObject]@{ Label = "50 Mo"; Bytes = 50MB; FileName = "perf-upload-50mb.bin" }
)

$results = foreach ($case in $cases) {
  $filePath = Join-Path $tempDir $case.FileName
  $stream = [System.IO.File]::Create($filePath)

  try {
    $stream.SetLength($case.Bytes)
  } finally {
    $stream.Dispose()
  }

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  $response = Invoke-WebRequest -Uri "$ApiUrl/files" -Method Post -Form @{
    file = Get-Item $filePath
    expirationDays = "7"
  }
  $stopwatch.Stop()

  $body = $response.Content | ConvertFrom-Json

  [PSCustomObject]@{
    sizeLabel = $case.Label
    sizeBytes = $case.Bytes
    status = $response.StatusCode
    durationMs = [Math]::Round($stopwatch.Elapsed.TotalMilliseconds, 2)
    token = $body.shareLink.token
    shareUrl = $body.shareLink.url
  }
}

$resolvedOutputPath = Join-Path $workspaceRoot $OutputPath
New-Item -ItemType Directory -Path (Split-Path $resolvedOutputPath) -Force | Out-Null
$results | ConvertTo-Json -Depth 5 | Set-Content -Path $resolvedOutputPath -Encoding UTF8

$results | Format-Table -AutoSize
Write-Output "Results written to $resolvedOutputPath"
