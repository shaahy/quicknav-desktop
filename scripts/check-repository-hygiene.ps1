[CmdletBinding()]
param(
  [int]$LargeFileThresholdMiB = 50
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$rootGitDirectory = Join-Path $repositoryRoot '.git'
$tutorialRoot = Join-Path $repositoryRoot 'A 教程集合'
$problems = [System.Collections.Generic.List[string]]::new()

Write-Host "Repository: $repositoryRoot"

$nestedGitDirectories = @(
  Get-ChildItem -LiteralPath $repositoryRoot -Recurse -Force -Directory -Filter '.git' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -ne $rootGitDirectory }
)

if ($nestedGitDirectories.Count -gt 0) {
  foreach ($directory in $nestedGitDirectories) {
    $problems.Add("Nested Git repository: $($directory.FullName)")
  }
} else {
  Write-Host '[PASS] No nested Git repositories.'
}

$edgeProfiles = @()
if (Test-Path -LiteralPath $tutorialRoot -PathType Container) {
  $edgeProfiles = @(
    Get-ChildItem -LiteralPath $tutorialRoot -Recurse -Force -Directory -ErrorAction SilentlyContinue |
      Where-Object {
        ($_.Name -like 'edge-qa-*' -or $_.Name -like '.edge-qa-*') -and
        (Test-Path -LiteralPath (Join-Path $_.FullName 'Local State') -PathType Leaf)
      }
  )
}

if ($edgeProfiles.Count -gt 0) {
  foreach ($directory in $edgeProfiles) {
    $problems.Add("Edge QA profile: $($directory.FullName)")
  }
} else {
  Write-Host '[PASS] No Edge QA browser profiles.'
}

$thresholdBytes = [int64]$LargeFileThresholdMiB * 1MB
$largeFiles = @(
  git -C $repositoryRoot -c core.quotePath=false ls-files --cached --others --exclude-standard |
    ForEach-Object {
      $path = Join-Path $repositoryRoot $_
      if (Test-Path -LiteralPath $path -PathType Leaf) {
        Get-Item -LiteralPath $path
      }
    } |
    Where-Object { $_.Length -ge $thresholdBytes }
)

if ($largeFiles.Count -gt 0) {
  foreach ($file in $largeFiles) {
    $sizeMiB = [Math]::Round($file.Length / 1MB, 2)
    $problems.Add("Large file ($sizeMiB MiB): $($file.FullName)")
  }
} else {
  Write-Host "[PASS] No candidate files at or above $LargeFileThresholdMiB MiB."
}

if ($problems.Count -gt 0) {
  Write-Host ''
  Write-Host 'Repository hygiene check failed:' -ForegroundColor Red
  foreach ($problem in $problems) {
    Write-Host "- $problem" -ForegroundColor Red
  }
  exit 1
}

Write-Host '[PASS] Repository hygiene check passed.' -ForegroundColor Green
exit 0
