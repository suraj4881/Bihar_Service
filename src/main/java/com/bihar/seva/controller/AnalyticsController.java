package com.bihar.seva.controller;

import com.bihar.seva.dto.AnalyticsEventRequest;
import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.AnalyticsEvent;
import com.bihar.seva.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<AnalyticsEvent>> trackEvent(
            @RequestBody AnalyticsEventRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            String ip = resolveClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            AnalyticsEvent event = analyticsService.trackEvent(request, ip, userAgent);
            return ResponseEntity.ok(new ApiResponse<>(true, "Event tracked", event));
        } catch (Exception e) {
            log.error("Failed to track analytics event", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to track event: " + e.getMessage(), null));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(@RequestParam(defaultValue = "7") int days) {
        try {
            Map<String, Object> summary = analyticsService.getSummary(days);
            return ResponseEntity.ok(new ApiResponse<>(true, "Summary retrieved", summary));
        } catch (Exception e) {
            log.error("Failed to get analytics summary", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to get summary: " + e.getMessage(), null));
        }
    }

    @GetMapping("/traffic")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTraffic(@RequestParam(defaultValue = "7") int days) {
        try {
            List<Map<String, Object>> traffic = analyticsService.getTraffic(days);
            return ResponseEntity.ok(new ApiResponse<>(true, "Traffic retrieved", traffic));
        } catch (Exception e) {
            log.error("Failed to get analytics traffic", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to get traffic: " + e.getMessage(), null));
        }
    }

    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDevices(@RequestParam(defaultValue = "7") int days) {
        try {
            Map<String, Object> devices = analyticsService.getDevices(days);
            return ResponseEntity.ok(new ApiResponse<>(true, "Devices retrieved", devices));
        } catch (Exception e) {
            log.error("Failed to get analytics devices", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to get devices: " + e.getMessage(), null));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<AnalyticsEvent>>> getRecent(@RequestParam(defaultValue = "20") int limit) {
        try {
            List<AnalyticsEvent> events = analyticsService.getRecent(limit);
            return ResponseEntity.ok(new ApiResponse<>(true, "Recent events retrieved", events));
        } catch (Exception e) {
            log.error("Failed to get recent events", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to get recent events: " + e.getMessage(), null));
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
