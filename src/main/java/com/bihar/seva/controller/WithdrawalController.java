package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.WithdrawalRequestDTO;
import com.bihar.seva.model.WithdrawalRequest;
import com.bihar.seva.service.WithdrawalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/withdrawals")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> requestWithdrawal(
        @RequestBody WithdrawalRequestDTO request) {
        try {
            WithdrawalRequest saved = withdrawalService.createRequest(request);
            return ResponseEntity.ok(ApiResponse.success(saved, "Withdrawal request created"));
        } catch (Exception e) {
            log.error("Withdrawal request failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to create withdrawal: " + e.getMessage()));
        }
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<List<WithdrawalRequest>>> getProviderWithdrawals(@PathVariable String providerId) {
        try {
            List<WithdrawalRequest> list = withdrawalService.getByProvider(providerId);
            return ResponseEntity.ok(ApiResponse.success(list, "Withdrawals retrieved"));
        } catch (Exception e) {
            log.error("Failed to fetch provider withdrawals", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch withdrawals: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WithdrawalRequest>>> getAllWithdrawals() {
        try {
            List<WithdrawalRequest> list = withdrawalService.getAll();
            return ResponseEntity.ok(ApiResponse.success(list, "All withdrawals retrieved"));
        } catch (Exception e) {
            log.error("Failed to fetch withdrawals", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to fetch withdrawals: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> updateStatus(
        @PathVariable String id,
        @RequestBody Map<String, String> body) {
        try {
            String status = body.getOrDefault("status", "PENDING");
            String remarks = body.get("remarks");
            WithdrawalRequest updated = withdrawalService.updateStatus(id, status, remarks);
            return ResponseEntity.ok(ApiResponse.success(updated, "Status updated"));
        } catch (Exception e) {
            log.error("Failed to update withdrawal status", e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update status: " + e.getMessage()));
        }
    }
}
