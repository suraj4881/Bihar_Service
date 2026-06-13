import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.profile': 'Profile',
    'nav.dashboard': 'Dashboard',
    
    // Login Page
    'login.welcome': 'Welcome Back!',
    'login.subtitle': 'Login to access Bihar\'s best service marketplace',
    'login.trusted': 'Trusted Service Providers',
    'login.secure': 'Secure Payments',
    'login.support': '24/7 Support',
    'login.title': 'Login to Your Account',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot Password?',
    'login.submit': 'Login',
    'login.or': 'OR',
    'login.emailOtp': 'Login with Email OTP',
    'login.noAccount': 'Don\'t have an account?',
    'login.signup': 'Sign Up',
    'login.error': 'Invalid email or password',
    
    // Register Page
    'register.welcome': 'Join SewaBihar',
    'register.subtitle': 'Create your account and start your journey',
    'register.title': 'Create Account',
    'register.fillDetails': 'Fill in your details to get started 🚀',
    'register.name': 'Full Name',
    'register.email': 'Email Address',
    'register.phone': 'Phone Number',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.city': 'City',
    'register.selectCity': 'Select your city',
    'register.registerAs': 'Register as',
    'register.customer': 'Customer',
    'register.provider': 'Provider',
    'register.language': 'Preferred Language',
    'register.english': 'English',
    'register.hindi': 'Hindi',
    'register.submit': 'Create Account',
    'register.haveAccount': 'Already have an account?',
    'register.login': 'Login',
    'register.getLocation': 'Get My Location',
    'register.selectRole': 'Select Account Type',
    'register.selectLanguage': 'Select Language',
    
    // Hero Section
    'hero.tagline': "Bihar's Trusted Service Platform",
    'hero.title': 'Every Home Service',
    'hero.subtitle': 'In One Click',
    'hero.description': 'Find Verified Service Professionals in Bihar',
    'hero.verified': '✓ Verified',
    'hero.affordable': '✓ Affordable',
    'hero.reliable': '✓ Reliable',
    
    // Search
    'search.title': '🔍 What service are you looking for?',
    'search.placeholder': 'e.g., Plumber, Electrician, Cleaner...',
    'search.location': 'Enter your city',
    'search.button': 'Search Now',
    'search.popular': 'Popular:',
    
    // Stats
    'stats.providers': 'Verified Providers',
    'stats.customers': 'Happy Customers',
    'stats.categories': 'Service Categories',
    'stats.rating': 'Average Rating',
    
    // Services
    'service.plumbing': 'Plumbing',
    'service.electrical': 'Electrical',
    'service.cleaning': 'Cleaning',
    'service.carpentry': 'Carpentry',
    'service.ac': 'AC Repair',
    'service.painting': 'Painting',
    'service.appliance': 'Appliance Repair',
    'service.other': 'Other Services',
    'service.providers': 'Providers',
    
    // Sections
    'section.services.title': 'Popular Services',
    'section.services.subtitle': 'Choose from our wide range of professional services',
    'section.howItWorks.title': 'How It Works',
    'section.howItWorks.subtitle': 'Get started in 4 simple steps',
    'section.providers.title': 'Top Rated Providers',
    'section.providers.subtitle': 'Trusted professionals verified by SewaBihar',
    
    // How It Works Steps
    'step1.title': '1. Search Service',
    'step1.desc': 'Find the perfect service provider for your needs',
    'step2.title': '2. Book Appointment',
    'step2.desc': 'Schedule at your convenient time and location',
    'step3.title': '3. Get Service Done',
    'step3.desc': 'Verified professionals complete your work',
    'step4.title': '4. Rate & Review',
    'step4.desc': 'Share your experience and help others',
    
    // Footer
    'footer.company': 'Company',
    'footer.about': 'About Us',
    'footer.careers': 'Careers',
    'footer.customers': 'For Customers',
    'footer.browse': 'Browse Services',
    'footer.howItWorks': 'How It Works',
    'footer.providers': 'For Providers',
    'footer.join': 'Join as Provider',
    'footer.contact': 'Contact',
    'footer.email': 'support@sewabihar.com',
    'footer.phone': '+91 98765 43210',
    'footer.contactUs': 'Contact Us',
    'footer.copyright': '© 2024 SewaBihar. All rights reserved. Made with ❤️ in Bihar',
    
    // Dashboard
    'dashboard.provider.title': 'My Workspace',
    'dashboard.kyc.status': 'Identity Verification',
    'dashboard.kyc.verified': 'Verified',
    'dashboard.kyc.complete': 'Complete',
    'dashboard.kyc.pending': 'Pending Verification',
    'dashboard.kyc.underProcess': 'Under Process',
    'dashboard.kyc.rejected': 'Rejected',
    'dashboard.kyc.notSubmitted': 'KYC Not Submitted',
    'dashboard.kyc.verifiedOn': 'Verified on',
    'dashboard.kyc.pendingMsg': 'Your documents are under review. We\'ll notify you once verified.',
    'dashboard.kyc.underProcessMsg': 'Your KYC documents are under review. Verification is in process. We\'ll notify you once verified.',
    'dashboard.kyc.rejectedMsg': 'Your KYC has been rejected.',
    'dashboard.kyc.reUploadMsg': 'Please re-upload your documents with corrections.',
    'dashboard.kyc.notSubmittedMsg': 'Complete your KYC verification to start receiving bookings and build customer trust.',
    'dashboard.kyc.submit': 'Submit KYC',
    'dashboard.kyc.viewStatus': 'View Status',
    'dashboard.kyc.reUpload': 'Re-upload Documents',
    'dashboard.stats.totalBookings': 'Total Bookings',
    'dashboard.stats.totalEarnings': 'Total Earnings',
    'dashboard.stats.pendingBookings': 'Pending Bookings',
    'dashboard.stats.averageRating': 'Average Rating',
    'dashboard.stats.completed': 'Completed',
    'dashboard.stats.thisMonth': 'This Month',
    'dashboard.stats.needsAttention': 'Needs Attention',
    'dashboard.stats.reviews': 'Reviews',
    'dashboard.tabs.overview': 'Overview',
    'dashboard.tabs.bookings': 'Bookings',
    'dashboard.tabs.earnings': 'Earnings',
    'dashboard.tabs.services': 'My Services',
    'dashboard.recentBookings': 'Recent Bookings',
    'dashboard.viewAll': 'View All',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.addService': 'Add Service',
    'dashboard.editProfile': 'Edit Profile',
    'dashboard.kycStatus': 'KYC Status',
    'dashboard.kycVerified': 'KYC Verified',
    'dashboard.allBookings': 'All Bookings',
    'dashboard.pending': 'Pending',
    'dashboard.customer': 'Customer',
    'dashboard.service': 'Service',
    'dashboard.dateTime': 'Date & Time',
    'dashboard.amount': 'Amount',
    'dashboard.status': 'Status',
    'dashboard.actions': 'Actions',
    'dashboard.view': 'View',
    'dashboard.totalEarnings': 'Total Earnings',
    'dashboard.allTimeEarnings': 'All Time Earnings',
    'dashboard.monthlyEarnings': 'Monthly Earnings',
    'dashboard.earningsHistory': 'Earnings History',
    'dashboard.date': 'Date',
    'dashboard.commission': 'Commission',
    'dashboard.netEarnings': 'Net Earnings',
    'dashboard.myServices': 'My Services',
    'dashboard.servicesMsg': 'Manage your services, update pricing, and add new offerings. Only verified services are visible to customers.',
    'dashboard.basePrice': 'Base Price',
    'dashboard.active': 'Active',
    'dashboard.edit': 'Edit',
    'dashboard.scheduled': 'Scheduled',
    'dashboard.today': 'Today',
  },
  hi: {
    // Navbar
    'nav.services': 'सेवाएं',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क',
    'nav.login': 'लॉगिन',
    'nav.signup': 'साइन अप',
    'nav.profile': 'प्रोफाइल',
    'nav.dashboard': 'डैशबोर्ड',
    
    // Login Page
    'login.welcome': 'वापसी पर स्वागत है!',
    'login.subtitle': 'बिहार के सर्वश्रेष्ठ सेवा बाज़ार तक पहुंचने के लिए लॉगिन करें',
    'login.trusted': 'विश्वसनीय सेवा प्रदाता',
    'login.secure': 'सुरक्षित भुगतान',
    'login.support': '24/7 सहायता',
    'login.title': 'अपने खाते में लॉगिन करें',
    'login.email': 'ईमेल पता',
    'login.password': 'पासवर्ड',
    'login.remember': 'मुझे याद रखें',
    'login.forgot': 'पासवर्ड भूल गए?',
    'login.submit': 'लॉगिन',
    'login.or': 'या',
    'login.emailOtp': 'ईमेल OTP से लॉगिन करें (मुफ्त)',
    'login.noAccount': 'खाता नहीं है?',
    'login.signup': 'साइन अप करें',
    'login.error': 'अमान्य ईमेल या पासवर्ड',
    
    // Register Page
    'register.welcome': 'SewaBihar में शामिल हों',
    'register.subtitle': 'अपना खाता बनाएं और अपनी यात्रा शुरू करें',
    'register.title': 'खाता बनाएं',
    'register.name': 'पूरा नाम',
    'register.email': 'ईमेल पता',
    'register.phone': 'फोन नंबर',
    'register.password': 'पासवर्ड',
    'register.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'register.city': 'शहर',
    'register.selectCity': 'अपना शहर चुनें',
    'register.registerAs': 'के रूप में पंजीकरण करें',
    'register.customer': 'ग्राहक',
    'register.provider': 'प्रदाता',
    'register.language': 'पसंदीदा भाषा',
    'register.english': 'अंग्रेजी',
    'register.hindi': 'हिंदी',
    'register.submit': 'खाता बनाएं',
    'register.haveAccount': 'पहले से खाता है?',
    'register.login': 'लॉगिन',
    'register.getLocation': 'मेरा स्थान प्राप्त करें',
    'register.selectRole': 'खाता प्रकार चुनें',
    'register.selectLanguage': 'भाषा चुनें',
    'register.verified': 'सत्यापित पेशेवर',
    'register.instant': 'तत्काल बुकिंग',
    'register.secure': 'सुरक्षित भुगतान',
    'register.support': '24/7 सहायता',
    'register.fillDetails': 'शुरू करने के लिए अपनी जानकारी भरें 🚀',
    'register.currentSelection': 'वर्तमान चयन:',
    'register.clickToChange': 'चयन बदलने के लिए ऊपर कार्ड पर क्लिक करें',
    'register.signupEmailOtp': 'ईमेल OTP के साथ साइन अप करें',
    'register.signIn': 'साइन इन',
    'register.passwordMismatch': 'पासवर्ड मेल नहीं खाते',
    'register.passwordMinLength': 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
    'register.fillAllFields': 'कृपया सभी आवश्यक फ़ील्ड भरें',
    
    // Hero Section
    'hero.tagline': 'Bihar का भरोसेमंद सेवा मंच',
    'hero.title': 'घर की हर सेवा',
    'hero.subtitle': 'एक क्लिक में',
    'hero.description': 'बिहार में सत्यापित सेवा पेशेवर खोजें',
    'hero.verified': '✓ सत्यापित',
    'hero.affordable': '✓ किफायती',
    'hero.reliable': '✓ भरोसेमंद',
    
    // Search
    'search.title': '🔍 आप कौन सी सेवा ढूंढ रहे हैं?',
    'search.placeholder': 'जैसे: प्लम्बर, इलेक्ट्रीशियन, सफाई...',
    'search.location': 'अपना शहर दर्ज करें',
    'search.button': 'अभी खोजें',
    'search.popular': 'लोकप्रिय:',
    
    // Stats
    'stats.providers': 'सत्यापित प्रदाता',
    'stats.customers': 'खुश ग्राहक',
    'stats.categories': 'सेवा श्रेणियां',
    'stats.rating': 'औसत रेटिंग',
    
    // Services
    'service.plumbing': 'प्लंबिंग',
    'service.electrical': 'बिजली मरम्मत',
    'service.cleaning': 'सफाई',
    'service.carpentry': 'बढ़ईगीरी',
    'service.ac': 'AC मरम्मत',
    'service.painting': 'पेंटिंग',
    'service.appliance': 'उपकरण मरम्मत',
    'service.other': 'अन्य सेवाएं',
    'service.providers': 'प्रदाता',
    
    // Sections
    'section.services.title': 'लोकप्रिय सेवाएं',
    'section.services.subtitle': 'हमारी पेशेवर सेवाओं की विस्तृत श्रृंखला से चुनें',
    'section.howItWorks.title': 'यह कैसे काम करता है',
    'section.howItWorks.subtitle': '4 सरल चरणों में शुरू करें',
    'section.providers.title': 'शीर्ष रेटेड प्रदाता',
    'section.providers.subtitle': 'SewaBihar द्वारा सत्यापित विश्वसनीय पेशेवर',
    
    // How It Works Steps
    'step1.title': '1. सेवा खोजें',
    'step1.desc': 'अपनी आवश्यकताओं के लिए सही सेवा प्रदाता खोजें',
    'step2.title': '2. अपॉइंटमेंट बुक करें',
    'step2.desc': 'अपने सुविधाजनक समय और स्थान पर शेड्यूल करें',
    'step3.title': '3. सेवा पूर्ण करवाएं',
    'step3.desc': 'सत्यापित पेशेवर आपका काम पूरा करते हैं',
    'step4.title': '4. रेटिंग और समीक्षा दें',
    'step4.desc': 'अपना अनुभव साझा करें और दूसरों की मदद करें',
    
    // Footer
    'footer.company': 'कंपनी',
    'footer.about': 'हमारे बारे में',
    'footer.careers': 'करियर',
    'footer.customers': 'ग्राहकों के लिए',
    'footer.browse': 'सेवाएं ब्राउज़ करें',
    'footer.howItWorks': 'यह कैसे काम करता है',
    'footer.providers': 'प्रदाताओं के लिए',
    'footer.join': 'प्रदाता के रूप में जुड़ें',
    'footer.contact': 'संपर्क',
    'footer.email': 'support@sewabihar.com',
    'footer.phone': '+91 98765 43210',
    'footer.contactUs': 'हमसे संपर्क करें',
    'footer.copyright': '© 2024 SewaBihar. सर्वाधिकार सुरक्षित। बिहार में ❤️ के साथ बनाया गया',
    
    // Dashboard
    'dashboard.provider.title': 'मेरा कार्यक्षेत्र',
    'dashboard.kyc.status': 'पहचान सत्यापन',
    'dashboard.kyc.verified': 'सत्यापित',
    'dashboard.kyc.complete': 'पूर्ण',
    'dashboard.kyc.pending': 'लंबित सत्यापन',
    'dashboard.kyc.underProcess': 'प्रक्रिया में',
    'dashboard.kyc.rejected': 'अस्वीकृत',
    'dashboard.kyc.notSubmitted': 'KYC जमा नहीं किया गया',
    'dashboard.kyc.verifiedOn': 'सत्यापित',
    'dashboard.kyc.pendingMsg': 'आपके दस्तावेज़ जांच के अधीन हैं। हम सत्यापन होने पर आपको सूचित करेंगे।',
    'dashboard.kyc.underProcessMsg': 'आपके KYC दस्तावेज़ जांच के अधीन हैं। सत्यापन प्रक्रिया में है। हम सत्यापन होने पर आपको सूचित करेंगे।',
    'dashboard.kyc.rejectedMsg': 'आपका KYC अस्वीकृत कर दिया गया है।',
    'dashboard.kyc.reUploadMsg': 'कृपया सुधार के साथ अपने दस्तावेज़ फिर से अपलोड करें।',
    'dashboard.kyc.notSubmittedMsg': 'बुकिंग प्राप्त करना शुरू करने और ग्राहकों का भरोसा बनाने के लिए अपना KYC सत्यापन पूरा करें।',
    'dashboard.kyc.submit': 'KYC जमा करें',
    'dashboard.kyc.viewStatus': 'स्थिति देखें',
    'dashboard.kyc.reUpload': 'दस्तावेज़ फिर से अपलोड करें',
    'dashboard.stats.totalBookings': 'कुल बुकिंग',
    'dashboard.stats.totalEarnings': 'कुल कमाई',
    'dashboard.stats.pendingBookings': 'लंबित बुकिंग',
    'dashboard.stats.averageRating': 'औसत रेटिंग',
    'dashboard.stats.completed': 'पूर्ण',
    'dashboard.stats.thisMonth': 'इस महीने',
    'dashboard.stats.needsAttention': 'ध्यान देने की आवश्यकता',
    'dashboard.stats.reviews': 'समीक्षाएं',
    'dashboard.tabs.overview': 'अवलोकन',
    'dashboard.tabs.bookings': 'बुकिंग',
    'dashboard.tabs.earnings': 'कमाई',
    'dashboard.tabs.services': 'मेरी सेवाएं',
    'dashboard.recentBookings': 'हाल की बुकिंग',
    'dashboard.viewAll': 'सभी देखें',
    'dashboard.quickActions': 'त्वरित कार्य',
    'dashboard.addService': 'नई सेवा जोड़ें',
    'dashboard.editProfile': 'प्रोफ़ाइल संपादित करें',
    'dashboard.kycStatus': 'KYC स्थिति',
    'dashboard.kycVerified': 'KYC सत्यापित',
    'dashboard.allBookings': 'सभी बुकिंग',
    'dashboard.pending': 'लंबित',
    'dashboard.customer': 'ग्राहक',
    'dashboard.service': 'सेवा',
    'dashboard.dateTime': 'तारीख & समय',
    'dashboard.amount': 'राशि',
    'dashboard.status': 'स्थिति',
    'dashboard.actions': 'कार्य',
    'dashboard.view': 'देखें',
    'dashboard.totalEarnings': 'कुल कमाई',
    'dashboard.allTimeEarnings': 'सभी समय की कमाई',
    'dashboard.monthlyEarnings': 'इस महीने की कमाई',
    'dashboard.earningsHistory': 'कमाई का इतिहास',
    'dashboard.date': 'तारीख',
    'dashboard.commission': 'कमीशन',
    'dashboard.netEarnings': 'शुद्ध कमाई',
    'dashboard.myServices': 'मेरी सेवाएं',
    'dashboard.servicesMsg': 'अपनी सेवाओं का प्रबंधन करें, मूल्य अपडेट करें और नई सेवाएं जोड़ें। केवल सत्यापित सेवाएं ग्राहकों को दिखाई जाती हैं।',
    'dashboard.basePrice': 'आधार मूल्य',
    'dashboard.active': 'सक्रिय',
    'dashboard.edit': 'संपादित करें',
    'dashboard.scheduled': 'निर्धारित समय',
    'dashboard.today': 'आज',
  },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // ✅ Helper function to get language from localStorage
  const getLanguageFromStorage = (): Language => {
    // Priority 1: Check localStorage (set from HomePage)
    const saved = localStorage.getItem('language');
    if (saved === 'hi' || saved === 'en') {
      return saved as Language;
    }
    
    // Priority 2: Check user profile
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.language) {
          const userLang = user.language.toLowerCase();
          const langPreference = (userLang === 'hindi' || userLang === 'hi') ? 'hi' : 'en';
          localStorage.setItem('language', langPreference); // Sync to localStorage
          return langPreference;
        }
      }
    } catch (e) {
    }
    
    // Priority 3: Default to English
    return 'en';
  };

  // ✅ CRITICAL: Initialize language state synchronously from localStorage
  // This ensures language is set BEFORE any component renders
  const [language, setLanguageState] = useState<Language>(() => {
    // Priority 1: Check localStorage (primary source)
    let saved = localStorage.getItem('language');
    
    // Priority 2: Check sessionStorage backup (even if localStorage exists)
    // This handles cases where localStorage was reset but sessionStorage still has the value
    try {
      const sessionLang = sessionStorage.getItem('language');
      
      // If localStorage is 'en' but sessionStorage is 'hi', prefer sessionStorage (user selected Hindi)
      if (saved === 'en' && sessionLang === 'hi') {
        localStorage.setItem('language', 'hi');
        saved = 'hi';
      } else if (!saved || (saved !== 'hi' && saved !== 'en')) {
        // If localStorage is missing/invalid, use sessionStorage
        if (sessionLang === 'hi' || sessionLang === 'en') {
          localStorage.setItem('language', sessionLang);
          saved = sessionLang;
        }
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }
    
    if (saved === 'hi' || saved === 'en') {
      return saved as Language;
    }
    
    // Priority 3: Fallback: Check user profile, then default to English
    const fallbackLang = getLanguageFromStorage();
    
    // ✅ CRITICAL: Save fallback language to BOTH localStorage AND sessionStorage
    if (fallbackLang === 'hi' || fallbackLang === 'en') {
      localStorage.setItem('language', fallbackLang);
      try {
        sessionStorage.setItem('language', fallbackLang);
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    
    return fallbackLang;
  });
  
  // ✅ Always sync language from localStorage on mount AND when language changes
  useEffect(() => {
    // Force read from localStorage to ensure we have the latest value
    const saved = localStorage.getItem('language');
    
    if (saved === 'hi' || saved === 'en') {
      if (saved !== language) {
        setLanguageState(saved as Language);
      } else {
      }
    } else {
      // Check user profile as fallback
      const currentLang = getLanguageFromStorage();
      if (currentLang !== language) {
        setLanguageState(currentLang);
      }
    }
  }, []); // Run on mount
  
  // ✅ Also sync when localStorage changes (for immediate updates)
  useEffect(() => {
    const checkLanguage = () => {
      const saved = localStorage.getItem('language');
      if (saved === 'hi' || saved === 'en') {
        if (saved !== language) {
          setLanguageState(saved as Language);
        }
      }
    };
    
    // Check immediately
    checkLanguage();
    
    // Check periodically (for same-tab updates)
    const interval = setInterval(checkLanguage, 200);
    
    return () => clearInterval(interval);
  }, [language]);

  // ✅ Listen for storage changes (cross-tab and same-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        const newLang = e.newValue as Language;
        if (newLang === 'hi' || newLang === 'en') {
          if (newLang !== language) {
            setLanguageState(newLang);
          }
        }
      }
    };
    
    // Custom event for same-tab updates
    const handleCustomLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail as Language;
      if (newLang === 'hi' || newLang === 'en') {
        if (newLang !== language) {
          setLanguageState(newLang);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged' as any, handleCustomLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged' as any, handleCustomLanguageChange as EventListener);
    };
  }, [language]);

  const setLanguage = (lang: Language) => {
    
    setLanguageState(lang);
    
    // ✅ CRITICAL: Save to BOTH localStorage AND sessionStorage for redundancy
    localStorage.setItem('language', lang);
    try {
      sessionStorage.setItem('language', lang); // Backup in sessionStorage
      // Backup saved
    } catch (e) {
      // Ignore sessionStorage errors
    }
    
    // ✅ Verify it was saved
    
    // ✅ Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    
    // ✅ Also update user's language preference if user is logged in
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.language = lang === 'hi' ? 'Hindi' : 'English';
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (e) {
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

