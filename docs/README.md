# CutGlueBuild Template Collection

A legally compliant collection of open source templates for laser cutting, CNC routing, and Shaper Origin projects.

## 🔍 Legal Framework

This collection only includes templates with verified open source licenses that allow:
- ✅ Commercial use
- ✅ Modification and derivatives  
- ✅ Redistribution

### Accepted Licenses
- MIT License
- Apache 2.0
- GPL v3+
- Creative Commons CC0 (Public Domain)
- Creative Commons CC BY (Attribution)
- Creative Commons CC BY-SA (Attribution-ShareAlike)

### Rejected Licenses
- ❌ CC BY-NC (Non-Commercial only)
- ❌ CC BY-ND (No Derivatives)
- ❌ "Personal Use Only"
- ❌ All Rights Reserved

## 📁 Directory Structure

```
cutgluebuild/
├── templates/           # Organized template files
│   ├── svg/            # SVG vector files
│   ├── dxf/            # DXF CAD files  
│   ├── shaper-origin/  # Shaper Origin compatible
│   ├── generated/      # Parametrically generated
│   └── by-category/    # Organized by use case
├── sources/            # Original repositories
├── metadata/           # License tracking
├── tools/              # Processing scripts
└── docs/              # Documentation
```

## 🎯 Current Status

- **Verified Legal Sources**: 4 repositories
- **Estimated Templates**: 200+ files
- **Target Goal**: 250+ templates
- **License Compliance**: 100% verified

## 🔧 Getting Started

1. Run `./tools/download-sources.sh` to download all verified sources
2. Check `metadata/sources-registry.json` for license information
3. Templates are automatically organized by category and type
4. Generate additional templates using Boxes.py

## 📋 Template Categories

- **Boxes**: Storage containers, enclosures
- **Decorative**: Artistic and ornamental designs
- **Functional**: Mechanical parts, tools
- **Educational**: Learning projects, demonstrations
- **Robotics**: Robot parts, mechanical assemblies
- **Furniture**: Large-scale furniture components

## ⚖️ License Compliance

All templates in this collection are tracked in `metadata/` with full license attribution. Before using any template commercially, review the specific license requirements.

## 🤝 Contributing

When adding new templates:
1. Verify the source has a compatible open source license
2. Create proper attribution metadata
3. Organize files in appropriate directories
4. Update the sources registry

---

*This collection prioritizes legal compliance and proper attribution to respect creators rights while building a valuable resource for the maker community.*
