/**
 * Home / marketing screen content. Replace or extend with API-driven data in production;
 * structures are stable for mobile + web layouts.
 */

export interface ServiceCategoryItem {
  id: number;
  name: string;
  nameHi: string;
  searchTerm: string;
  color: string;
  iconKey: string;
}

export interface OfferItem {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  imageUrl: string;
}

export interface PopularServiceItem {
  id: number;
  title: string;
  rating: number;
  bookings: string;
  price: number;
  offer: string | null;
  category: string;
  imageUrl: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryItem[] = [
  { id: 1, name: 'Salon', nameHi: 'सैलून', searchTerm: 'salon', color: '#FF4081', iconKey: 'content_cut' },
  { id: 2, name: 'AC Service', nameHi: 'एसी सर्विस', searchTerm: 'ac', color: '#7E57C2', iconKey: 'ac_unit' },
  { id: 3, name: 'Repairs', nameHi: 'रिपेयर', searchTerm: 'repair', color: '#FF9800', iconKey: 'build' },
  { id: 4, name: 'Cleaning', nameHi: 'सफाई', searchTerm: 'cleaning', color: '#00BCD4', iconKey: 'auto_awesome' },
  { id: 5, name: 'Carpenter', nameHi: 'बढ़ई', searchTerm: 'carpentry', color: '#43A047', iconKey: 'carpenter' },
  { id: 6, name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', searchTerm: 'electrical', color: '#FFEB3B', iconKey: 'electric_bolt' },
  { id: 7, name: 'Painting', nameHi: 'पेंटिंग', searchTerm: 'painting', color: '#BA68C8', iconKey: 'format_paint' },
  { id: 8, name: 'More', nameHi: 'और', searchTerm: '', color: '#1E88E5', iconKey: 'more' },
];

export const OFFERS: OfferItem[] = [
  {
    id: 1,
    badge: 'MONSOON OFFER',
    title: 'Up to 30% OFF',
    subtitle: 'AC Service & Repair',
    cta: 'Book now',
    gradient: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1631545847708-28b969f5feea?w=400&q=80',
  },
  {
    id: 2,
    badge: 'FIRST BOOKING',
    title: '₹500 OFF',
    subtitle: 'Plumbing & repairs',
    cta: 'Book now',
    gradient: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80',
  },
  {
    id: 3,
    badge: 'WEEKEND SPECIAL',
    title: '20% OFF',
    subtitle: 'Deep cleaning',
    cta: 'Book now',
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  },
];

/** 4 production-style dummy listings — swap `imageUrl` with your CDN in deployment. */
export const POPULAR_SERVICES: PopularServiceItem[] = [
  {
    id: 1,
    title: "Men's hair & grooming",
    rating: 4.8,
    bookings: '12k+',
    price: 299,
    offer: '15% OFF',
    category: 'Salon',
    imageUrl:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
  },
  {
    id: 2,
    title: 'Deep kitchen cleaning',
    rating: 4.7,
    bookings: '9.5k',
    price: 799,
    offer: null,
    category: 'Cleaning',
    imageUrl:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80',
  },
  {
    id: 3,
    title: 'Electrician on demand',
    rating: 4.7,
    bookings: '15k',
    price: 149,
    offer: null,
    category: 'Repair',
    imageUrl:
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80',
  },
  {
    id: 4,
    title: 'Wall painting service',
    rating: 4.8,
    bookings: '3.2k',
    price: 999,
    offer: '10% OFF',
    category: 'Home',
    imageUrl:
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80',
  },
];

export const TRUST_POINTS = [
  {
    title: 'Verified pros',
    titleHi: 'सत्यापित प्रो',
    desc: 'Police-verified, trained.',
    descHi: 'पुलिस-सत्यापित, प्रशिक्षित।',
    icon: 'verified' as const,
  },
  {
    title: 'Fair pricing',
    titleHi: 'सही दाम',
    desc: 'No hidden charges.',
    descHi: 'कोई छुपा शुल्क नहीं।',
    icon: 'payments' as const,
  },
  {
    title: '24/7 support',
    titleHi: '24/7 सहायता',
    desc: 'Hindi + English.',
    descHi: 'हिंदी + English।',
    icon: 'headset_mic' as const,
  },
  {
    title: 'Service warranty',
    titleHi: 'सेवा वारंटी',
    desc: '30-day guarantee.',
    descHi: '30 दिन की गारंटी।',
    icon: 'shield' as const,
  },
];

export const FILTER_TABS = ['All', 'Salon', 'Cleaning', 'Repair', 'Home'] as const;
