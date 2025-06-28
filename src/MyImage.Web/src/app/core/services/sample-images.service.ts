
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Sample Images Service for managing placeholder and demonstration images
 * used throughout the public pages. Provides consistent image sources
 * without requiring database modifications.
 */

export interface SampleImage {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: 'family' | 'landscape' | 'event' | 'portrait' | 'travel';
  printSize: string;
  quality: string;
  tags: string[];
}

export interface ImageCategory {
  id: string;
  name: string;
  description: string;
  samples: SampleImage[];
}

@Injectable({
  providedIn: 'root'
})
export class SampleImagesService {

  // High-quality sample images using Picsum Photos for consistency
  private sampleImages: SampleImage[] = [
    // Family Category
    {
      id: 'family_001',
      title: 'Family Portrait Session',
      description: 'Beautiful family moment captured with rich colors and sharp details, perfect for wall display',
      imageUrl: 'https://picsum.photos/400/300?random=20',
      category: 'family',
      printSize: '8×10"',
      quality: 'Premium',
      tags: ['portrait', 'family', 'indoor', 'professional']
    },
    {
      id: 'family_002',
      title: 'Children Playing',
      description: 'Candid moments with excellent motion capture and vibrant colors, ideal for photo albums',
      imageUrl: 'https://picsum.photos/400/300?random=21',
      category: 'family',
      printSize: '5×7"',
      quality: 'Professional',
      tags: ['children', 'candid', 'outdoor', 'action']
    },
    {
      id: 'family_003',
      title: 'Grandparents Together',
      description: 'Timeless portrait with exceptional detail and warmth, perfect for framing',
      imageUrl: 'https://picsum.photos/400/300?random=22',
      category: 'family',
      printSize: '4×6"',
      quality: 'Standard',
      tags: ['seniors', 'portrait', 'traditional', 'heritage']
    },
    {
      id: 'family_004',
      title: 'New Baby Photos',
      description: 'Delicate newborn photography with soft lighting and perfect skin tones',
      imageUrl: 'https://picsum.photos/400/300?random=23',
      category: 'family',
      printSize: '5×7"',
      quality: 'Premium',
      tags: ['newborn', 'baby', 'soft', 'milestone']
    },

    // Landscape Category
    {
      id: 'landscape_001',
      title: 'Mountain Sunrise',
      description: 'Stunning landscape with incredible color range and detail, showcasing our premium printing',
      imageUrl: 'https://picsum.photos/400/300?random=30',
      category: 'landscape',
      printSize: '11×14"',
      quality: 'Museum Quality',
      tags: ['mountains', 'sunrise', 'nature', 'panoramic']
    },
    {
      id: 'landscape_002',
      title: 'Ocean Waves',
      description: 'Dynamic seascape with perfect blues and foam detail, excellent for large format prints',
      imageUrl: 'https://picsum.photos/400/300?random=31',
      category: 'landscape',
      printSize: '8×10"',
      quality: 'Premium',
      tags: ['ocean', 'waves', 'seascape', 'water']
    },
    {
      id: 'landscape_003',
      title: 'Forest Path',
      description: 'Rich greens and natural lighting beautifully reproduced on professional paper',
      imageUrl: 'https://picsum.photos/400/300?random=32',
      category: 'landscape',
      printSize: '5×7"',
      quality: 'Professional',
      tags: ['forest', 'path', 'trees', 'natural']
    },
    {
      id: 'landscape_004',
      title: 'Desert Sunset',
      description: 'Warm desert tones with exceptional color reproduction and atmospheric depth',
      imageUrl: 'https://picsum.photos/400/300?random=33',
      category: 'landscape',
      printSize: '8×10"',
      quality: 'Premium',
      tags: ['desert', 'sunset', 'warm', 'atmospheric']
    },

    // Events Category
    {
      id: 'event_001',
      title: 'Wedding Ceremony',
      description: 'Precious wedding moments with perfect skin tones and dress detail reproduction',
      imageUrl: 'https://picsum.photos/400/300?random=40',
      category: 'event',
      printSize: '8×10"',
      quality: 'Premium',
      tags: ['wedding', 'ceremony', 'formal', 'celebration']
    },
    {
      id: 'event_002',
      title: 'Graduation Day',
      description: 'Achievement celebration captured with vivid colors and sharp focus',
      imageUrl: 'https://picsum.photos/400/300?random=41',
      category: 'event',
      printSize: '5×7"',
      quality: 'Professional',
      tags: ['graduation', 'achievement', 'formal', 'milestone']
    },
    {
      id: 'event_003',
      title: 'Birthday Party',
      description: 'Joyful celebration moments with excellent color reproduction and detail',
      imageUrl: 'https://picsum.photos/400/300?random=42',
      category: 'event',
      printSize: '4×6"',
      quality: 'Standard',
      tags: ['birthday', 'party', 'celebration', 'fun']
    },

    // Travel Category
    {
      id: 'travel_001',
      title: 'European Architecture',
      description: 'Historic building details with excellent texture and color accuracy',
      imageUrl: 'https://picsum.photos/400/300?random=50',
      category: 'travel',
      printSize: '8×10"',
      quality: 'Premium',
      tags: ['architecture', 'historic', 'europe', 'travel']
    },
    {
      id: 'travel_002',
      title: 'Tropical Beach',
      description: 'Paradise vacation memories with stunning blue reproduction',
      imageUrl: 'https://picsum.photos/400/300?random=51',
      category: 'travel',
      printSize: '5×7"',
      quality: 'Professional',
      tags: ['beach', 'tropical', 'vacation', 'paradise']
    },
    {
      id: 'travel_003',
      title: 'City Skyline',
      description: 'Urban landscape with sharp architectural details and vibrant city lights',
      imageUrl: 'https://picsum.photos/400/300?random=52',
      category: 'travel',
      printSize: '11×14"',
      quality: 'Museum Quality',
      tags: ['city', 'skyline', 'urban', 'lights']
    }
  ];

  constructor() {}

  /**
   * Get all sample images
   */
  getAllSamples(): Observable<SampleImage[]> {
    return of(this.sampleImages);
  }

  /**
   * Get samples by category
   */
  getSamplesByCategory(category: string): Observable<SampleImage[]> {
    const filtered = this.sampleImages.filter(img => img.category === category);
    return of(filtered);
  }

  /**
   * Get a specific sample by ID
   */
  getSampleById(id: string): Observable<SampleImage | null> {
    const sample = this.sampleImages.find(img => img.id === id);
    return of(sample || null);
  }

  /**
   * Get featured samples for home page (mix of categories)
   */
  getFeaturedSamples(count: number = 6): Observable<SampleImage[]> {
    // Get a mix from different categories
    const featured = [
      ...this.sampleImages.filter(img => img.category === 'family').slice(0, 2),
      ...this.sampleImages.filter(img => img.category === 'landscape').slice(0, 2),
      ...this.sampleImages.filter(img => img.category === 'event').slice(0, 1),
      ...this.sampleImages.filter(img => img.category === 'travel').slice(0, 1)
    ].slice(0, count);

    return of(featured);
  }

  /**
   * Get samples by quality level
   */
  getSamplesByQuality(quality: string): Observable<SampleImage[]> {
    const filtered = this.sampleImages.filter(img =>
      img.quality.toLowerCase().includes(quality.toLowerCase())
    );
    return of(filtered);
  }

  /**
   * Get samples by print size
   */
  getSamplesByPrintSize(printSize: string): Observable<SampleImage[]> {
    const filtered = this.sampleImages.filter(img => img.printSize === printSize);
    return of(filtered);
  }

  /**
   * Search samples by tags
   */
  searchSamplesByTags(tags: string[]): Observable<SampleImage[]> {
    const filtered = this.sampleImages.filter(img =>
      tags.some(tag => img.tags.includes(tag.toLowerCase()))
    );
    return of(filtered);
  }

  /**
   * Get available categories
   */
  getCategories(): Observable<ImageCategory[]> {
    const categories: ImageCategory[] = [
      {
        id: 'family',
        name: 'Family Photos',
        description: 'Beautiful family portraits and candid moments',
        samples: this.sampleImages.filter(img => img.category === 'family')
      },
      {
        id: 'landscape',
        name: 'Landscapes',
        description: 'Stunning nature and landscape photography',
        samples: this.sampleImages.filter(img => img.category === 'landscape')
      },
      {
        id: 'event',
        name: 'Special Events',
        description: 'Wedding, graduation, and celebration photos',
        samples: this.sampleImages.filter(img => img.category === 'event')
      },
      {
        id: 'travel',
        name: 'Travel & Adventure',
        description: 'Travel memories and adventure photography',
        samples: this.sampleImages.filter(img => img.category === 'travel')
      }
    ];

    return of(categories);
  }

  /**
   * Get hero images for different pages
   */
  getHeroImage(page: string): string {
    const heroImages = {
      'home': 'https://picsum.photos/800/500?random=1',
      'about': 'https://picsum.photos/600/400?random=2',
      'pricing': 'https://picsum.photos/700/450?random=3',
      'samples': 'https://picsum.photos/800/500?random=4',
      'how-it-works': 'https://picsum.photos/600/400?random=5'
    };

    return heroImages[page as keyof typeof heroImages] || heroImages['home'];
  }

  /**
   * Get quality indicator information
   */
  getQualityInfo() {
    return {
      'Museum Quality': {
        description: 'Highest grade archival paper for gallery-worthy prints',
        color: '#4caf50',
        icon: 'star'
      },
      'Premium': {
        description: 'Professional grade paper with excellent color reproduction',
        color: '#2196f3',
        icon: 'star_half'
      },
      'Professional': {
        description: 'High quality paper perfect for personal use',
        color: '#ff9800',
        icon: 'star_border'
      },
      'Standard': {
        description: 'Good quality paper for everyday printing needs',
        color: '#757575',
        icon: 'star_outline'
      }
    };
  }
}
