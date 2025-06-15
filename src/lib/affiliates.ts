interface AffiliateLink {
  id: string;
  name: string;
  description: string;
  category: 'laser' | 'material' | 'tool' | 'software';
  url: string;
  price?: string;
  rating?: number;
  image?: string;
}

export const affiliateLinks: AffiliateLink[] = [
  // Laser Cutters
  {
    id: 'glowforge-basic',
    name: 'Glowforge Basic',
    description: 'Perfect entry-level laser cutter for hobbyists and small businesses',
    category: 'laser',
    url: `https://glowforge.com/basic?ref=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$2,995',
    rating: 4.5,
    image: '/images/glowforge-basic.jpg'
  },
  {
    id: 'glowforge-pro',
    name: 'Glowforge Pro',
    description: 'Professional-grade laser cutter with enhanced features',
    category: 'laser',
    url: `https://glowforge.com/pro?ref=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$5,995',
    rating: 4.7,
    image: '/images/glowforge-pro.jpg'
  },

  // Materials
  {
    id: 'proofgrade-wood',
    name: 'Proofgrade Wood Variety Pack',
    description: 'High-quality laser-ready wood materials',
    category: 'material',
    url: `https://shop.glowforge.com/collections/proofgrade-materials/products/wood-variety-pack?ref=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$89',
    rating: 4.8,
    image: '/images/proofgrade-wood.jpg'
  },
  {
    id: 'acrylic-sheets',
    name: 'Cast Acrylic Sheets',
    description: 'Premium cast acrylic perfect for laser cutting',
    category: 'material',
    url: `https://amazon.com/dp/B08XYZNPQR?tag=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$24.99',
    rating: 4.6,
    image: '/images/acrylic-sheets.jpg'
  },

  // Tools
  {
    id: 'laser-safety-glasses',
    name: 'Laser Safety Glasses',
    description: 'Essential protection for laser cutting operations',
    category: 'tool',
    url: `https://amazon.com/dp/B07QKXM8YZ?tag=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$29.99',
    rating: 4.4,
    image: '/images/safety-glasses.jpg'
  },
  {
    id: 'honeycomb-bed',
    name: 'Honeycomb Cutting Bed',
    description: 'Improve air flow and cut quality with honeycomb bed',
    category: 'tool',
    url: `https://amazon.com/dp/B08XYZNPQR?tag=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$89.99',
    rating: 4.7,
    image: '/images/honeycomb-bed.jpg'
  },

  // Software
  {
    id: 'lightburn',
    name: 'LightBurn Software',
    description: 'Professional laser cutting and engraving software',
    category: 'software',
    url: `https://lightburnsoftware.com/?ref=${import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20'}`,
    price: '$60',
    rating: 4.9,
    image: '/images/lightburn.jpg'
  }
];

export class AffiliateService {
  getRecommendations(category?: string, limit?: number): AffiliateLink[] {
    let filtered = affiliateLinks;
    
    if (category) {
      filtered = affiliateLinks.filter(link => link.category === category);
    }
    
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }

  getByCategory(category: string): AffiliateLink[] {
    return affiliateLinks.filter(link => link.category === category);
  }

  getById(id: string): AffiliateLink | undefined {
    return affiliateLinks.find(link => link.id === id);
  }

  getTopRated(limit: number = 5): AffiliateLink[] {
    return affiliateLinks
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  trackClick(linkId: string): void {
    // Track affiliate link clicks for analytics
    if (typeof window !== 'undefined') {
      // Send tracking event
      console.log(`Affiliate link clicked: ${linkId}`);
      
      // You could send this to your analytics service
      // analytics.track('affiliate_link_clicked', { linkId });
    }
  }

  generateAffiliateUrl(baseUrl: string, product?: string): string {
    const tag = import.meta.env.VITE_AMAZON_ASSOCIATE_TAG || 'cutgluebuild-20';
    
    if (baseUrl.includes('amazon.com')) {
      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}tag=${tag}`;
    }
    
    if (baseUrl.includes('glowforge.com')) {
      return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ref=${tag}`;
    }
    
    // Default fallback
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}ref=${tag}`;
  }
}

export const affiliateService = new AffiliateService();

// Helper function to create affiliate links in content
export function createAffiliateLink(
  text: string, 
  productId: string, 
  className: string = 'text-primary-500 hover:text-primary-600 underline'
): string {
  const product = affiliateService.getById(productId);
  
  if (!product) {
    return text;
  }
  
  return `<a href="${product.url}" target="_blank" rel="noopener noreferrer" class="${className}" onclick="affiliateService.trackClick('${productId}')">${text}</a>`;
}

// Material recommendations based on project type
export function getMaterialRecommendations(projectType: string): AffiliateLink[] {
  const materialMap: Record<string, string[]> = {
    'home-decor': ['proofgrade-wood', 'acrylic-sheets'],
    'gifts': ['proofgrade-wood', 'acrylic-sheets'],
    'functional': ['proofgrade-wood', 'acrylic-sheets'],
    'art': ['acrylic-sheets', 'proofgrade-wood'],
    'tools': ['proofgrade-wood']
  };
  
  const recommendedIds = materialMap[projectType] || ['proofgrade-wood'];
  return recommendedIds.map(id => affiliateService.getById(id)).filter(Boolean) as AffiliateLink[];
}