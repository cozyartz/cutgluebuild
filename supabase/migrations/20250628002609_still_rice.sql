-- Populate templates table with woodworking templates
-- This script should be run after the create_templates_table.sql migration

-- Insert free templates
INSERT INTO templates (title, description, category, tags, materials, difficulty, svg_data, is_premium, download_count) VALUES 
(
  'Classic Box Bird House',
  'Traditional rectangular bird house perfect for small songbirds. Features easy assembly with finger joints and includes entrance hole sizing guide for different bird species.',
  'Home & Garden',
  ARRAY['birdhouse', 'outdoor', 'wildlife', 'beginner', 'garden'],
  ARRAY['3mm plywood', 'wood screws', 'wood glue', 'dowel rod'],
  'beginner',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="30" width="60" height="50" fill="none" stroke="#8B4513" stroke-width="2"/><circle cx="50" cy="45" r="6" fill="none" stroke="#8B4513" stroke-width="2"/><polygon points="15,30 50,10 85,30" fill="none" stroke="#8B4513" stroke-width="2"/></svg>',
  false,
  45
),
(
  'Pegboard Tool Holders Set',
  'Complete set of workshop organization tools for standard pegboard. Includes holders for screwdrivers, wrenches, pliers, drill bits, and small parts.',
  'Tools & Organization',
  ARRAY['pegboard', 'organization', 'workshop', 'tools', 'storage'],
  ARRAY['3mm plywood', 'MDF'],
  'beginner',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="80" fill="none" stroke="#654321" stroke-width="1"/><circle cx="25" cy="25" r="3"/><circle cx="50" cy="25" r="3"/><circle cx="75" cy="25" r="3"/><rect x="20" y="40" width="60" height="8" fill="none" stroke="#654321" stroke-width="1"/><rect x="20" y="60" width="60" height="8" fill="none" stroke="#654321" stroke-width="1"/></svg>',
  false,
  67
),
(
  'Decorative Picture Frames',
  'Complete picture frame collection including classic, modern, ornate Victorian, and multi-photo collage designs. Includes corner joint templates.',
  'Home Decor',
  ARRAY['picture-frames', 'photos', 'wall-art', 'decorative', 'gifts'],
  ARRAY['1/4" hardwood plywood', 'glass', 'frame hardware'],
  'beginner',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="15" width="80" height="60" fill="none" stroke="#8B4513" stroke-width="3"/><rect x="20" y="25" width="60" height="40" fill="none" stroke="#8B4513" stroke-width="1"/><rect x="25" y="30" width="50" height="30" fill="#E6E6FA" stroke="none"/></svg>',
  false,
  89
),
(
  'Garden Plant Markers',
  'Comprehensive plant identification system including individual markers, row markers, and information panels. Weather-resistant designs.',
  'Home & Garden',
  ARRAY['garden', 'plant-markers', 'outdoor', 'gardening', 'organization'],
  ARRAY['cedar', 'waterproof plywood', 'marine varnish'],
  'beginner',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 10 L65 25 L65 35 L35 35 L35 25 Z" fill="none" stroke="#228B22" stroke-width="2"/><rect x="47" y="35" width="6" height="55" fill="none" stroke="#8B4513" stroke-width="2"/><text x="50" y="30" text-anchor="middle" font-family="Arial" font-size="8">HERB</text></svg>',
  false,
  123
);

-- Insert premium templates
INSERT INTO templates (title, description, category, tags, materials, difficulty, svg_data, is_premium, download_count) VALUES 
(
  'Modern Geometric Bird House',
  'Contemporary hexagonal design with slot-together assembly. Creates stunning geometric forms while providing functional bird housing. No screws required.',
  'Home & Garden',
  ARRAY['birdhouse', 'modern', 'geometric', 'intermediate', 'contemporary'],
  ARRAY['3mm plywood', 'acrylic', 'wood glue'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,15 35,25 35,45 50,55 65,45 65,25" fill="none" stroke="#4169E1" stroke-width="2"/><circle cx="50" cy="35" r="4" fill="none" stroke="#4169E1" stroke-width="2"/><polygon points="35,55 50,65 65,55 65,75 35,75" fill="none" stroke="#4169E1" stroke-width="2"/></svg>',
  true,
  23
),
(
  'Decorative Front Panel Bird House',
  'Elegant bird house featuring laser-engraved floral patterns. Two-layer design with separate cut and engrave operations for professional results.',
  'Home & Garden',
  ARRAY['birdhouse', 'decorative', 'engraving', 'advanced', 'ornamental'],
  ARRAY['3mm hardwood plywood', 'wood glue', 'wood screws', 'marine varnish'],
  'advanced',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="25" width="60" height="55" fill="none" stroke="#8B4513" stroke-width="2"/><circle cx="50" cy="45" r="8" fill="none" stroke="#8B4513" stroke-width="2"/><path d="M35 35 Q40 30 45 35 Q50 30 55 35 Q60 30 65 35" fill="none" stroke="#8B4513" stroke-width="1"/><polygon points="15,25 50,5 85,25" fill="none" stroke="#8B4513" stroke-width="2"/></svg>',
  true,
  31
),
(
  'Modular Drawer Organizers',
  'Customizable drawer organization system with interlocking dividers. Mix and match compartments for tools, office supplies, or kitchen utensils.',
  'Tools & Organization',
  ARRAY['drawer', 'organizer', 'modular', 'office', 'kitchen'],
  ARRAY['3mm plywood', 'hardboard'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="80" height="60" fill="none" stroke="#654321" stroke-width="2"/><line x1="40" y1="20" x2="40" y2="80" stroke="#654321" stroke-width="1"/><line x1="70" y1="20" x2="70" y2="80" stroke="#654321" stroke-width="1"/><line x1="10" y1="50" x2="90" y2="50" stroke="#654321" stroke-width="1"/></svg>',
  true,
  18
),
(
  'Floating Wall Shelves',
  'Modern minimalist floating shelves with hidden bracket system. Multiple sizes included with optional LED strip channels and cable management.',
  'Home Decor',
  ARRAY['shelves', 'floating', 'modern', 'wall-mount', 'minimalist'],
  ARRAY['3/4" hardwood plywood', 'hidden brackets', 'marine varnish'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="30" width="70" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="15" y="50" width="70" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="15" y="70" width="70" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="20" y="25" width="60" height="3" fill="#D3D3D3"/></svg>',
  true,
  42
),
(
  'Professional Cutting Boards',
  'Complete cutting board collection including charcuterie boards, pizza peels, and bread boards. Features juice grooves and food-safe construction.',
  'Kitchen & Dining',
  ARRAY['cutting-board', 'kitchen', 'food-safe', 'charcuterie', 'cooking'],
  ARRAY['hardwood', 'bamboo', 'food-safe finish', 'rubber feet'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="25" width="60" height="40" rx="5" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="25" y="30" width="50" height="30" rx="3" fill="none" stroke="#8B4513" stroke-width="1"/><circle cx="45" cy="20" r="3" fill="none" stroke="#8B4513" stroke-width="1"/></svg>',
  true,
  27
);

-- Insert traditional build plans (all premium)
INSERT INTO templates (title, description, category, tags, materials, difficulty, svg_data, is_premium, download_count) VALUES 
(
  'Garden Bench Plans',
  'Classic outdoor bench using cedar construction. Weather-resistant design with traditional joinery techniques.',
  'Outdoor Furniture',
  ARRAY['bench', 'outdoor', 'cedar', 'intermediate', 'garden'],
  ARRAY['cedar 2x4', 'carriage bolts', 'outdoor stain'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="35" width="80" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="15" y="55" width="15" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="70" y="55" width="15" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><line x1="22" y1="43" x2="22" y2="63" stroke="#8B4513" stroke-width="3"/><line x1="78" y1="43" x2="78" y2="63" stroke="#8B4513" stroke-width="3"/></svg>',
  true,
  15
),
(
  'Picnic Table Plans',
  'Traditional picnic table with attached benches. Seats 6-8 people. Complete with materials list and cutting diagrams.',
  'Outdoor Furniture',
  ARRAY['picnic-table', 'outdoor', 'seating', 'intermediate', 'family'],
  ARRAY['pressure-treated lumber', 'carriage bolts', 'deck screws'],
  'intermediate',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="40" width="60" height="8" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="10" y="60" width="30" height="6" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="60" y="60" width="30" height="6" fill="none" stroke="#8B4513" stroke-width="2"/><line x1="35" y1="48" x2="35" y2="66" stroke="#8B4513" stroke-width="2"/><line x1="65" y1="48" x2="65" y2="66" stroke="#8B4513" stroke-width="2"/></svg>',
  true,
  12
),
(
  'Basic Workbench Plans',
  'Fundamental workshop workbench with mortise and tenon joinery. Includes vise mounting and dog hole layout.',
  'Workshop Furniture',
  ARRAY['workbench', 'workshop', 'advanced', 'mortise-tenon', 'vise'],
  ARRAY['hard maple', 'woodworking vise', 'plywood shelf'],
  'advanced',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="80" height="12" fill="none" stroke="#8B4513" stroke-width="2"/><line x1="20" y1="37" x2="20" y2="65" stroke="#8B4513" stroke-width="3"/><line x1="40" y1="37" x2="40" y2="65" stroke="#8B4513" stroke-width="3"/><line x1="60" y1="37" x2="60" y2="65" stroke="#8B4513" stroke-width="3"/><line x1="80" y1="37" x2="80" y2="65" stroke="#8B4513" stroke-width="3"/><rect x="15" y="65" width="70" height="6" fill="none" stroke="#8B4513" stroke-width="1"/></svg>',
  true,
  8
),
(
  'Tool Storage Cabinet Plans',
  'Wall-mounted cabinet with customizable interior. Features adjustable shelves and specialized tool holders.',
  'Workshop Storage',
  ARRAY['cabinet', 'tool-storage', 'wall-mount', 'adjustable', 'organization'],
  ARRAY['plywood', 'solid wood face frame', 'piano hinge', 'shelf pins'],
  'advanced',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="15" width="50" height="70" fill="none" stroke="#8B4513" stroke-width="2"/><line x1="50" y1="15" x2="50" y2="85" stroke="#8B4513" stroke-width="1"/><line x1="30" y1="35" x2="70" y2="35" stroke="#8B4513" stroke-width="1"/><line x1="30" y1="55" x2="70" y2="55" stroke="#8B4513" stroke-width="1"/><circle cx="35" cy="25" r="1.5"/><circle cx="35" cy="45" r="1.5"/><circle cx="35" cy="65" r="1.5"/></svg>',
  true,
  6
),
(
  'Chicken Coop Plans',
  'Complete 4x8 chicken coop for 4-6 hens. Includes nesting boxes, roosts, and predator-proof construction details.',
  'Outdoor Structures',
  ARRAY['chicken-coop', 'poultry', 'outdoor', 'advanced', 'farming'],
  ARRAY['pressure-treated lumber', 'cedar siding', 'metal roofing', 'hardware cloth'],
  'advanced',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="15,50 50,20 85,50 85,70 15,70" fill="none" stroke="#8B4513" stroke-width="2"/><rect x="70" y="50" width="12" height="15" fill="none" stroke="#8B4513" stroke-width="1"/><circle cx="76" cy="57" r="2"/><rect x="20" y="55" width="45" height="10" fill="none" stroke="#8B4513" stroke-width="1"/></svg>',
  true,
  4
),
(
  'Greenhouse Frame Plans',
  'Professional 8x12 greenhouse with cedar frame construction. Includes ventilation system and foundation details.',
  'Outdoor Structures',
  ARRAY['greenhouse', 'garden', 'advanced', 'cedar', 'growing'],
  ARRAY['cedar lumber', 'polycarbonate panels', 'ventilation hardware'],
  'advanced',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="20,60 50,25 80,60 80,75 20,75" fill="none" stroke="#228B22" stroke-width="2"/><rect x="35" y="50" width="10" height="8" fill="none" stroke="#228B22" stroke-width="1"/><rect x="55" y="50" width="10" height="8" fill="none" stroke="#228B22" stroke-width="1"/><line x1="30" y1="40" x2="70" y2="40" stroke="#228B22" stroke-width="1"/><line x1="40" y1="25" x2="40" y2="75" stroke="#228B22" stroke-width="1"/><line x1="60" y1="25" x2="60" y2="75" stroke="#228B22" stroke-width="1"/></svg>',
  true,
  3
);

-- Update some download counts to simulate realistic usage patterns
UPDATE templates SET download_count = floor(random() * 150) + 20 WHERE is_premium = false;
UPDATE templates SET download_count = floor(random() * 50) + 5 WHERE is_premium = true;