# ============================================
# Project Initialization Script
# ============================================

Write-Host "Initializing project structure..." -ForegroundColor Cyan

# Root folders
$folders = @(
    ".claude",
    ".git",
    "architecture",
    "assets",
    "decisions",
    "docs",
    "scripts",
    "specs",
    "src",
    "tasks",
    "tests"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created folder: $folder"
    } else {
        Write-Host "Folder already exists: $folder" -ForegroundColor Yellow
    }
}

# Root files
$files = @{
    ".gitignore" = @"
# Node
node_modules/

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
"@

    "README.md" = @"
# Project

## Description
Describe your project here.

## Setup
Instructions...

## Usage
How to use...
"@

    "CHANGELOG.md" = @"
# Changelog

## [Unreleased]
- Initial setup
"@

    "CLAUDE.md" = @"
# Claude Instructions

## Project Context
Describe what this project does.

## Rules
- Keep structure clean
- Only modify necessary files
- Prefer simple solutions
"@

    "manifest.json" = @"
{
  ""name"": ""project-name"",
  ""version"": ""0.1.0"",
  ""description"": """",
  ""main"": ""index.js""
}
"@

    "settings.json" = @"
{
  ""env"": ""dev"",
  ""debug"": true
}
"@
}

foreach ($file in $files.Keys) {
    if (!(Test-Path $file)) {
        $files[$file] | Out-File -Encoding UTF8 $file
        Write-Host "Created file: $file"
    } else {
        Write-Host "File already exists: $file" -ForegroundColor Yellow
    }
}

# tasks bootstrap
if (!(Test-Path "tasks/current-task.md")) {
    @"
# Current Task

## Goal
Describe the current goal.

## Steps
- [ ] Step 1
- [ ] Step 2
"@ | Out-File -Encoding UTF8 "tasks/current-task.md"

    Write-Host "Created tasks/current-task.md"
}

# Optional: Git init (only if not exists)
if (!(Test-Path ".git\HEAD")) {
    Write-Host "Initializing Git repository..."
    git init | Out-Null
}

Write-Host "Project initialization complete." -ForegroundColor Green