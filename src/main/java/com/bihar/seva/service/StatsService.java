package com.bihar.seva.service;

import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.ProviderRepository;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.ReviewRepository;
import com.bihar.seva.repositories.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {
    
    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Count total providers
            long totalProviders = providerRepository.count();
            
            // Count verified providers
            long verifiedProviders = providerRepository.countByIsVerified(true);
            
            // Count total customers (users who are not providers)
            long totalCustomers = userRepository.count();
            
            // Count total bookings
            long totalBookings = bookingRepository.count();
            
            // Count completed bookings
            long completedBookings = bookingRepository.countByStatus("COMPLETED");
            
            // Count service categories
            long totalCategories = serviceCategoryRepository.count();
            
            // Calculate average rating
            Double averageRating = reviewRepository.getAverageRating();
            if (averageRating == null) {
                averageRating = 0.0;
            }
            
            stats.put("totalProviders", totalProviders);
            stats.put("verifiedProviders", verifiedProviders);
            stats.put("totalCustomers", totalCustomers);
            stats.put("totalBookings", totalBookings);
            stats.put("completedBookings", completedBookings);
            stats.put("totalCategories", totalCategories > 0 ? totalCategories : 12); // Default 12 if not set
            stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
            
            log.info("Dashboard stats retrieved: {} providers, {} customers, {} bookings", 
                totalProviders, totalCustomers, totalBookings);
            
        } catch (Exception e) {
            log.error("Error calculating stats: ", e);
            // Return default stats if error
            stats.put("totalProviders", 0L);
            stats.put("verifiedProviders", 0L);
            stats.put("totalCustomers", 0L);
            stats.put("totalBookings", 0L);
            stats.put("completedBookings", 0L);
            stats.put("totalCategories", 12L);
            stats.put("averageRating", 0.0);
        }
        
        return stats;
    }
    
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = getDashboardStats();
        
        try {
            // Additional admin-specific stats
            long pendingKYC = providerRepository.countByKycStatus("PENDING");
            long pendingBookings = bookingRepository.countByStatus("PENDING");
            long activeBookings = bookingRepository.countByStatus("IN_PROGRESS");
            long todayBookings = bookingRepository.countTodayBookings();
            
            stats.put("pendingKYC", pendingKYC);
            stats.put("pendingBookings", pendingBookings);
            stats.put("activeBookings", activeBookings);
            stats.put("todayBookings", todayBookings);
            
        } catch (Exception e) {
            log.error("Error calculating admin stats: ", e);
        }
        
        return stats;
    }
}

