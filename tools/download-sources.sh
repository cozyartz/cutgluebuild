#!/bin/bash

# Template Download Script - Downloads all verified legal sources
echo "🚀 Downloading legally compliant template sources..."

cd "/Users/cozart-lundin/code/cutgluebuild/sources"

# 3CatMax LaserFiles (CC0 - Public Domain)
echo "📦 Downloading 3CatMax LaserFiles (CC0 - Public Domain)..."
git clone https://github.com/3CatMax/LaserFiles.git 3catmax-laserfiles

# Boxes.py (GPL v3+) 
echo "📦 Downloading Boxes.py (GPL v3+)..."
git clone https://github.com/florianfesti/boxes.git boxes-py

# MeArm (CC Share-alike 3.0)
echo "📦 Downloading MeArm templates (CC Share-alike 3.0)..."
git clone https://github.com/MeArm/MeArm.git mearm-templates

# frank26080115 laser projects (Need to verify license)
echo "📦 Downloading frank26080115 laser projects..."
git clone https://github.com/frank26080115/my-laser-projects.git frank-laser-projects

echo "✅ Download complete! Organizing templates..."

# Copy files to organized structure
cd "/Users/cozart-lundin/code/cutgluebuild"

# Copy 3CatMax files (CC0)
echo "📋 Organizing 3CatMax templates..."
find sources/3catmax-laserfiles -name "*.svg" -exec cp {} templates/svg/ \;

# Generate box templates using boxes.py
echo "📋 Generating box templates..."
cd sources/boxes-py
python3 -m boxes.generators.Box 100 80 50 --output ../../templates/generated/box-100x80x50.svg
python3 -m boxes.generators.Box 200 150 100 --output ../../templates/generated/box-200x150x100.svg
python3 -m boxes.generators.FlexBox 150 100 75 --output ../../templates/generated/flexbox-150x100x75.svg
cd ../..

# Copy MeArm DXF files
echo "📋 Organizing MeArm robotics templates..."
find sources/mearm-templates -name "*.dxf" -exec cp {} templates/dxf/ \;

# Copy frank's laser project files
echo "📋 Organizing educational templates..."  
find sources/frank-laser-projects -name "*.svg" -exec cp {} templates/by-category/educational/ \;
find sources/frank-laser-projects -name "*.dxf" -exec cp {} templates/by-category/educational/ \;

echo "🎯 Template organization complete!"
echo "📊 Counting templates..."
echo "SVG files: $(find templates -name '*.svg' | wc -l)"
echo "DXF files: $(find templates -name '*.dxf' | wc -l)"
echo "Total templates: $(find templates -name '*.svg' -o -name '*.dxf' | wc -l)"
