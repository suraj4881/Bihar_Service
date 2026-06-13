package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.DynamicService;
import com.bihar.seva.service.DynamicServiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    
    private final DynamicServiceService dynamicServiceService;
    
    // Search dynamic services
    @GetMapping("/services")
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
            
            // Priority: GPS > Pincode > City > Text search
            if (latitude != null && longitude != null) {
                // GPS-based search with radius
                services = dynamicServiceService.searchServices(query, latitude, longitude, radiusKm);
            } else if (pincode != null && !pincode.trim().isEmpty()) {
                // Pincode-based search
                services = dynamicServiceService.searchServicesByPincode(pincode.trim(), query, category);
            } else if (city != null && !city.trim().isEmpty()) {
                // City-based search
                services = dynamicServiceService.searchServicesByCity(city.trim(), query, category);
            } else {
                // Text search only
                services = dynamicServiceService.searchServices(query, null, null, null);
            }
            
            log.info("Found {} services", services.size());
            return ResponseEntity.ok(new ApiResponse(true, "Services found", services));
        } catch (Exception e) {
            log.error("Error searching services: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}

