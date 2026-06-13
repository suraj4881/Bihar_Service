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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final DynamicServiceRepository dynamicServiceRepository;
    private final AadhaarDocumentRepository aadhaarDocumentRepository;
    private final PANDocumentRepository panDocumentRepository;
    private final SelfieDocumentRepository selfieDocumentRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User stats
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long verifiedUsers = userRepository.countByIsVerified(true);
        
        // Provider stats (users with PROVIDER role)
        long totalProviders = userRepository.findAll().stream()
            .filter(u -> "PROVIDER".equals(u.getRole()))
            .count();
        long activeProviders = userRepository.findAll().stream()
            .filter(u -> "PROVIDER".equals(u.getRole()) && u.isActive())
            .count();
        long verifiedProviders = userRepository.findAll().stream()
            .filter(u -> "PROVIDER".equals(u.getRole()) && u.isVerified())
            .count();
        
        // KYC stats - count from separate collections (Aadhaar, PAN, Selfie)
        long pendingAadhaar = aadhaarDocumentRepository.countByStatus(AadhaarDocument.VerificationStatus.PENDING);
        long pendingPAN = panDocumentRepository.countByStatus(PANDocument.VerificationStatus.PENDING);
        long pendingSelfie = selfieDocumentRepository.countByStatus(SelfieDocument.VerificationStatus.PENDING);
        long underReviewAadhaar = aadhaarDocumentRepository.countByStatus(AadhaarDocument.VerificationStatus.UNDER_REVIEW);
        long underReviewPAN = panDocumentRepository.countByStatus(PANDocument.VerificationStatus.UNDER_REVIEW);
        long underReviewSelfie = selfieDocumentRepository.countByStatus(SelfieDocument.VerificationStatus.UNDER_REVIEW);
        
        // Count unique users with pending/under review documents
        java.util.Set<String> pendingUserIds = new java.util.HashSet<>();
        aadhaarDocumentRepository.findByStatus(AadhaarDocument.VerificationStatus.PENDING).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        panDocumentRepository.findByStatus(PANDocument.VerificationStatus.PENDING).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        selfieDocumentRepository.findByStatus(SelfieDocument.VerificationStatus.PENDING).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        aadhaarDocumentRepository.findByStatus(AadhaarDocument.VerificationStatus.UNDER_REVIEW).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        panDocumentRepository.findByStatus(PANDocument.VerificationStatus.UNDER_REVIEW).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        selfieDocumentRepository.findByStatus(SelfieDocument.VerificationStatus.UNDER_REVIEW).forEach(doc -> pendingUserIds.add(doc.getUserId()));
        
        long pendingKYC = pendingUserIds.size();
        
        // Verified and rejected counts from separate collections
        long verifiedAadhaar = aadhaarDocumentRepository.countByStatus(AadhaarDocument.VerificationStatus.VERIFIED);
        long verifiedPAN = panDocumentRepository.countByStatus(PANDocument.VerificationStatus.VERIFIED);
        long verifiedSelfie = selfieDocumentRepository.countByStatus(SelfieDocument.VerificationStatus.VERIFIED);
        long verifiedKYC = Math.max(Math.max(verifiedAadhaar, verifiedPAN), verifiedSelfie); // Approximate
        
        long rejectedAadhaar = aadhaarDocumentRepository.countByStatus(AadhaarDocument.VerificationStatus.REJECTED);
        long rejectedPAN = panDocumentRepository.countByStatus(PANDocument.VerificationStatus.REJECTED);
        long rejectedSelfie = selfieDocumentRepository.countByStatus(SelfieDocument.VerificationStatus.REJECTED);
        long rejectedKYC = rejectedAadhaar + rejectedPAN + rejectedSelfie;
        
        // Booking stats
        long totalBookings = bookingRepository.count();
        long todayBookings = bookingRepository.countByCreatedAtAfter(
            LocalDateTime.now().truncatedTo(ChronoUnit.DAYS)
        );
        long pendingBookings = bookingRepository.countByStatus("PENDING");
        long confirmedBookings = bookingRepository.countByStatus("CONFIRMED");
        long completedBookings = bookingRepository.countByStatus("COMPLETED");
        
        // Revenue stats (prefer totalAmount; some bookings use price only)
        List<Booking> allBookings = bookingRepository.findAll();
        double totalRevenue = allBookings.stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()))
            .mapToDouble(AdminService::bookingRevenueAmount)
            .sum();
        
        double todayRevenue = allBookings.stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()) && 
                b.getCompletedDate() != null &&
                b.getCompletedDate().isAfter(LocalDateTime.now().truncatedTo(ChronoUnit.DAYS)))
            .mapToDouble(AdminService::bookingRevenueAmount)
            .sum();
        
        // Review stats
        long totalReviews = reviewRepository.count();
        long pendingReviews = reviewRepository.findByIsApproved(false).size();
        
        // Calculate total customers (users with role CUSTOMER)
        long totalCustomers = userRepository.findAll().stream()
            .filter(u -> "CUSTOMER".equals(u.getRole()))
            .count();
        
        stats.put("totalUsers", totalUsers);
        stats.put("totalCustomers", totalCustomers);
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
        
        // Active services count (from dynamic services collection)
        long activeServices = dynamicServiceRepository.findAll().stream()
            .filter(s -> Boolean.TRUE.equals(s.getIsActive()) && Boolean.TRUE.equals(s.getIsApproved()))
            .count();
        stats.put("activeServices", activeServices);
        
        // Dynamic services stats
        long totalDynamicServices = dynamicServiceRepository.count();
        long pendingDynamicServices = dynamicServiceRepository.findByIsApprovedFalse().size();
        stats.put("totalDynamicServices", totalDynamicServices);
        stats.put("pendingDynamicServices", pendingDynamicServices);
        
        log.info("Admin dashboard stats: totalUsers={}, totalProviders={}, totalRevenue={}", totalUsers, totalProviders, totalRevenue);
        return stats;
    }

    private static double bookingRevenueAmount(Booking b) {
        if (b.getTotalAmount() > 0) {
            return b.getTotalAmount();
        }
        if (b.getTotalPrice() > 0) {
            return b.getTotalPrice();
        }
        return b.getPrice();
    }
    
    public List<User> getAllUsers() {
        // Return only CUSTOMER and PROVIDER users, exclude ADMIN users
        List<User> allUsers = userRepository.findAll();
        log.info("Total users in database: {}", allUsers.size());
        
        List<User> filteredUsers = allUsers.stream()
            .filter(user -> {
                boolean isNotAdmin = !"ADMIN".equalsIgnoreCase(user.getRole());
                if (!isNotAdmin) {
                    log.debug("Filtering out ADMIN user: {} ({})", user.getEmail(), user.getRole());
                }
                return isNotAdmin;
            })
            .collect(Collectors.toList());
        
        log.info("Filtered users (excluding ADMIN): {}", filteredUsers.size());
        return filteredUsers;
    }
    
    public List<User> getAllProviders() {
        // Get all users with PROVIDER role
        return userRepository.findAll().stream()
            .filter(u -> "PROVIDER".equals(u.getRole()))
            .collect(Collectors.toList());
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
    
    public User toggleProviderStatus(String providerId) {
        User user = userRepository.findById(providerId)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        
        if (!"PROVIDER".equals(user.getRole())) {
            throw new RuntimeException("User is not a provider");
        }
        
        user.setActive(!user.isActive());
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }
    
    // Get all payments (transactions)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }
    
    // Get all wallet transactions
    public List<WalletTransaction> getAllWalletTransactions() {
        return walletTransactionRepository.findAll();
    }
    
    // Get commission stats
    public Map<String, Object> getCommissionStats() {
        Map<String, Object> commissionStats = new HashMap<>();
        
        List<Payment> allPayments = paymentRepository.findAll();
        
        // Calculate total commission from commissionAmount field
        double totalCommission = allPayments.stream()
            .filter(p -> p.getCommissionAmount() != null)
            .mapToDouble(Payment::getCommissionAmount)
            .sum();
        
        // Calculate total revenue from paid payments
        double totalRevenue = allPayments.stream()
            .filter(p -> "PAID".equals(p.getPaymentStatus()) && p.getTotalAmount() != null)
            .mapToDouble(Payment::getTotalAmount)
            .sum();
        
        // Calculate average commission rate
        double averageCommissionRate = allPayments.stream()
            .filter(p -> p.getCommissionRate() != null)
            .mapToDouble(Payment::getCommissionRate)
            .average()
            .orElse(10.0); // Default 10%
        
        commissionStats.put("totalCommission", totalCommission);
        commissionStats.put("totalRevenue", totalRevenue);
        commissionStats.put("averageCommissionRate", averageCommissionRate);
        commissionStats.put("totalTransactions", allPayments.size());
        
        return commissionStats;
    }
}

