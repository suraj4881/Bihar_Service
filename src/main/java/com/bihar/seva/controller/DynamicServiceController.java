package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.DynamicService;
import com.bihar.seva.service.DynamicServiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Dynamic Service operations
 */
@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class DynamicServiceController {
    
    private final DynamicServiceService serviceService;
    
    /**
     * Create a new service (Provider only)
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<DynamicService>> createService(
            @RequestBody DynamicService service,
            Authentication authentication) {
        try {
            String providerId = null;
            if (authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
                providerId = authentication.getName();
            } else if (service != null && service.getProviderId() != null && !service.getProviderId().isEmpty()) {
                providerId = service.getProviderId();
            }

            if (providerId == null || providerId.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Provider ID is required"));
            }
            DynamicService createdService = serviceService.createService(service, providerId);
            return ResponseEntity.ok(ApiResponse.success(createdService, "Service created successfully"));
        } catch (Exception e) {
            log.error("Error creating service: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to create service: " + e.getMessage()));
        }
    }
    
    /**
     * Get existing service names for auto-complete (to prevent duplicates)
     */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getServiceSuggestions(
            @RequestParam(required = false) String search) {
        try {
            List<String> suggestions = serviceService.getExistingServiceNames(search);
            return ResponseEntity.ok(ApiResponse.success(suggestions, "Service suggestions retrieved"));
        } catch (Exception e) {
            log.error("Error getting service suggestions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get suggestions: " + e.getMessage()));
        }
    }
    
    /**
     * Search services by location and radius
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DynamicService>>> searchServices(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm) {
        try {
            List<DynamicService> services;
            
            if (latitude != null && longitude != null) {
                services = serviceService.searchServices(query, latitude, longitude, radiusKm);
            } else if (pincode != null && !pincode.trim().isEmpty()) {
                services = serviceService.searchServicesByPincode(pincode.trim(), query, category);
            } else if (city != null && !city.trim().isEmpty()) {
                services = serviceService.searchServicesByCity(city.trim(), query, category);
            } else {
                services = serviceService.searchServices(query, null, null, null);
            }
            return ResponseEntity.ok(ApiResponse.success(services, "Services retrieved"));
        } catch (Exception e) {
            log.error("Error searching services: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to search services: " + e.getMessage()));
        }
    }

    /**
     * Get services by approval status (Admin)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DynamicService>>> getServices(
            @RequestParam(required = false) Boolean isApproved) {
        try {
            List<DynamicService> services = serviceService.getServicesByApproval(isApproved);
            return ResponseEntity.ok(ApiResponse.success(services, "Services retrieved"));
        } catch (Exception e) {
            log.error("Error getting services: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get services: " + e.getMessage()));
        }
    }
    
    /**
     * Get services by provider
     */
    @GetMapping("/provider/my-services")
    public ResponseEntity<ApiResponse<List<DynamicService>>> getMyServices(Authentication authentication) {
        try {
            if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Provider authentication required"));
            }
            String providerId = authentication.getName();
            List<DynamicService> services = serviceService.getServicesByProvider(providerId);
            return ResponseEntity.ok(ApiResponse.success(services, "Services retrieved"));
        } catch (Exception e) {
            log.error("Error getting provider services: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get services: " + e.getMessage()));
        }
    }

    /**
     * Get service by ID
     */
    @GetMapping("/{serviceId}")
    public ResponseEntity<ApiResponse<DynamicService>> getServiceById(@PathVariable String serviceId) {
        try {
            return serviceService.getServiceById(serviceId)
                .map(service -> ResponseEntity.ok(ApiResponse.success(service, "Service retrieved")))
                .orElseGet(() -> ResponseEntity.badRequest()
                    .body(ApiResponse.error("Service not found")));
        } catch (Exception e) {
            log.error("Error getting service: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get service: " + e.getMessage()));
        }
    }

    /**
     * Get services by provider ID (fallback for clients without auth)
     */
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<List<DynamicService>>> getServicesByProviderId(
            @PathVariable String providerId) {
        try {
            if (providerId == null || providerId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Provider ID is required"));
            }
            List<DynamicService> services = serviceService.getServicesByProvider(providerId.trim());
            return ResponseEntity.ok(ApiResponse.success(services, "Services retrieved"));
        } catch (Exception e) {
            log.error("Error getting provider services by ID: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get services: " + e.getMessage()));
        }
    }

    /**
     * Approve service (Admin)
     */
    @PutMapping("/{serviceId}/approve")
    public ResponseEntity<ApiResponse<DynamicService>> approveService(
            @PathVariable String serviceId,
            @RequestParam(required = false) String adminUserId) {
        try {
            DynamicService service = serviceService.approveService(serviceId, adminUserId);
            return ResponseEntity.ok(ApiResponse.success(service, "Service approved"));
        } catch (Exception e) {
            log.error("Error approving service: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to approve service: " + e.getMessage()));
        }
    }

    /**
     * Reject service (Admin)
     */
    @PutMapping("/{serviceId}/reject")
    public ResponseEntity<ApiResponse<DynamicService>> rejectService(
            @PathVariable String serviceId,
            @RequestBody(required = false) java.util.Map<String, String> request,
            @RequestParam(required = false) String adminUserId) {
        try {
            String reason = request != null ? request.getOrDefault("rejectionReason", "Rejected by admin") : "Rejected by admin";
            DynamicService service = serviceService.rejectService(serviceId, adminUserId, reason);
            return ResponseEntity.ok(ApiResponse.success(service, "Service rejected"));
        } catch (Exception e) {
            log.error("Error rejecting service: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to reject service: " + e.getMessage()));
        }
    }
    
    /**
     * Get existing services for auto-complete (with full details)
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<DynamicService>>> getAutocompleteServices(
            @RequestParam(required = false) String search) {
        try {
            List<DynamicService> services = serviceService.getExistingServicesForAutocomplete(search);
            return ResponseEntity.ok(ApiResponse.success(services, "Service suggestions retrieved"));
        } catch (Exception e) {
            log.error("Error getting autocomplete services: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get suggestions: " + e.getMessage()));
        }
    }
}
