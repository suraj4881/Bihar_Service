import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServiceSearchPage from './pages/ServiceSearchPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderDetailPage from './pages/ProviderDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import EmailOTPPage from './pages/EmailOTPPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProviderProfileSetup from './pages/ProviderProfileSetup';
import CustomerProfileSetup from './pages/CustomerProfileSetup';
import KYCVerificationPage from './pages/KYCVerificationPage';
import ProviderServiceUpload from './pages/ProviderServiceUpload';
import SupportRequestPage from './pages/SupportRequestPage';
import SupportDashboard from './pages/SupportDashboard';
import Footer from './components/Footer';
import AnalyticsTracker from './components/AnalyticsTracker';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LocationProvider>
            <Router>
                <AnalyticsTracker />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/email-otp" element={<EmailOTPPage />} />
                  <Route path="/email-verification" element={<EmailVerificationPage />} />
                  
                  {/* Profile Setup Routes */}
                  <Route 
                    path="/setup/provider" 
                    element={
                      <ProtectedRoute requiredRole="PROVIDER">
                        <ProviderProfileSetup />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/setup/customer" 
                    element={
                      <ProtectedRoute requiredRole="CUSTOMER">
                        <CustomerProfileSetup />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Public Search Route */}
                  <Route path="/search" element={<ServiceSearchPage />} />
                  <Route path="/provider/:id" element={<ProviderDetailPage />} />
                  
                  {/* Protected Routes - Require Login */}
                  <Route 
                    path="/services" 
                    element={
                      <ProtectedRoute>
                        <ServiceSearchPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/service/:id" 
                    element={
                      <ProtectedRoute>
                        <ServiceDetailPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/booking/:id" 
                    element={
                      <ProtectedRoute>
                        <BookingPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/kyc" 
                    element={
                      <ProtectedRoute>
                        <KYCVerificationPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/provider/upload-service" 
                    element={
                      <ProtectedRoute requiredRole="PROVIDER">
                        <ProviderServiceUpload />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/support"
                    element={
                      <ProtectedRoute>
                        <SupportRequestPage />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Customer Dashboard */}
                  <Route 
                    path="/customer-dashboard" 
                    element={
                      <ProtectedRoute requiredRole="CUSTOMER">
                        <CustomerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Provider Only Routes */}
                  <Route 
                    path="/provider-dashboard" 
                    element={
                      <ProtectedRoute requiredRole="PROVIDER">
                        <ProviderDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin Only Routes */}
                  <Route 
                    path="/admin-dashboard" 
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route
                    path="/support-dashboard"
                    element={
                      <ProtectedRoute requiredRole={['ADMIN', 'SUPPORT']}>
                        <SupportDashboard />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
                <Footer />
            </Router>
          </LocationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;