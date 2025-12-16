package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Provider;
import com.bihar.seva.service.ProviderSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    
    private final ProviderSearchService searchService;
    
    // Advanced provider search with all filters
    @GetMapping("/providers")
    public ResponseEntity<ApiResponse> searchProviders(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) String sortBy) {
        try {
            Map<String, Object> filters = Map.of(
                "skill", skill != null ? skill : "",
                "city", city != null ? city : "",
                "district", district != null ? district : "",
                "verified", verified != null ? verified : false,
                "minRating", minRating != null ? minRating : 0.0,
                "maxPrice", maxPrice != null ? maxPrice : Double.MAX_VALUE,
                "minPrice", minPrice != null ? minPrice : 0.0,
                "sortBy", sortBy != null ? sortBy : "rating"
            );
            
            List<Provider> providers = searchService.searchProviders(filters);
            return ResponseEntity.ok(new ApiResponse(true, "Providers found", providers));
        } catch (Exception e) {
            log.error("Error searching providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get providers by category
    @GetMapping("/providers/category/{category}")
    public ResponseEntity<ApiResponse> getProvidersByCategory(@PathVariable String category) {
        try {
            List<Provider> providers = searchService.getProvidersByCategory(category);
            return ResponseEntity.ok(new ApiResponse(true, "Providers found", providers));
        } catch (Exception e) {
            log.error("Error fetching providers by category: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get top rated providers
    @GetMapping("/providers/top-rated")
    public ResponseEntity<ApiResponse> getTopRatedProviders(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Provider> providers = searchService.getTopRatedProviders(limit);
            return ResponseEntity.ok(new ApiResponse(true, "Top providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching top providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get nearby providers (by city for now, can be enhanced with coordinates)
    @GetMapping("/providers/nearby")
    public ResponseEntity<ApiResponse> getNearbyProviders(
            @RequestParam String city,
            @RequestParam(required = false) String skill) {
        try {
            List<Provider> providers = searchService.getNearbyProviders(city, skill);
            return ResponseEntity.ok(new ApiResponse(true, "Nearby providers found", providers));
        } catch (Exception e) {
            log.error("Error fetching nearby providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get recommended providers
    @GetMapping("/providers/recommended")
    public ResponseEntity<ApiResponse> getRecommendedProviders(
            @RequestParam(required = false) String userId) {
        try {
            List<Provider> providers = searchService.getRecommendedProviders(userId);
            return ResponseEntity.ok(new ApiResponse(true, "Recommended providers retrieved", providers));
        } catch (Exception e) {
            log.error("Error fetching recommended providers: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}

