package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.service.ProviderStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Provider-facing APIs (dashboard metrics, etc.)
 */
@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ProviderController {

    private final ProviderStatsService providerStatsService;

    /**
     * Dashboard stats used by the provider app (bookings, earnings, ratings).
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProviderStats(@RequestParam String providerId) {
        try {
            Map<String, Object> stats = providerStatsService.buildStats(providerId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Provider stats retrieved", stats));
        } catch (Exception e) {
            log.error("Error fetching provider stats: ", e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
