package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.*;
import com.bihar.seva.service.AdminService;
import com.bihar.seva.service.KYCService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminController {
    
    private final AdminService adminService;
    private final KYCService kycService;
    private final com.bihar.seva.repositories.AadhaarDocumentRepository aadhaarDocumentRepository;
    private final com.bihar.seva.repositories.PANDocumentRepository panDocumentRepository;
    private final com.bihar.seva.repositories.SelfieDocumentRepository selfieDocumentRepository;
    
    // Dashboard Stats
    @GetMapping({"/stats", "/dashboard/stats"})
    public ResponseEntity<ApiResponse> getDashboardStats() {
        try {
            Map<String, Object> stats = adminService.getDashboardStats();
            return ResponseEntity.ok(new ApiResponse(true, "Dashboard stats retrieved", stats));
        } catch (Exception e) {
            log.error("Error fetching dashboard stats: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching stats: " + e.getMessage(), null));
        }
    }
    
    // Dashboard Stats (alternative endpoint for compatibility)
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse> getDashboardStatsAlt() {
        return getDashboardStats();
    }
    
    // User Management
    @GetMapping("/users")
    public ResponseEntity<ApiResponse> getAllUsers() {
        try {
            List<User> users = adminService.getAllUsers();
            return ResponseEntity.ok(new ApiResponse(true, "Users retrieved", users));
        } catch (Exception e) {
            log.error("Error fetching users: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching users: " + e.getMessage(), null));
        }
    }
    
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<ApiResponse> toggleUserStatus(@PathVariable String userId) {
        try {
            User user = adminService.toggleUserStatus(userId);
            return ResponseEntity.ok(new ApiResponse(true, "User status updated", user));
        } catch (Exception e) {
            log.error("Error toggling user status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Provider Management
    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<List<User>>> getAllProviders() {
        try {
            List<User> providers = adminService.getAllProviders();
            return ResponseEntity.ok(new ApiResponse<>(true, "Providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching providers: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching providers: " + e.getMessage(), null));
        }
    }
    
    @PutMapping("/providers/{providerId}/toggle-status")
    public ResponseEntity<ApiResponse<User>> toggleProviderStatus(@PathVariable String providerId) {
        try {
            User provider = adminService.toggleProviderStatus(providerId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Provider status updated", provider));
        } catch (Exception e) {
            log.error("Error toggling provider status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    // Debug endpoint - Get ALL documents
    @GetMapping("/kyc/debug")
    public ResponseEntity<ApiResponse> debugKYC() {
        try {
            log.debug("Debug endpoint called for KYC documents");
            
            List<com.bihar.seva.model.AadhaarDocument> allAadhaar = aadhaarDocumentRepository.findAll();
            List<com.bihar.seva.model.PANDocument> allPAN = panDocumentRepository.findAll();
            List<com.bihar.seva.model.SelfieDocument> allSelfie = selfieDocumentRepository.findAll();
            
            java.util.Map<String, Object> debugInfo = new java.util.HashMap<>();
            debugInfo.put("totalAadhaar", allAadhaar.size());
            debugInfo.put("totalPAN", allPAN.size());
            debugInfo.put("totalSelfie", allSelfie.size());
            
            long pendingAadhaar = allAadhaar.stream().filter(d -> d.getStatus() == null || 
                d.getStatus() == com.bihar.seva.model.AadhaarDocument.VerificationStatus.PENDING ||
                d.getStatus() == com.bihar.seva.model.AadhaarDocument.VerificationStatus.UNDER_REVIEW).count();
            long pendingPAN = allPAN.stream().filter(d -> d.getStatus() == null || 
                d.getStatus() == com.bihar.seva.model.PANDocument.VerificationStatus.PENDING ||
                d.getStatus() == com.bihar.seva.model.PANDocument.VerificationStatus.UNDER_REVIEW).count();
            long pendingSelfie = allSelfie.stream().filter(d -> d.getStatus() == null || 
                d.getStatus() == com.bihar.seva.model.SelfieDocument.VerificationStatus.PENDING ||
                d.getStatus() == com.bihar.seva.model.SelfieDocument.VerificationStatus.UNDER_REVIEW).count();
            
            debugInfo.put("pendingAadhaar", pendingAadhaar);
            debugInfo.put("pendingPAN", pendingPAN);
            debugInfo.put("pendingSelfie", pendingSelfie);
            
            java.util.List<java.util.Map<String, Object>> sampleAadhaar = new java.util.ArrayList<>();
            for (com.bihar.seva.model.AadhaarDocument doc : allAadhaar) {
                java.util.Map<String, Object> docInfo = new java.util.HashMap<>();
                docInfo.put("userId", doc.getUserId());
                docInfo.put("status", doc.getStatus() != null ? doc.getStatus().name() : "NULL");
                docInfo.put("statusType", doc.getStatus() != null ? doc.getStatus().getClass().getName() : "null");
                sampleAadhaar.add(docInfo);
            }
            debugInfo.put("sampleAadhaar", sampleAadhaar);
            
            List<com.bihar.seva.dto.PendingKYCRequest> pendingKYC = kycService.getPendingKYCRequests();
            debugInfo.put("serviceResultCount", pendingKYC.size());
            debugInfo.put("serviceResult", pendingKYC);
            
            log.debug("Debug info retrieved successfully");
            return ResponseEntity.ok(new ApiResponse(true, "Debug info", debugInfo));
        } catch (Exception e) {
            log.error("Error in debug endpoint", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error retrieving debug info: " + e.getMessage(), null));
        }
    }
    
    @GetMapping("/kyc/test-all")
    public ResponseEntity<ApiResponse> getAllKYCDocuments() {
        try {
            log.debug("Fetching all KYC documents");
            
            java.util.List<AadhaarDocument> allAadhaar = aadhaarDocumentRepository.findAll();
            java.util.List<PANDocument> allPAN = panDocumentRepository.findAll();
            java.util.List<SelfieDocument> allSelfie = selfieDocumentRepository.findAll();
            
            log.debug("Document counts - Aadhaar: {}, PAN: {}, Selfie: {}", 
                allAadhaar.size(), allPAN.size(), allSelfie.size());
            
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("aadhaarCount", allAadhaar.size());
            result.put("panCount", allPAN.size());
            result.put("selfieCount", allSelfie.size());
            
            java.util.List<java.util.Map<String, Object>> aadhaarList = new java.util.ArrayList<>();
            for (AadhaarDocument doc : allAadhaar) {
                java.util.Map<String, Object> docMap = new java.util.HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("userId", doc.getUserId());
                docMap.put("status", doc.getStatus() != null ? doc.getStatus().name() : "NULL");
                aadhaarList.add(docMap);
            }
            result.put("aadhaarDocuments", aadhaarList);
            
            java.util.List<java.util.Map<String, Object>> panList = new java.util.ArrayList<>();
            for (PANDocument doc : allPAN) {
                java.util.Map<String, Object> docMap = new java.util.HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("userId", doc.getUserId());
                docMap.put("status", doc.getStatus() != null ? doc.getStatus().name() : "NULL");
                panList.add(docMap);
            }
            result.put("panDocuments", panList);
            
            java.util.List<java.util.Map<String, Object>> selfieList = new java.util.ArrayList<>();
            for (SelfieDocument doc : allSelfie) {
                java.util.Map<String, Object> docMap = new java.util.HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("userId", doc.getUserId());
                docMap.put("status", doc.getStatus() != null ? doc.getStatus().name() : "NULL");
                selfieList.add(docMap);
            }
            result.put("selfieDocuments", selfieList);
            
            return ResponseEntity.ok(new ApiResponse(true, "All KYC documents", result));
        } catch (Exception e) {
            log.error("Error fetching all KYC documents", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error retrieving documents: " + e.getMessage(), null));
        }
    }
    
    // KYC Management
    @GetMapping("/kyc/pending")
    public ResponseEntity<ApiResponse> getPendingKYC() {
        try {
            log.info("Fetching pending KYC requests");
            
            long aadhaarCount = aadhaarDocumentRepository.count();
            long panCount = panDocumentRepository.count();
            long selfieCount = selfieDocumentRepository.count();
            log.debug("Collection counts - Aadhaar: {}, PAN: {}, Selfie: {}", 
                aadhaarCount, panCount, selfieCount);
            
            List<com.bihar.seva.dto.PendingKYCRequest> pendingKYC = kycService.getPendingKYCRequests();
            
            log.info("Found {} pending KYC requests", pendingKYC.size());
            if (pendingKYC.isEmpty()) {
                log.warn("No pending KYC requests found. All documents may be verified or rejected.");
            }
            
            return ResponseEntity.ok(new ApiResponse(true, "Pending KYC retrieved", pendingKYC));
        } catch (Exception e) {
            log.error("Error fetching pending KYC requests", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching KYC: " + e.getMessage(), null));
        }
    }
    
    // KYC approval/rejection is now handled via separate collections (Aadhaar, PAN, Selfie)
    // Use the approve/reject methods in KYCController for individual document types
    // Old endpoints removed - KYC is now managed through separate document collections
    
    // Booking Management
    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse> getAllBookings() {
        try {
            List<Booking> bookings = adminService.getAllBookings();
            return ResponseEntity.ok(new ApiResponse(true, "Bookings retrieved", bookings));
        } catch (Exception e) {
            log.error("Error fetching bookings: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching bookings: " + e.getMessage(), null));
        }
    }
    
    // Category Management - Basic CRUD using repository directly
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<com.bihar.seva.model.Category>>> getAllCategories() {
        try {
            // Use Category model (auto-generated from services)
            // TODO: Implement CategoryRepository if needed
            return ResponseEntity.ok(new ApiResponse<>(true, "Categories endpoint - use /api/services/categories", null));
        } catch (Exception e) {
            log.error("Error fetching categories: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching categories: " + e.getMessage(), null));
        }
    }
    
    // Transaction Management
    @GetMapping("/transactions/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        try {
            List<Payment> payments = adminService.getAllPayments();
            return ResponseEntity.ok(new ApiResponse<>(true, "Payments retrieved", payments));
        } catch (Exception e) {
            log.error("Error fetching payments: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching payments: " + e.getMessage(), null));
        }
    }
    
    @GetMapping("/transactions/wallet")
    public ResponseEntity<ApiResponse<List<WalletTransaction>>> getAllWalletTransactions() {
        try {
            List<WalletTransaction> transactions = adminService.getAllWalletTransactions();
            return ResponseEntity.ok(new ApiResponse<>(true, "Wallet transactions retrieved", transactions));
        } catch (Exception e) {
            log.error("Error fetching wallet transactions: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching wallet transactions: " + e.getMessage(), null));
        }
    }
    
    @GetMapping("/commission/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCommissionStats() {
        try {
            Map<String, Object> stats = adminService.getCommissionStats();
            return ResponseEntity.ok(new ApiResponse<>(true, "Commission stats retrieved", stats));
        } catch (Exception e) {
            log.error("Error fetching commission stats: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching commission stats: " + e.getMessage(), null));
        }
    }
}


