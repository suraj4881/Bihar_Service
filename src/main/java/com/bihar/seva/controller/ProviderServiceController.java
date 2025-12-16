package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.ProviderService;
import com.bihar.seva.service.ProviderServiceManagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/providers/services")
@CrossOrigin(origins = "*")
public class ProviderServiceController {
    
    private static final Logger logger = LoggerFactory.getLogger(ProviderServiceController.class);
    
    @Autowired
    private ProviderServiceManagementService serviceManagementService;
    
    /**
     * Upload new service (Provider only)
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ProviderService>> uploadService(
            @RequestParam("providerId") String providerId,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("basePrice") Double basePrice,
            @RequestParam("expertiseLevel") String expertiseLevel,
            @RequestParam(value = "estimatedDuration", required = false) String estimatedDuration,
            @RequestParam(value = "serviceArea", required = false) String serviceArea,
            @RequestParam(value = "tags", required = false) String tagsJson,
            @RequestParam(value = "serviceImage0", required = false) MultipartFile image0,
            @RequestParam(value = "serviceImage1", required = false) MultipartFile image1,
            @RequestParam(value = "serviceImage2", required = false) MultipartFile image2,
            @RequestParam(value = "serviceImage3", required = false) MultipartFile image3,
            @RequestParam(value = "serviceImage4", required = false) MultipartFile image4
    ) {
        try {
            logger.info("Service upload request from provider: {}", providerId);
            
            ProviderService serviceData = new ProviderService();
            serviceData.setProviderId(providerId);
            serviceData.setTitle(title);
            serviceData.setDescription(description);
            serviceData.setCategory(category);
            serviceData.setBasePrice(basePrice);
            serviceData.setExpertiseLevel(expertiseLevel);
            serviceData.setEstimatedDuration(estimatedDuration);
            serviceData.setServiceArea(serviceArea);
            
            // Parse tags if provided
            if (tagsJson != null && !tagsJson.isEmpty()) {
                // Simple JSON parsing (can use ObjectMapper for complex cases)
                List<String> tags = new ArrayList<>();
                // Remove brackets and quotes, split by comma
                String cleanJson = tagsJson.replaceAll("[\\[\\]\"]", "");
                if (!cleanJson.isEmpty()) {
                    String[] tagArray = cleanJson.split(",");
                    for (String tag : tagArray) {
                        tags.add(tag.trim());
                    }
                }
                serviceData.setTags(tags);
            }
            
            // Collect uploaded images
            List<MultipartFile> images = new ArrayList<>();
            if (image0 != null && !image0.isEmpty()) images.add(image0);
            if (image1 != null && !image1.isEmpty()) images.add(image1);
            if (image2 != null && !image2.isEmpty()) images.add(image2);
            if (image3 != null && !image3.isEmpty()) images.add(image3);
            if (image4 != null && !image4.isEmpty()) images.add(image4);
            
            ProviderService savedService = serviceManagementService.uploadService(serviceData, images);
            logger.info("Service uploaded successfully by provider: {}", providerId);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Service uploaded successfully. Waiting for admin approval.", savedService));
            
        } catch (Exception e) {
            logger.error("Service upload failed for provider: {}", providerId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Service upload failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get services by provider (Provider view - shows base price)
     */
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<List<ProviderService>>> getProviderServices(@PathVariable String providerId) {
        logger.info("Fetching services for provider: {}", providerId);
        
        List<ProviderService> services = serviceManagementService.getServicesByProvider(providerId);
        
        // Provider can see their base price and commission breakdown
        logger.info("Found {} services for provider: {}", services.size(), providerId);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Services retrieved", services));
    }
    
    /**
     * Get all approved services (Customer view - shows final price only)
     */
    @GetMapping("/approved")
    public ResponseEntity<ApiResponse<List<ProviderService>>> getApprovedServices() {
        logger.info("Fetching approved services for customers");
        
        List<ProviderService> services = serviceManagementService.getApprovedServices();
        
        // Hide base price and commission details from customers
        services.forEach(service -> {
            service.setBasePrice(null);
            service.setCommissionAmount(null);
            service.setCommissionRate(null);
        });
        
        logger.info("Found {} approved services", services.size());
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Approved services retrieved", services));
    }
    
    /**
     * Get services by category (Customer view)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ProviderService>>> getServicesByCategory(@PathVariable String category) {
        logger.info("Fetching services for category: {}", category);
        
        List<ProviderService> services = serviceManagementService.getServicesByCategory(category);
        
        // Filter only approved and active services for customers
        services = services.stream()
                .filter(s -> s.getIsApproved() && s.getIsActive())
                .peek(service -> {
                    // Hide pricing breakdown from customers
                    service.setBasePrice(null);
                    service.setCommissionAmount(null);
                    service.setCommissionRate(null);
                })
                .toList();
        
        logger.info("Found {} approved services in category: {}", services.size(), category);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Services retrieved", services));
    }
    
    /**
     * Get service by ID with role-based pricing
     */
    @GetMapping("/{serviceId}")
    public ResponseEntity<ApiResponse<ProviderService>> getServiceById(
            @PathVariable String serviceId,
            @RequestParam(required = false) String role
    ) {
        logger.info("Fetching service: {}, role: {}", serviceId, role);
        
        ProviderService service = serviceManagementService.getServiceById(serviceId);
        
        if (service == null) {
            logger.warn("Service not found: {}", serviceId);
            return ResponseEntity.ok(new ApiResponse<>(false, "Service not found", null));
        }
        
        // Hide pricing breakdown from customers
        if (!"PROVIDER".equals(role) && !"ADMIN".equals(role)) {
            service.setBasePrice(null);
            service.setCommissionAmount(null);
            service.setCommissionRate(null);
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Service found", service));
    }
    
    /**
     * Get pending services (Admin only)
     */
    @GetMapping("/admin/pending")
    public ResponseEntity<ApiResponse<List<ProviderService>>> getPendingServices() {
        logger.info("Fetching pending services for admin review");
        
        List<ProviderService> services = serviceManagementService.getPendingServices();
        logger.info("Found {} pending services", services.size());
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending services retrieved", services));
    }
    
    /**
     * Approve service (Admin only)
     */
    @PostMapping("/admin/approve/{serviceId}")
    public ResponseEntity<ApiResponse<ProviderService>> approveService(
            @PathVariable String serviceId,
            @RequestParam String adminId
    ) {
        try {
            logger.info("Service approval request for: {} by admin: {}", serviceId, adminId);
            
            ProviderService approvedService = serviceManagementService.approveService(serviceId, adminId);
            logger.info("Service approved: {}", serviceId);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Service approved successfully", approvedService));
            
        } catch (Exception e) {
            logger.error("Service approval failed for: {}", serviceId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Approval failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Reject service (Admin only)
     */
    @PostMapping("/admin/reject/{serviceId}")
    public ResponseEntity<ApiResponse<ProviderService>> rejectService(
            @PathVariable String serviceId,
            @RequestParam String adminId,
            @RequestParam String reason
    ) {
        try {
            logger.info("Service rejection request for: {} by admin: {}, reason: {}", serviceId, adminId, reason);
            
            ProviderService rejectedService = serviceManagementService.rejectService(serviceId, adminId, reason);
            logger.info("Service rejected: {}", serviceId);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Service rejected", rejectedService));
            
        } catch (Exception e) {
            logger.error("Service rejection failed for: {}", serviceId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Rejection failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Update commission rate (Admin only)
     */
    @PostMapping("/admin/commission/{serviceId}")
    public ResponseEntity<ApiResponse<ProviderService>> updateCommissionRate(
            @PathVariable String serviceId,
            @RequestParam Double commissionRate
    ) {
        try {
            logger.info("Commission rate update request for service: {}, new rate: {}%", serviceId, commissionRate);
            
            ProviderService updatedService = serviceManagementService.updateCommissionRate(serviceId, commissionRate);
            logger.info("Commission rate updated for service: {}", serviceId);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Commission rate updated", updatedService));
            
        } catch (Exception e) {
            logger.error("Commission rate update failed for: {}", serviceId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Update failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get pending services count (Admin dashboard)
     */
    @GetMapping("/admin/pending-count")
    public ResponseEntity<ApiResponse<Long>> getPendingServicesCount() {
        logger.info("Fetching pending services count");
        
        Long count = serviceManagementService.getPendingServicesCount();
        logger.info("Pending services count: {}", count);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending services count", count));
    }
}

