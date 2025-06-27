-- Woodworking Templates Database Insertion Script
-- Run this script to populate the templates table with comprehensive woodworking projects

-- Bird House Templates
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Classic Box Bird House',
  'Traditional rectangular bird house perfect for small songbirds. Features easy assembly with finger joints and includes entrance hole sizing guide for different bird species.',
  'Home & Garden',
  ARRAY['birdhouse', 'outdoor', 'wildlife', 'beginner', 'garden'],
  ARRAY['3mm plywood', 'wood screws', 'wood glue', 'dowel rod'],
  'beginner',
  -- SVG data would be loaded from the file
  'SELECT pg_read_file(''/templates/woodworking/bird-houses/classic-box-birdhouse.svg'')::text',
  NULL,
  false, -- free template
  0,
  now()
),
(
  gen_random_uuid(),
  'Modern Geometric Bird House',
  'Contemporary hexagonal design with slot-together assembly. Creates stunning geometric forms while providing functional bird housing. No screws required.',
  'Home & Garden',
  ARRAY['birdhouse', 'modern', 'geometric', 'intermediate', 'contemporary'],
  ARRAY['3mm plywood', 'acrylic', 'wood glue'],
  'intermediate',
  'SELECT pg_read_file(''/templates/woodworking/bird-houses/modern-geometric-birdhouse.svg'')::text',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Decorative Front Panel Bird House',
  'Elegant bird house featuring laser-engraved floral patterns. Two-layer design with separate cut and engrave operations for professional results.',
  'Home & Garden',
  ARRAY['birdhouse', 'decorative', 'engraving', 'advanced', 'ornamental'],
  ARRAY['3mm hardwood plywood', 'wood glue', 'wood screws', 'marine varnish'],
  'advanced',
  'SELECT pg_read_file(''/templates/woodworking/bird-houses/decorative-front-panel-birdhouse.svg'')::text',
  NULL,
  true, -- premium template
  0,
  now()
);

-- Organizational Tool Templates
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Pegboard Tool Holders Set',
  'Complete set of workshop organization tools for standard pegboard. Includes holders for screwdrivers, wrenches, pliers, drill bits, and small parts.',
  'Tools & Organization',
  ARRAY['pegboard', 'organization', 'workshop', 'tools', 'storage'],
  ARRAY['3mm plywood', 'MDF'],
  'beginner',
  'SELECT pg_read_file(''/templates/woodworking/organizational-tools/pegboard-tool-holders.svg'')::text',
  NULL,
  false, -- free template
  0,
  now()
),
(
  gen_random_uuid(),
  'Modular Drawer Organizers',
  'Customizable drawer organization system with interlocking dividers. Mix and match compartments for tools, office supplies, or kitchen utensils.',
  'Tools & Organization',
  ARRAY['drawer', 'organizer', 'modular', 'office', 'kitchen'],
  ARRAY['3mm plywood', 'hardboard'],
  'intermediate',
  'SELECT pg_read_file(''/templates/woodworking/organizational-tools/drawer-organizers.svg'')::text',
  NULL,
  true, -- premium template
  0,
  now()
);

-- Home Decor Templates
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Floating Wall Shelves',
  'Modern minimalist floating shelves with hidden bracket system. Multiple sizes included with optional LED strip channels and cable management.',
  'Home Decor',
  ARRAY['shelves', 'floating', 'modern', 'wall-mount', 'minimalist'],
  ARRAY['3/4" hardwood plywood', 'hidden brackets', 'marine varnish'],
  'intermediate',
  'SELECT pg_read_file(''/templates/woodworking/home-decor/floating-wall-shelves.svg'')::text',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Decorative Picture Frames',
  'Complete picture frame collection including classic, modern, ornate Victorian, and multi-photo collage designs. Includes corner joint templates.',
  'Home Decor',
  ARRAY['picture-frames', 'photos', 'wall-art', 'decorative', 'gifts'],
  ARRAY['1/4" hardwood plywood', 'glass', 'frame hardware'],
  'beginner',
  'SELECT pg_read_file(''/templates/woodworking/home-decor/decorative-picture-frames.svg'')::text',
  NULL,
  false, -- free template
  0,
  now()
);

-- Kitchen Item Templates
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Professional Cutting Boards',
  'Complete cutting board collection including charcuterie boards, pizza peels, and bread boards. Features juice grooves and food-safe construction.',
  'Kitchen & Dining',
  ARRAY['cutting-board', 'kitchen', 'food-safe', 'charcuterie', 'cooking'],
  ARRAY['hardwood', 'bamboo', 'food-safe finish', 'rubber feet'],
  'intermediate',
  'SELECT pg_read_file(''/templates/woodworking/kitchen-items/cutting-boards.svg'')::text',
  NULL,
  true, -- premium template
  0,
  now()
);

-- Garden Project Templates
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Garden Plant Markers',
  'Comprehensive plant identification system including individual markers, row markers, and information panels. Weather-resistant designs.',
  'Home & Garden',
  ARRAY['garden', 'plant-markers', 'outdoor', 'gardening', 'organization'],
  ARRAY['cedar', 'waterproof plywood', 'marine varnish'],
  'beginner',
  'SELECT pg_read_file(''/templates/woodworking/garden-projects/plant-markers.svg'')::text',
  NULL,
  false, -- free template
  0,
  now()
);

-- Traditional Build Projects (Documentation/Plans)
INSERT INTO templates (
  id, title, description, category, tags, materials, difficulty, svg_data, 
  preview_url, is_premium, download_count, created_at
) VALUES 
(
  gen_random_uuid(),
  'Basic Storage Box Plans',
  'Fundamental woodworking project teaching basic joinery. Perfect first project with detailed step-by-step instructions and cut list.',
  'Furniture & Storage',
  ARRAY['storage', 'beginner', 'box', 'joinery', 'traditional'],
  ARRAY['3/4" plywood', 'wood glue', 'wood screws', 'hinge'],
  'beginner',
  -- For documentation templates, we might use a simple placeholder SVG
  '<svg width="100" height="80" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="60" fill="none" stroke="#000" stroke-width="1"/><text x="50" y="45" font-family="Arial" font-size="8" text-anchor="middle">Storage Box</text></svg>',
  NULL,
  false, -- free template
  0,
  now()
),
(
  gen_random_uuid(),
  'Wall Shelving Unit Plans',
  'Three-shelf bookcase with dado joints. Teaches intermediate joinery techniques and proper wall mounting methods.',
  'Furniture & Storage',
  ARRAY['shelving', 'bookcase', 'intermediate', 'dado-joints', 'wall-mount'],
  ARRAY['3/4" hardwood', '1/4" plywood back', 'wall anchors'],
  'intermediate',
  '<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="100" fill="none" stroke="#000" stroke-width="1"/><line x1="15" y1="40" x2="85" y2="40" stroke="#000"/><line x1="15" y1="70" x2="85" y2="70" stroke="#000"/><text x="50" y="125" font-family="Arial" font-size="6" text-anchor="middle">Wall Shelves</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Garden Bench Plans',
  'Classic outdoor bench using cedar construction. Weather-resistant design with traditional joinery techniques.',
  'Outdoor Furniture',
  ARRAY['bench', 'outdoor', 'cedar', 'intermediate', 'garden'],
  ARRAY['cedar 2x4', 'carriage bolts', 'outdoor stain'],
  'intermediate',
  '<svg width="120" height="60" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="100" height="8" fill="none" stroke="#000" stroke-width="1"/><line x1="20" y1="28" x2="20" y2="50" stroke="#000" stroke-width="2"/><line x1="100" y1="28" x2="100" y2="50" stroke="#000" stroke-width="2"/><text x="60" y="15" font-family="Arial" font-size="6" text-anchor="middle">Garden Bench</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Picnic Table Plans',
  'Traditional picnic table with attached benches. Seats 6-8 people. Complete with materials list and cutting diagrams.',
  'Outdoor Furniture',
  ARRAY['picnic-table', 'outdoor', 'seating', 'intermediate', 'family'],
  ARRAY['pressure-treated lumber', 'carriage bolts', 'deck screws'],
  'intermediate',
  '<svg width="150" height="100" viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="30" width="100" height="15" fill="none" stroke="#000" stroke-width="1"/><rect x="10" y="60" width="50" height="8" fill="none" stroke="#000" stroke-width="1"/><rect x="90" y="60" width="50" height="8" fill="none" stroke="#000" stroke-width="1"/><text x="75" y="20" font-family="Arial" font-size="6" text-anchor="middle">Picnic Table</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Basic Workbench Plans',
  'Fundamental workshop workbench with mortise and tenon joinery. Includes vise mounting and dog hole layout.',
  'Workshop Furniture',
  ARRAY['workbench', 'workshop', 'advanced', 'mortise-tenon', 'vise'],
  ARRAY['hard maple', 'woodworking vise', 'plywood shelf'],
  'advanced',
  '<svg width="150" height="80" viewBox="0 0 150 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="130" height="20" fill="none" stroke="#000" stroke-width="1"/><line x1="20" y1="30" x2="20" y2="60" stroke="#000" stroke-width="2"/><line x1="40" y1="30" x2="40" y2="60" stroke="#000" stroke-width="2"/><line x1="110" y1="30" x2="110" y2="60" stroke="#000" stroke-width="2"/><line x1="130" y1="30" x2="130" y2="60" stroke="#000" stroke-width="2"/><text x="75" y="75" font-family="Arial" font-size="6" text-anchor="middle">Workbench</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Tool Storage Cabinet Plans',
  'Wall-mounted cabinet with customizable interior. Features adjustable shelves and specialized tool holders.',
  'Workshop Storage',
  ARRAY['cabinet', 'tool-storage', 'wall-mount', 'adjustable', 'organization'],
  ARRAY['plywood', 'solid wood face frame', 'piano hinge', 'shelf pins'],
  'advanced',
  '<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="60" height="100" fill="none" stroke="#000" stroke-width="1"/><line x1="40" y1="10" x2="40" y2="110" stroke="#000" stroke-width="0.5"/><circle cx="20" cy="25" r="1"/><circle cx="20" cy="40" r="1"/><circle cx="20" cy="55" r="1"/><text x="40" y="125" font-family="Arial" font-size="6" text-anchor="middle">Tool Cabinet</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Chicken Coop Plans',
  'Complete 4x8 chicken coop for 4-6 hens. Includes nesting boxes, roosts, and predator-proof construction details.',
  'Outdoor Structures',
  ARRAY['chicken-coop', 'poultry', 'outdoor', 'advanced', 'farming'],
  ARRAY['pressure-treated lumber', 'cedar siding', 'metal roofing', 'hardware cloth'],
  'advanced',
  '<svg width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><polygon points="10,60 60,10 110,60 110,80 10,80" fill="none" stroke="#000" stroke-width="1"/><rect x="80" y="60" width="20" height="15" fill="none" stroke="#000" stroke-width="1"/><circle cx="90" cy="67" r="2"/><text x="60" y="95" font-family="Arial" font-size="6" text-anchor="middle">Chicken Coop</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
),
(
  gen_random_uuid(),
  'Greenhouse Frame Plans',
  'Professional 8x12 greenhouse with cedar frame construction. Includes ventilation system and foundation details.',
  'Outdoor Structures',
  ARRAY['greenhouse', 'garden', 'advanced', 'cedar', 'growing'],
  ARRAY['cedar lumber', 'polycarbonate panels', 'ventilation hardware'],
  'advanced',
  '<svg width="150" height="100" viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg"><polygon points="20,70 75,20 130,70 130,80 20,80" fill="none" stroke="#000" stroke-width="1"/><rect x="40" y="60" width="15" height="10" fill="none" stroke="#000" stroke-width="1"/><rect x="95" y="60" width="15" height="10" fill="none" stroke="#000" stroke-width="1"/><text x="75" y="95" font-family="Arial" font-size="6" text-anchor="middle">Greenhouse</text></svg>',
  NULL,
  true, -- premium template
  0,
  now()
);

-- Update download counts to simulate some usage
UPDATE templates SET download_count = floor(random() * 100) + 10 WHERE is_premium = false;
UPDATE templates SET download_count = floor(random() * 50) + 5 WHERE is_premium = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_difficulty ON templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_templates_is_premium ON templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_materials ON templates USING GIN(materials);

COMMIT;