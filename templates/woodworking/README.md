# Woodworking Templates Collection

This comprehensive collection provides over 25 woodworking templates ranging from laser-cut CNC projects to traditional furniture builds.

## Template Categories

### 🏠 Home & Garden
- **Bird Houses**: Classic box, modern geometric, and decorative designs
- **Garden Projects**: Plant markers, row identifiers, and information panels

### 🔧 Tools & Organization  
- **Pegboard Systems**: Complete tool holder sets for workshop organization
- **Drawer Organizers**: Modular storage solutions with interlocking components

### 🎨 Home Decor
- **Floating Shelves**: Modern minimalist designs with hidden mounting systems
- **Picture Frames**: Classic, geometric, ornate, and multi-photo designs

### 🍽️ Kitchen & Dining
- **Cutting Boards**: Professional collection including charcuterie and specialty boards
- **Kitchen Storage**: Spice racks, utensil holders, and knife blocks

### 🪑 Furniture & Storage
- **Storage Solutions**: Basic boxes to advanced cabinet systems
- **Seating**: Garden benches to picnic tables

### 🏗️ Outdoor Structures
- **Advanced Projects**: Chicken coops and greenhouse frames

## File Structure

```
templates/woodworking/
├── bird-houses/
│   ├── classic-box-birdhouse.svg
│   ├── modern-geometric-birdhouse.svg
│   ├── decorative-front-panel-birdhouse.svg
│   └── build-instructions.md
├── organizational-tools/
│   ├── pegboard-tool-holders.svg
│   └── drawer-organizers.svg
├── home-decor/
│   ├── floating-wall-shelves.svg
│   └── decorative-picture-frames.svg
├── kitchen-items/
│   └── cutting-boards.svg
├── garden-projects/
│   └── plant-markers.svg
├── traditional-builds/
│   └── traditional-projects-guide.md
├── template-database-insertion.sql
└── README.md
```

## Template Types

### ⚡ CNC/Laser Cut Templates (SVG)
These templates are optimized for computer-controlled cutting:

- **Cut Lines**: 0.1mm stroke width for clean cuts
- **Engrave Lines**: 0.05mm stroke width for surface engraving  
- **Material Specs**: Recommended thickness and material types
- **Assembly Guides**: Visual instructions included in each file

### 📋 Traditional Build Plans
Comprehensive instructions for hand-tool and power-tool construction:

- **Materials Lists**: Complete with dimensions and quantities
- **Step-by-Step Instructions**: Detailed build process
- **Safety Guidelines**: Important safety considerations
- **Finishing Tips**: Recommended finishes and application methods

## Difficulty Levels

- **Beginner**: Simple cuts, basic assembly, minimal tools required
- **Intermediate**: Multiple components, some joinery, standard workshop tools
- **Advanced**: Complex joinery, specialized tools, precision required

## Material Specifications

### Recommended Materials by Project Type:

**CNC/Laser Projects:**
- 3mm plywood (birch or maple for engravings)
- 6mm MDF for prototyping
- 3mm acrylic for modern designs

**Traditional Builds:**
- 3/4" hardwood plywood for cabinets/storage
- Solid hardwood (maple, cherry, walnut) for furniture
- Cedar for outdoor projects
- Pressure-treated lumber for structures

**Food-Safe Projects:**
- Hard maple or cherry
- Bamboo
- Food-safe mineral oil finish

## Usage Instructions

### For CNC/Laser Cutting:

1. **Material Setup**: Use recommended thickness and secure properly
2. **Cut Settings**: Test on scrap material first
3. **Layer Management**: 
   - Cut layers: 0.1mm lines
   - Engrave layers: 0.05mm lines, 0.5mm depth
4. **Post-Processing**: Light sanding, edge finishing

### For Traditional Builds:

1. **Planning**: Read complete instructions before starting
2. **Material Prep**: Cut lumber to rough dimensions first
3. **Dry Fitting**: Always test fit before gluing
4. **Safety**: Use appropriate safety equipment throughout

## Database Integration

The `template-database-insertion.sql` file contains:

- Complete template metadata
- Proper categorization and tagging
- Difficulty and material specifications
- Premium/free designation
- Performance indexes

To integrate with your Cloudflare D1 database:
```bash
# Run the insertion script via Wrangler CLI
wrangler d1 execute cutgluebuild-db --file templates/woodworking/template-database-insertion.sql
```

## Template Features

### Free Templates:
- Basic bird house designs
- Simple picture frames  
- Garden plant markers
- Pegboard tool holders
- Basic storage projects

### Premium Templates:
- Advanced bird house with engravings
- Floating shelf systems
- Professional cutting board collection
- Modular drawer organizers
- Complex furniture and structure plans

## File Format Notes

### SVG Templates:
- Scalable vector graphics
- Optimized for laser/CNC cutting
- Include assembly guides and measurements
- Compatible with major CAD/CAM software

### Documentation:
- Markdown format for easy reading
- Includes photos and diagrams where helpful
- Step-by-step numbered instructions
- Material and tool lists

## Safety Considerations

**Always Remember:**
- Read all instructions completely before starting
- Use appropriate safety equipment
- Ensure tools are sharp and properly maintained
- Work in well-ventilated areas when finishing
- Follow manufacturer guidelines for all equipment

## Customization Options

Most templates can be easily modified:
- **Scaling**: SVG files are scalable for different sizes
- **Materials**: Adapt cut settings for different materials  
- **Features**: Add or remove elements as needed
- **Personalization**: Add names, dates, or custom engravings

## Support and Community

For questions, modifications, or sharing your builds:
- Post in the CutGlueBuild community
- Share photos of completed projects
- Suggest new template ideas
- Report any issues with cut files

## Licensing

These templates are provided for:
- Personal use
- Educational purposes
- Small-scale commercial use (check individual licenses)

Please respect the licensing terms and support the creators by purchasing premium templates.

---

**Happy Building!** 🔨

Whether you're just starting with a simple bird house or tackling an advanced greenhouse frame, these templates provide the foundation for countless hours of rewarding woodworking.