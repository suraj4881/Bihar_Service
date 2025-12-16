package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.bihar.seva.model.Provider;
import com.bihar.seva.model.Booking;
import com.bihar.seva.service.ProviderService;
import com.bihar.seva.service.KYCService;
import com.bihar.seva.service.BookingService;
import com.bihar.seva.service.EarningsService;
import com.bihar.seva.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProviderController {
    
    private final ProviderService providerService;
    private final KYCService kycService;
    private final BookingService bookingService;
    private final EarningsService earningsService;
    private final ReviewService reviewService;
    
    // Get all providers
    @GetMapping
    public ResponseEntity<ApiResponse> getAllProviders() {
        try {
            List<Provider> providers = providerService.getAllProviders();
            return ResponseEntity.ok(new ApiResponse(true, "Providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get verified providers
    @GetMapping("/verified")
    public ResponseEntity<ApiResponse> getVerifiedProviders() {
        try {
            List<Provider> providers = providerService.getVerifiedProviders();
            return ResponseEntity.ok(new ApiResponse(true, "Verified providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching verified providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get featured/top-rated providers
    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<Provider>>> getFeaturedProviders(
            @RequestParam(defaultValue = "6") int limit) {
        try {
            // Get top-rated verified providers
            List<Provider> providers = providerService.getVerifiedProviders().stream()
                .filter(Provider::isVerified)
                .sorted((p1, p2) -> Double.compare(p2.getRating(), p1.getRating()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Featured providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching featured providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    // Search providers by city
    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse> getProvidersByCity(@PathVariable String city) {
        try {
            List<Provider> providers = providerService.getProvidersByCity(city);
            return ResponseEntity.ok(new ApiResponse(true, "Providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching providers by city: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Search providers by skill
    @GetMapping("/skill/{skill}")
    public ResponseEntity<ApiResponse> getProvidersBySkill(@PathVariable String skill) {
        try {
            List<Provider> providers = providerService.getProvidersBySkill(skill);
            return ResponseEntity.ok(new ApiResponse(true, "Providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching providers by skill: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider by ID (Public Profile)
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getProviderById(@PathVariable String id) {
        try {
            Provider provider = providerService.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
            return ResponseEntity.ok(new ApiResponse(true, "Provider retrieved", provider));
        } catch (Exception e) {
            log.error("Error fetching provider: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Provider Dashboard
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<ApiResponse> getProviderDashboard(@PathVariable String id) {
        try {
            Map<String, Object> dashboard = providerService.getProviderDashboard(id);
            return ResponseEntity.ok(new ApiResponse(true, "Dashboard retrieved", dashboard));
        } catch (Exception e) {
            log.error("Error fetching provider dashboard: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider bookings
    @GetMapping("/{id}/bookings")
    public ResponseEntity<ApiResponse> getProviderBookings(
            @PathVariable String id,
            @RequestParam(required = false) String status) {
        try {
            List<Booking> bookings;
            if (status != null) {
                bookings = bookingService.getBookingsByProviderAndStatus(id, status);
            } else {
                bookings = bookingService.getBookingsByProvider(id);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Bookings retrieved", bookings));
        } catch (Exception e) {
            log.error("Error fetching provider bookings: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider earnings
    @GetMapping("/{id}/earnings")
    public ResponseEntity<ApiResponse> getProviderEarnings(@PathVariable String id) {
        try {
            Map<String, Object> earnings = earningsService.getProviderEarningsSummary(id);
            return ResponseEntity.ok(new ApiResponse(true, "Earnings retrieved", earnings));
        } catch (Exception e) {
            log.error("Error fetching provider earnings: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get earnings by period
    @GetMapping("/{id}/earnings/period")
    public ResponseEntity<ApiResponse> getEarningsByPeriod(
            @PathVariable String id,
            @RequestParam String period) {
        try {
            LocalDateTime start = LocalDateTime.now();
            LocalDateTime end = LocalDateTime.now();
            
            switch (period.toLowerCase()) {
                case "today":
                    start = LocalDateTime.now().toLocalDate().atStartOfDay();
                    break;
                case "week":
                    start = LocalDateTime.now().minusWeeks(1);
                    break;
                case "month":
                    start = LocalDateTime.now().minusMonths(1);
                    break;
                default:
                    start = LocalDateTime.now().minusMonths(1);
            }
            
            Map<String, Object> earnings = earningsService.getEarningsByPeriod(id, start, end);
            return ResponseEntity.ok(new ApiResponse(true, "Earnings retrieved", earnings));
        } catch (Exception e) {
            log.error("Error fetching earnings by period: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider reviews
    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse> getProviderReviews(@PathVariable String id) {
        try {
            var reviews = reviewService.getProviderReviews(id);
            return ResponseEntity.ok(new ApiResponse(true, "Reviews retrieved", reviews));
        } catch (Exception e) {
            log.error("Error fetching provider reviews: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Update provider profile
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateProvider(
            @PathVariable String id,
            @RequestBody Provider provider) {
        try {
            Provider updated = providerService.updateProvider(id, provider);
            return ResponseEntity.ok(new ApiResponse(true, "Provider updated", updated));
        } catch (Exception e) {
            log.error("Error updating provider: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Delete provider
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProvider(@PathVariable String id) {
        try {
            providerService.deleteProvider(id);
            return ResponseEntity.ok(new ApiResponse(true, "Provider deleted", null));
        } catch (Exception e) {
            log.error("Error deleting provider: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider KYC status
    @GetMapping("/{id}/kyc-status")
    public ResponseEntity<ApiResponse> getProviderKYCStatus(@PathVariable String id) {
        try {
            Object kycStatus = kycService.getKYCStatus(id);
            return ResponseEntity.ok(new ApiResponse(true, "KYC status retrieved", kycStatus));
        } catch (Exception e) {
            log.error("Error fetching KYC status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}
