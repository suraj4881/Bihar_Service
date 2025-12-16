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
    
    // Dashboard Stats
    @GetMapping("/dashboard/stats")
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
    public ResponseEntity<ApiResponse> getAllProviders() {
        try {
            List<Provider> providers = adminService.getAllProviders();
            return ResponseEntity.ok(new ApiResponse(true, "Providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching providers: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching providers: " + e.getMessage(), null));
        }
    }
    
    @PutMapping("/providers/{providerId}/toggle-status")
    public ResponseEntity<ApiResponse> toggleProviderStatus(@PathVariable String providerId) {
        try {
            Provider provider = adminService.toggleProviderStatus(providerId);
            return ResponseEntity.ok(new ApiResponse(true, "Provider status updated", provider));
        } catch (Exception e) {
            log.error("Error toggling provider status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // KYC Management
    @GetMapping("/kyc/pending")
    public ResponseEntity<ApiResponse> getPendingKYC() {
        try {
            List<KYCDocument> pendingKYC = kycService.getPendingKYC();
            return ResponseEntity.ok(new ApiResponse(true, "Pending KYC retrieved", pendingKYC));
        } catch (Exception e) {
            log.error("Error fetching pending KYC: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse(false, "Error fetching KYC: " + e.getMessage(), null));
        }
    }
    
    @GetMapping("/kyc/{kycId}")
    public ResponseEntity<ApiResponse> getKYCDetails(@PathVariable String kycId) {
        try {
            Optional<KYCDocument> kycOpt = kycService.getKYCById(kycId);
            if (kycOpt.isPresent()) {
                return ResponseEntity.ok(new ApiResponse(true, "KYC details retrieved", kycOpt.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse(false, "KYC not found", null));
            }
        } catch (Exception e) {
            log.error("Error fetching KYC details: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    @PutMapping("/kyc/{kycId}/approve")
    public ResponseEntity<ApiResponse> approveKYC(
            @PathVariable String kycId,
            @RequestParam String adminId) {
        try {
            KYCDocument kyc = kycService.approveKYC(kycId, adminId);
            return ResponseEntity.ok(new ApiResponse(true, "KYC approved successfully", kyc));
        } catch (Exception e) {
            log.error("Error approving KYC: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    @PutMapping("/kyc/{kycId}/reject")
    public ResponseEntity<ApiResponse> rejectKYC(
            @PathVariable String kycId,
            @RequestParam String adminId,
            @RequestParam String reason) {
        try {
            KYCDocument kyc = kycService.rejectKYC(kycId, adminId, reason);
            return ResponseEntity.ok(new ApiResponse(true, "KYC rejected", kyc));
        } catch (Exception e) {
            log.error("Error rejecting KYC: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
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
    public ResponseEntity<ApiResponse<List<ServiceCategory>>> getAllCategories() {
        try {
            // TODO: Implement when ServiceCategoryService is ready
            return ResponseEntity.ok(new ApiResponse<>(true, "Categories endpoint coming soon", null));
        } catch (Exception e) {
            log.error("Error fetching categories: ", e);
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Error fetching categories: " + e.getMessage(), null));
        }
    }
}


