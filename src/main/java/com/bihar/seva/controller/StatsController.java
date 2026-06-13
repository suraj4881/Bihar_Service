package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.service.StatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class StatsController {
    
    private final StatsService statsService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        try {
            Map<String, Object> stats = statsService.getDashboardStats();
            return ResponseEntity.ok(new ApiResponse<>(true, "Stats retrieved successfully", stats));
        } catch (Exception e) {
            log.error("Error fetching dashboard stats: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch stats: " + e.getMessage(), null));
        }
    }
    
    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats() {
        try {
            Map<String, Object> stats = statsService.getAdminStats();
            return ResponseEntity.ok(new ApiResponse<>(true, "Admin stats retrieved successfully", stats));
        } catch (Exception e) {
            log.error("Error fetching admin stats: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Failed to fetch admin stats: " + e.getMessage(), null));
        }
    }
}

