package com.bihar.seva.service;

import com.bihar.seva.model.*;
import com.bihar.seva.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    
    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final BookingRepository bookingRepository;
    private final KYCDocumentRepository kycDocumentRepository;
    private final ReviewRepository reviewRepository;
    private final EarningsRepository earningsRepository;
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User stats
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long verifiedUsers = userRepository.countByIsVerified(true);
        
        // Provider stats
        long totalProviders = providerRepository.count();
        long activeProviders = providerRepository.countByIsActive(true);
        long verifiedProviders = providerRepository.countByIsVerified(true);
        
        // KYC stats
        long pendingKYC = kycDocumentRepository.countByStatus(KYCDocument.VerificationStatus.PENDING);
        long verifiedKYC = kycDocumentRepository.countByStatus(KYCDocument.VerificationStatus.VERIFIED);
        long rejectedKYC = kycDocumentRepository.countByStatus(KYCDocument.VerificationStatus.REJECTED);
        
        // Booking stats
        long totalBookings = bookingRepository.count();
        long todayBookings = bookingRepository.countByCreatedAtAfter(
            LocalDateTime.now().truncatedTo(ChronoUnit.DAYS)
        );
        long pendingBookings = bookingRepository.countByStatus("PENDING");
        long confirmedBookings = bookingRepository.countByStatus("CONFIRMED");
        long completedBookings = bookingRepository.countByStatus("COMPLETED");
        
        // Revenue stats
        List<Booking> allBookings = bookingRepository.findAll();
        double totalRevenue = allBookings.stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()))
            .mapToDouble(Booking::getPrice)
            .sum();
        
        double todayRevenue = allBookings.stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()) && 
                b.getCompletedDate() != null &&
                b.getCompletedDate().isAfter(LocalDateTime.now().truncatedTo(ChronoUnit.DAYS)))
            .mapToDouble(Booking::getPrice)
            .sum();
        
        // Review stats
        long totalReviews = reviewRepository.count();
        long pendingReviews = reviewRepository.findByIsApproved(false).size();
        
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("verifiedUsers", verifiedUsers);
        
        stats.put("totalProviders", totalProviders);
        stats.put("activeProviders", activeProviders);
        stats.put("verifiedProviders", verifiedProviders);
        
        stats.put("pendingKYC", pendingKYC);
        stats.put("verifiedKYC", verifiedKYC);
        stats.put("rejectedKYC", rejectedKYC);
        
        stats.put("totalBookings", totalBookings);
        stats.put("todayBookings", todayBookings);
        stats.put("pendingBookings", pendingBookings);
        stats.put("confirmedBookings", confirmedBookings);
        stats.put("completedBookings", completedBookings);
        
        stats.put("totalRevenue", totalRevenue);
        stats.put("todayRevenue", todayRevenue);
        
        stats.put("totalReviews", totalReviews);
        stats.put("pendingReviews", pendingReviews);
        
        return stats;
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    public List<Provider> getAllProviders() {
        return providerRepository.findAll();
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public User toggleUserStatus(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(!user.isActive());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    public Provider toggleProviderStatus(String providerId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        
        provider.setActive(!provider.isActive());
        provider.setUpdatedAt(LocalDateTime.now());
        
        return providerRepository.save(provider);
    }
}

