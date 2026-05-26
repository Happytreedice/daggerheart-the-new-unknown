param(
  [string] $Module = ".",
  [string] $FoundryCliVersion = "3.0.3",
  [switch] $SkipPacks,
  [switch] $SkipZip,
  [switch] $SkipRelease,
  [string] $GitHubToken = $env:GITHUB_TOKEN
)

$ErrorActionPreference = "Stop"

function Resolve-FullPath {
  param([string] $Path)
  return [System.IO.Path]::GetFullPath((Resolve-Path $Path).Path)
}

function Assert-ChildPath {
  param(
    [string] $BasePath,
    [string] $TargetPath
  )

  $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
  $target = [System.IO.Path]::GetFullPath($TargetPath)
  $prefix = $base + [System.IO.Path]::DirectorySeparatorChar

  if (-not ($target.Equals($base, [System.StringComparison]::OrdinalIgnoreCase) -or $target.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase))) {
    throw "Refusing to touch path outside ${base}: ${target}"
  }
}

function Write-JsonFile {
  param(
    [string] $Path,
    [object] $Value
  )

  $json = $Value | ConvertTo-Json -Depth 100
  [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}

function Get-GitHubRepository {
  param([object] $Manifest)

  if ($Manifest.url -match "github\.com/([^/]+/[^/]+)") {
    return $Matches[1].TrimEnd("/")
  }

  $knownRepositories = @{
    "daggerheart-mass-heart" = "Happytreedice/daggerheart-mass-heart"
    "daggerheart-the-new-unknown" = "Happytreedice/daggerheart-the-new-unknown"
  }

  if ($knownRepositories.ContainsKey($Manifest.id)) {
    return $knownRepositories[$Manifest.id]
  }

  throw "Cannot determine GitHub repository for module '$($Manifest.id)'. Set the manifest 'url' field."
}

function Invoke-FvttPack {
  param(
    [string] $ModuleRoot,
    [object] $Manifest,
    [object] $Pack
  )

  if ($Pack.path -match "\.db($|[\\/])") {
    throw "Pack path '$($Pack.path)' contains '.db'. Rename the pack directory and module.json path first."
  }

  $packName = Split-Path $Pack.path -Leaf
  $packRoot = Join-Path $ModuleRoot "packs"
  $outputPath = Join-Path $ModuleRoot $Pack.path
  $sourcePath = Join-Path $ModuleRoot (Join-Path "src/packs" $packName)

  Assert-ChildPath -BasePath $packRoot -TargetPath $outputPath
  Assert-ChildPath -BasePath (Join-Path $ModuleRoot "src/packs") -TargetPath $sourcePath

  if (-not (Test-Path $sourcePath -PathType Container)) {
    throw "Missing source directory for '$packName': $sourcePath"
  }

  if (Test-Path $outputPath) {
    Remove-Item -LiteralPath $outputPath -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $packRoot | Out-Null
  Write-Host "Packing $packName -> $($Pack.path)"

  $fvttArgs = @(
    "--yes",
    "@foundryvtt/foundryvtt-cli@$FoundryCliVersion",
    "package",
    "pack",
    "--type",
    "Module",
    "--id",
    $Manifest.id,
    "--compendiumName",
    $packName,
    "--compendiumType",
    $Pack.type,
    "--inputDirectory",
    $sourcePath,
    "--outputDirectory",
    $packRoot
  )

  & npx @fvttArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Foundry CLI failed while packing '$packName'."
  }
}

function Copy-RuntimeEntry {
  param(
    [string] $ModuleRoot,
    [string] $StageRoot,
    [string] $Entry
  )

  $source = Join-Path $ModuleRoot $Entry
  if (-not (Test-Path $source)) {
    throw "Runtime entry is missing: $source"
  }

  $destination = Join-Path $StageRoot $Entry
  New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
}

function Publish-GitHubRelease {
  param(
    [string] $Repository,
    [string] $Tag,
    [string] $Version,
    [string] $Token,
    [string[]] $AssetPaths
  )

  if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "GITHUB_TOKEN is required to publish a GitHub release."
  }

  $headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent" = "daggerheart-foundry-release"
  }

  $releaseUri = "https://api.github.com/repos/$Repository/releases/tags/$Tag"
  try {
    $release = Invoke-RestMethod -Method Get -Uri $releaseUri -Headers $headers
  } catch {
    $createBody = @{
      tag_name = $Tag
      name = $Tag
      body = "Release $Version"
      draft = $false
      prerelease = $false
    } | ConvertTo-Json

    $release = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$Repository/releases" -Headers $headers -Body $createBody -ContentType "application/json"
  }

  $assets = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$Repository/releases/$($release.id)/assets" -Headers $headers
  foreach ($assetPath in $AssetPaths) {
    $assetName = Split-Path $assetPath -Leaf
    foreach ($asset in @($assets | Where-Object { $_.name -eq $assetName })) {
      Invoke-RestMethod -Method Delete -Uri $asset.url -Headers $headers | Out-Null
    }

    $uploadBase = $release.upload_url -replace "\{\?name,label\}$", ""
    $uploadUri = $uploadBase + "?name=" + [System.Uri]::EscapeDataString($assetName)
    Write-Host "Uploading $assetName to $Repository $Tag"
    Invoke-RestMethod -Method Post -Uri $uploadUri -Headers $headers -ContentType "application/octet-stream" -InFile $assetPath | Out-Null
  }
}

$moduleRoot = Resolve-FullPath $Module
$manifestPath = Join-Path $moduleRoot "module.json"
if (-not (Test-Path $manifestPath -PathType Leaf)) {
  throw "module.json was not found in $moduleRoot"
}

$manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
$repository = Get-GitHubRepository -Manifest $manifest
$tag = "v$($manifest.version)"

foreach ($language in $manifest.languages) {
  if ($language.lang -eq "ru") {
    $language.name = "Russian"
  }
}

$manifest.manifest = "https://github.com/$repository/releases/latest/download/module.json"
$manifest.download = "https://github.com/$repository/releases/download/$tag/$($manifest.id).zip"
Write-JsonFile -Path $manifestPath -Value $manifest

if (-not $SkipPacks) {
  foreach ($pack in $manifest.packs) {
    Invoke-FvttPack -ModuleRoot $moduleRoot -Manifest $manifest -Pack $pack
  }
}

$zipPath = $null
if (-not $SkipZip) {
  $distRoot = Join-Path $moduleRoot "dist"
  $stageRoot = Join-Path $distRoot "stage"
  $moduleStageRoot = Join-Path $stageRoot $manifest.id
  $zipPath = Join-Path $distRoot "$($manifest.id).zip"

  if (Test-Path $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $moduleStageRoot | Out-Null

  foreach ($entry in @("module.json", "readme.md", "lang", "src/module", "packs")) {
    Copy-RuntimeEntry -ModuleRoot $moduleRoot -StageRoot $moduleStageRoot -Entry $entry
  }

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path $moduleStageRoot -DestinationPath $zipPath -Force
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
  Write-Host "Created $zipPath"
}

if (-not $SkipRelease) {
  if ($null -eq $zipPath) {
    $zipPath = Join-Path (Join-Path $moduleRoot "dist") "$($manifest.id).zip"
  }
  Publish-GitHubRelease -Repository $repository -Tag $tag -Version $manifest.version -Token $GitHubToken -AssetPaths @($manifestPath, $zipPath)
}
