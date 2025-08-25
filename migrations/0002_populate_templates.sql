-- Populate templates table with initial data
-- Migration: 0002_populate_templates.sql

INSERT OR REPLACE INTO templates (
  id, 
  title, 
  description, 
  category, 
  tags, 
  materials, 
  difficulty, 
  svg_data, 
  is_premium, 
  download_count
) VALUES 
-- Free templates
(
  'classic-box-birdhouse',
  'Classic Box Birdhouse',
  'A simple, timeless design perfect for beginners. This classic box-style birdhouse features clean lines and easy assembly.',
  'bird-houses',
  '["birdhouse", "classic", "beginner", "outdoor"]',
  '["3/4 inch plywood", "wood screws", "wood glue", "wood finish"]',
  'beginner',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="100" width="100" height="120" fill="none" stroke="black" stroke-width="2"/><polygon points="50,100 100,60 150,100" fill="none" stroke="black" stroke-width="2"/><circle cx="100" cy="160" r="8" fill="none" stroke="black" stroke-width="2"/><text x="200" y="30" font-family="Arial" font-size="14">Front Panel - Cut 1</text></svg>',
  0,
  0
),
(
  'pegboard-tool-holders',
  'Pegboard Tool Holders',
  'Organize your workshop with these versatile pegboard accessories. Multiple holder designs for different tool types.',
  'organizational-tools',
  '["pegboard", "organization", "workshop", "tools"]',
  '["1/4 inch plywood", "wood glue", "sandpaper"]',
  'beginner',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="50" width="80" height="40" fill="none" stroke="black" stroke-width="2"/><circle cx="30" cy="60" r="3" fill="none" stroke="black" stroke-width="1"/><circle cx="90" cy="60" r="3" fill="none" stroke="black" stroke-width="1"/><text x="120" y="30" font-family="Arial" font-size="12">Screwdriver Holder</text></svg>',
  0,
  0
),
(
  'decorative-picture-frames',
  'Decorative Picture Frames',
  'Beautiful picture frames with intricate cut-out patterns. Perfect for displaying your favorite photos.',
  'home-decor',
  '["picture frame", "decorative", "home decor"]',
  '["1/2 inch plywood", "glass", "backing board", "frame hardware"]',
  'intermediate',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="50" width="200" height="150" fill="none" stroke="black" stroke-width="2"/><rect x="80" y="80" width="140" height="90" fill="none" stroke="black" stroke-width="1"/><path d="M70,70 Q60,60 70,50 Q80,60 70,70" fill="none" stroke="black" stroke-width="1"/></svg>',
  0,
  0
),
(
  'plant-markers',
  'Garden Plant Markers',
  'Identify your plants with these durable garden markers. Weather-resistant design with space for plant names.',
  'garden-projects',
  '["garden", "plant markers", "outdoor", "labels"]',
  '["cedar wood", "wood stain", "waterproof marker"]',
  'beginner',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="100" y="50" width="80" height="40" rx="5" fill="none" stroke="black" stroke-width="2"/><rect x="135" y="90" width="10" height="60" fill="none" stroke="black" stroke-width="2"/><text x="120" y="75" font-family="Arial" font-size="10">PLANT</text></svg>',
  0,
  0
),

-- Premium templates
(
  'modern-geometric-birdhouse',
  'Modern Geometric Birdhouse',
  'Contemporary geometric design with angular features. A stylish addition to any modern garden or outdoor space.',
  'bird-houses',
  '["birdhouse", "modern", "geometric", "contemporary"]',
  '["1/2 inch plywood", "wood screws", "wood stain", "metal roof"]',
  'intermediate',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><polygon points="100,50 150,80 150,150 50,150 50,80" fill="none" stroke="black" stroke-width="2"/><polygon points="50,80 100,50 150,80" fill="none" stroke="black" stroke-width="2"/><circle cx="100" cy="115" r="8" fill="none" stroke="black" stroke-width="2"/></svg>',
  1,
  0
),
(
  'decorative-front-panel-birdhouse',
  'Decorative Front Panel Birdhouse',
  'Elegant birdhouse with intricate laser-cut decorative patterns on the front panel. A true work of art for your garden.',
  'bird-houses',
  '["birdhouse", "decorative", "ornate", "artistic"]',
  '["3/4 inch hardwood", "wood glue", "wood finish", "mounting hardware"]',
  'advanced',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="80" width="100" height="140" fill="none" stroke="black" stroke-width="2"/><polygon points="50,80 100,40 150,80" fill="none" stroke="black" stroke-width="2"/><circle cx="100" cy="130" r="10" fill="none" stroke="black" stroke-width="2"/><path d="M60,100 Q100,90 140,100 Q130,110 100,105 Q70,110 60,100" fill="none" stroke="black" stroke-width="1"/></svg>',
  1,
  0
),
(
  'floating-wall-shelves',
  'Floating Wall Shelves',
  'Sleek floating shelves with hidden mounting system. Perfect for displaying books, plants, or decorative items.',
  'home-decor',
  '["shelves", "floating", "wall mount", "modern"]',
  '["3/4 inch hardwood", "hidden brackets", "wood finish"]',
  'intermediate',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="100" width="200" height="30" fill="none" stroke="black" stroke-width="2"/><rect x="60" y="105" width="20" height="20" fill="none" stroke="black" stroke-width="1"/><rect x="210" y="105" width="20" height="20" fill="none" stroke="black" stroke-width="1"/></svg>',
  1,
  0
),
(
  'cutting-boards',
  'Artisan Cutting Boards',
  'Beautiful cutting boards with decorative edges and juice grooves. Food-safe finish included in instructions.',
  'kitchen-items',
  '["cutting board", "kitchen", "food safe", "decorative"]',
  '["hardwood maple", "food safe finish", "rubber feet"]',
  'intermediate',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="80" width="180" height="120" rx="10" fill="none" stroke="black" stroke-width="2"/><rect x="60" y="90" width="160" height="100" rx="5" fill="none" stroke="black" stroke-width="1"/><circle cx="70" cy="100" r="2" fill="black"/></svg>',
  1,
  0
),
(
  'drawer-organizers',
  'Custom Drawer Organizers',
  'Modular drawer organizer system that can be customized to fit any drawer size. Keep your tools and supplies organized.',
  'organizational-tools',
  '["organizer", "drawer", "modular", "custom"]',
  '["1/4 inch plywood", "wood glue", "felt pads"]',
  'intermediate',
  '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect x="50" y="80" width="80" height="60" fill="none" stroke="black" stroke-width="2"/><rect x="140" y="80" width="80" height="60" fill="none" stroke="black" stroke-width="2"/><rect x="95" y="150" width="80" height="40" fill="none" stroke="black" stroke-width="2"/></svg>',
  1,
  0
);