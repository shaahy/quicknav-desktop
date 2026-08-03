param(
  [string]$DataPath = (Join-Path $PSScriptRoot '..\app-data.json'),
  [string]$ReadmePath = (Join-Path $PSScriptRoot '..\README.md'),
  [switch]$Check
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$startMarker = '<!-- tutorial-catalog:start -->'
$endMarker = '<!-- tutorial-catalog:end -->'

function Escape-MarkdownLabel {
  param([AllowEmptyString()][string]$Text)

  return $Text.Replace('\', '\\').Replace('[', '\[').Replace(']', '\]')
}

function Get-OrderedCards {
  param(
    [object[]]$Cards,
    [string[]]$PreferredIds,
    [string[]]$FallbackIds
  )

  $cardsById = @{}
  foreach ($card in $Cards) {
    $cardsById[[string]$card.id] = $card
  }

  $ordered = @()
  $seen = @{}
  foreach ($id in @($PreferredIds) + @($FallbackIds)) {
    $key = [string]$id
    if ($cardsById.ContainsKey($key) -and -not $seen.ContainsKey($key)) {
      $ordered += $cardsById[$key]
      $seen[$key] = $true
    }
  }

  foreach ($card in ($Cards | Sort-Object name)) {
    $key = [string]$card.id
    if (-not $seen.ContainsKey($key)) {
      $ordered += $card
      $seen[$key] = $true
    }
  }

  return $ordered
}

$dataFullPath = [IO.Path]::GetFullPath($DataPath)
$readmeFullPath = [IO.Path]::GetFullPath($ReadmePath)
$repositoryRoot = [IO.Path]::GetDirectoryName($readmeFullPath)
$dataDirectory = [IO.Path]::GetDirectoryName($dataFullPath)

if (-not (Test-Path -LiteralPath $dataFullPath -PathType Leaf)) {
  throw "找不到数据文件：$dataFullPath"
}

if (-not (Test-Path -LiteralPath $readmeFullPath -PathType Leaf)) {
  throw "找不到 README：$readmeFullPath"
}

$dataJson = [IO.File]::ReadAllText($dataFullPath, [Text.Encoding]::UTF8)
$data = $dataJson | ConvertFrom-Json
$readmeText = [IO.File]::ReadAllText($readmeFullPath)
$newline = if ($readmeText.Contains("`r`n")) { "`r`n" } else { "`n" }

$startIndex = $readmeText.IndexOf($startMarker, [StringComparison]::Ordinal)
$endIndex = $readmeText.IndexOf($endMarker, [StringComparison]::Ordinal)
if ($startIndex -lt 0 -or $endIndex -lt 0 -or $endIndex -lt $startIndex) {
  throw 'README 中缺少有效的教程目录生成标记。'
}

if ($readmeText.IndexOf($startMarker, $startIndex + $startMarker.Length, [StringComparison]::Ordinal) -ge 0 -or
    $readmeText.IndexOf($endMarker, $endIndex + $endMarker.Length, [StringComparison]::Ordinal) -ge 0) {
  throw 'README 中的教程目录生成标记必须各有且仅有一个。'
}

$cards = @($data.cards)
$categories = @($data.categories | Sort-Object order)
$viewOrders = @($data.viewOrders)
$allCardsView = $viewOrders | Where-Object { $_.viewType -eq 'allCards' } | Select-Object -First 1
$allCardIds = if ($null -eq $allCardsView) { @() } else { @($allCardsView.cardIds) }

$validCategoryIds = @{}
foreach ($category in $categories) {
  $validCategoryIds[[string]$category.id] = $true
}

$repositoryCardCount = 0
$externalCardCount = 0
$cardLocations = @{}
foreach ($card in $cards) {
  $relativePath = [string]$card.fileReference.relativePath
  $resolvedPath = if ([IO.Path]::IsPathRooted($relativePath)) {
    [IO.Path]::GetFullPath($relativePath)
  } else {
    [IO.Path]::GetFullPath((Join-Path $dataDirectory $relativePath))
  }

  $rootPrefix = $repositoryRoot.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
  $inRepository = $resolvedPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
  if ($inRepository -and -not (Test-Path -LiteralPath $resolvedPath -PathType Leaf)) {
    throw "仓库内卡片文件不存在：$($card.name) -> $relativePath"
  }

  if ($inRepository) {
    $repositoryCardCount++
  } else {
    $externalCardCount++
  }

  $cardLocations[[string]$card.id] = [pscustomobject]@{
    InRepository = $inRepository
    RelativePath = $relativePath.Replace('\', '/')
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add($startMarker)
$lines.Add('> 本节由 `app-data.json` 自动生成。请勿直接编辑标记之间的列表；更新卡片后运行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-readme-tutorial-catalog.ps1`。')
$lines.Add('')
$lines.Add("当前共 **$($cards.Count) 张卡片**、**$($categories.Count) 个分类**；其中 **$repositoryCardCount 项**随仓库同步，**$externalCardCount 项**属于本机或相邻工作区。一个卡片可以属于多个分类，因此会在不同分类中重复出现。")

foreach ($category in $categories) {
  $categoryId = [string]$category.id
  $categoryCards = @($cards | Where-Object { @($_.categoryIds) -contains $categoryId })
  $categoryView = $viewOrders | Where-Object { $_.viewType -eq "category:$categoryId" } | Select-Object -First 1
  $preferredIds = if ($null -eq $categoryView) { @() } else { @($categoryView.cardIds) }
  $orderedCards = Get-OrderedCards -Cards $categoryCards -PreferredIds $preferredIds -FallbackIds $allCardIds

  $lines.Add('')
  $lines.Add("### $($category.name)（$($orderedCards.Count)）")
  $lines.Add('')
  foreach ($card in $orderedCards) {
    $label = Escape-MarkdownLabel ([string]$card.name)
    $extension = ([string]$card.fileReference.extension).ToUpperInvariant()
    $location = $cardLocations[[string]$card.id]
    if ($location.InRepository) {
      $linkTarget = $location.RelativePath.Replace('>', '%3E')
      $lines.Add("- [$label](<$linkTarget>) · $extension")
    } else {
      $lines.Add("- $label · $extension · **本机/外部工作区资料，未随本仓库同步**")
    }
  }
}

$uncategorizedCards = @($cards | Where-Object {
  $hasKnownCategory = $false
  foreach ($categoryId in @($_.categoryIds)) {
    if ($validCategoryIds.ContainsKey([string]$categoryId)) {
      $hasKnownCategory = $true
      break
    }
  }
  -not $hasKnownCategory
})

if ($uncategorizedCards.Count -gt 0) {
  $orderedCards = Get-OrderedCards -Cards $uncategorizedCards -PreferredIds @() -FallbackIds $allCardIds
  $lines.Add('')
  $lines.Add("### 未分类（$($orderedCards.Count)）")
  $lines.Add('')
  foreach ($card in $orderedCards) {
    $label = Escape-MarkdownLabel ([string]$card.name)
    $extension = ([string]$card.fileReference.extension).ToUpperInvariant()
    $location = $cardLocations[[string]$card.id]
    if ($location.InRepository) {
      $linkTarget = $location.RelativePath.Replace('>', '%3E')
      $lines.Add("- [$label](<$linkTarget>) · $extension")
    } else {
      $lines.Add("- $label · $extension · **本机/外部工作区资料，未随本仓库同步**")
    }
  }
}

$lines.Add($endMarker)
$generatedBlock = [string]::Join($newline, $lines)
$afterMarkerIndex = $endIndex + $endMarker.Length
$updatedReadme = $readmeText.Substring(0, $startIndex) + $generatedBlock + $readmeText.Substring($afterMarkerIndex)

if ($Check) {
  if ($updatedReadme -ne $readmeText) {
    Write-Error 'README 教程目录与 app-data.json 不一致。请先运行目录更新脚本。'
    exit 1
  }

  Write-Output "[PASS] README 教程目录与 app-data.json 一致：$($cards.Count) 张卡片，$($categories.Count) 个分类。"
  exit 0
}

$utf8WithoutBom = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText($readmeFullPath, $updatedReadme, $utf8WithoutBom)
Write-Output "[DONE] 已更新 README 教程目录：$($cards.Count) 张卡片，$($categories.Count) 个分类。"
