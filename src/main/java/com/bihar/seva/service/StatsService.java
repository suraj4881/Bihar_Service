package com.bihar.seva.service;

import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.ReviewRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
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
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final DynamicServiceRepository dynamicServiceRepository;
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Count total providers (users with PROVIDER role)
            long totalProviders = userRepository.findAll().stream()
                .filter(u -> "PROVIDER".equals(u.getRole()))
                .count();
            
            // Count verified providers
            long verifiedProviders = userRepository.findAll().stream()
                .filter(u -> "PROVIDER".equals(u.getRole()) && u.isVerified())
                .count();
            
            // Count total customers (users with CUSTOMER role)
            long totalCustomers = userRepository.findAll().stream()
                .filter(u -> "CUSTOMER".equals(u.getRole()))
                .count();
            
            // Count total bookings
            long totalBookings = bookingRepository.count();
            
            // Count completed bookings
            long completedBookings = bookingRepository.countByStatus("COMPLETED");
            
            // Count service categories (from dynamic services)
            long totalCategories = dynamicServiceRepository.findAll().stream()
                .map(com.bihar.seva.model.DynamicService::getCategory)
                .filter(cat -> cat != null && !cat.isEmpty())
                .distinct()
                .count();
            
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
            // Pending KYC is now handled via separate collections (Aadhaar, PAN, Selfie)
            long pendingKYC = 0; // TODO: Calculate from KYC collections
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

