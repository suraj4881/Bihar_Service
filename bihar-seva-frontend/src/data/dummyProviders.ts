// Dummy Provider Data for Development
export interface DummyProvider {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  skill: string;
  biography: string;
  experience: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  profilePhoto?: string;
}

export const dummyProviders: DummyProvider[] = [
  // Plumbers
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@provider.com',
    phone: '+919876543220',
    city: 'PATNA',
    skill: 'Plumbing',
    biography: '15+ years experience in Bihar. Trusted by 500+ families. Expert in all types of plumbing work.',
    experience: '15',
    hourlyRate: 250,
    rating: 4.8,
    totalReviews: 45,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Manoj Singh',
    email: 'manoj.singh@provider.com',
    phone: '+919876543221',
    city: 'GAYA',
    skill: 'Plumbing',
    biography: 'Certified plumber with 10+ years experience. Quick service with quality guarantee.',
    experience: '10',
    hourlyRate: 200,
    rating: 4.6,
    totalReviews: 38,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Santosh Yadav',
    email: 'santosh.yadav@provider.com',
    phone: '+919876543222',
    city: 'PATNA',
    skill: 'Plumbing',
    biography: 'Expert in residential and commercial plumbing. Available 24/7 for emergencies.',
    experience: '12',
    hourlyRate: 220,
    rating: 4.7,
    totalReviews: 52,
    isVerified: true,
  },

  // Electricians
  {
    id: '4',
    name: 'Pankaj Kumar',
    email: 'pankaj.kumar@provider.com',
    phone: '+919876543223',
    city: 'BHAGALPUR',
    skill: 'Electrical',
    biography: 'Licensed electrician with 18+ years experience. Specialist in home wiring and electrical repairs.',
    experience: '18',
    hourlyRate: 280,
    rating: 4.9,
    totalReviews: 67,
    isVerified: true,
  },
  {
    id: '5',
    name: 'Deepak Sharma',
    email: 'deepak.sharma@provider.com',
    phone: '+919876543224',
    city: 'MUZAFFARPUR',
    skill: 'Electrical',
    biography: 'Government certified electrician. Expert in all electrical installations and repairs.',
    experience: '14',
    hourlyRate: 260,
    rating: 4.7,
    totalReviews: 43,
    isVerified: true,
  },
  {
    id: '6',
    name: 'Sunil Kumar',
    email: 'sunil.kumar@provider.com',
    phone: '+919876543225',
    city: 'PATNA',
    skill: 'Electrical',
    biography: 'Affordable rates with best quality work. Serving Patna since 2010.',
    experience: '13',
    hourlyRate: 240,
    rating: 4.5,
    totalReviews: 35,
    isVerified: true,
  },

  // Cleaners
  {
    id: '7',
    name: 'Ranjit Singh',
    email: 'ranjit.singh@provider.com',
    phone: '+919876543226',
    city: 'DARBHANGA',
    skill: 'Cleaning',
    biography: 'Professional cleaning service for homes and offices. Eco-friendly products used.',
    experience: '8',
    hourlyRate: 150,
    rating: 4.6,
    totalReviews: 28,
    isVerified: true,
  },
  {
    id: '8',
    name: 'Bhola Prasad',
    email: 'bhola.prasad@provider.com',
    phone: '+919876543227',
    city: 'PATNA',
    skill: 'Cleaning',
    biography: 'Deep cleaning specialist. Regular and one-time cleaning services available.',
    experience: '6',
    hourlyRate: 130,
    rating: 4.4,
    totalReviews: 22,
    isVerified: true,
  },
  {
    id: '9',
    name: 'Ramesh Kumar',
    email: 'ramesh.kumar@provider.com',
    phone: '+919876543228',
    city: 'GAYA',
    skill: 'Cleaning',
    biography: 'Trained in modern cleaning techniques. Trusted by 200+ families.',
    experience: '7',
    hourlyRate: 140,
    rating: 4.5,
    totalReviews: 31,
    isVerified: true,
  },

  // Carpenters
  {
    id: '10',
    name: 'Dinesh Yadav',
    email: 'dinesh.yadav@provider.com',
    phone: '+919876543229',
    city: 'BEGUSARAI',
    skill: 'Carpentry',
    biography: 'Master carpenter with 20+ years experience. Custom furniture and repairs.',
    experience: '20',
    hourlyRate: 300,
    rating: 4.9,
    totalReviews: 58,
    isVerified: true,
  },
  {
    id: '11',
    name: 'Mukesh Singh',
    email: 'mukesh.singh@provider.com',
    phone: '+919876543230',
    city: 'PATNA',
    skill: 'Carpentry',
    biography: 'Specialized in wooden furniture repair and restoration. Quality workmanship guaranteed.',
    experience: '16',
    hourlyRate: 270,
    rating: 4.7,
    totalReviews: 41,
    isVerified: true,
  },
  {
    id: '12',
    name: 'Anil Kumar',
    email: 'anil.kumar@provider.com',
    phone: '+919876543231',
    city: 'BHAGALPUR',
    skill: 'Carpentry',
    biography: 'Modern and traditional carpentry work. Free estimates provided.',
    experience: '11',
    hourlyRate: 230,
    rating: 4.6,
    totalReviews: 34,
    isVerified: true,
  },

  // AC Repair
  {
    id: '13',
    name: 'Vijay Kumar',
    email: 'vijay.kumar@provider.com',
    phone: '+919876543232',
    city: 'SAHARSA',
    skill: 'AC Repair',
    biography: 'AC installation, repair and servicing expert. All brands supported.',
    experience: '14',
    hourlyRate: 350,
    rating: 4.8,
    totalReviews: 49,
    isVerified: true,
  },
  {
    id: '14',
    name: 'Ajay Singh',
    email: 'ajay.singh@provider.com',
    phone: '+919876543233',
    city: 'PATNA',
    skill: 'AC Repair',
    biography: 'Certified AC technician. Same-day service available for emergencies.',
    experience: '12',
    hourlyRate: 320,
    rating: 4.7,
    totalReviews: 44,
    isVerified: true,
  },
  {
    id: '15',
    name: 'Sanjay Yadav',
    email: 'sanjay.yadav@provider.com',
    phone: '+919876543234',
    city: 'MUZAFFARPUR',
    skill: 'AC Repair',
    biography: 'Expert in split and window AC repair. Affordable service rates.',
    experience: '10',
    hourlyRate: 290,
    rating: 4.6,
    totalReviews: 37,
    isVerified: true,
  },

  // Painters
  {
    id: '16',
    name: 'Prakash Kumar',
    email: 'prakash.kumar@provider.com',
    phone: '+919876543235',
    city: 'SIWAN',
    skill: 'Painting',
    biography: 'Professional painter with 15+ years experience. Interior and exterior painting.',
    experience: '15',
    hourlyRate: 200,
    rating: 4.7,
    totalReviews: 40,
    isVerified: true,
  },
  {
    id: '17',
    name: 'Suresh Singh',
    email: 'suresh.singh@provider.com',
    phone: '+919876543236',
    city: 'PATNA',
    skill: 'Painting',
    biography: 'Expert in wall texturing and decorative painting. Quality paints used.',
    experience: '13',
    hourlyRate: 190,
    rating: 4.6,
    totalReviews: 36,
    isVerified: true,
  },
  {
    id: '18',
    name: 'Rakesh Kumar',
    email: 'rakesh.kumar@provider.com',
    phone: '+919876543237',
    city: 'GAYA',
    skill: 'Painting',
    biography: 'Residential and commercial painting specialist. Free color consultation.',
    experience: '11',
    hourlyRate: 180,
    rating: 4.5,
    totalReviews: 32,
    isVerified: true,
  },
];

// Helper function to get providers by skill
export const getProvidersBySkill = (skill: string): DummyProvider[] => {
  return dummyProviders.filter(
    (provider) => provider.skill.toLowerCase() === skill.toLowerCase()
  );
};

// Helper function to get providers by city
export const getProvidersByCity = (city: string): DummyProvider[] => {
  return dummyProviders.filter(
    (provider) => provider.city.toLowerCase() === city.toLowerCase()
  );
};

// Helper function to search providers
export const searchProviders = (query: string, city?: string): DummyProvider[] => {
  let results = dummyProviders;

  if (query) {
    results = results.filter(
      (provider) =>
        provider.skill.toLowerCase().includes(query.toLowerCase()) ||
        provider.name.toLowerCase().includes(query.toLowerCase()) ||
        provider.biography.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (city) {
    results = results.filter(
      (provider) => provider.city.toLowerCase() === city.toLowerCase()
    );
  }

  return results;
};

// Get stats from dummy data
export const getDummyStats = () => {
  const totalProviders = dummyProviders.length;
  const verifiedProviders = dummyProviders.filter((p) => p.isVerified).length;
  const averageRating =
    dummyProviders.reduce((sum, p) => sum + p.rating, 0) / dummyProviders.length;

  return {
    totalProviders,
    verifiedProviders,
    totalCustomers: 156, // Dummy count
    totalBookings: 342, // Dummy count
    totalCategories: 12,
    averageRating: Math.round(averageRating * 10) / 10,
  };
};

