package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Wallet;
import com.bihar.seva.model.WalletTransaction;
import com.bihar.seva.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for Wallet operations
 */
@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class WalletController {
    
    private final WalletService walletService;
    
    /**
     * Get wallet balance
     */
    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBalance(Authentication authentication) {
        try {
            String userId = authentication.getName();
            Double balance = walletService.getBalance(userId);
            Wallet wallet = walletService.getOrCreateWallet(userId);
            
            Map<String, Object> walletInfo = Map.of(
                "balance", balance,
                "currency", wallet.getCurrency(),
                "isLocked", wallet.getIsLocked(),
                "isActive", wallet.getIsActive()
            );
            
            return ResponseEntity.ok(ApiResponse.success(walletInfo, "Balance retrieved"));
        } catch (Exception e) {
            log.error("Error getting wallet balance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get balance: " + e.getMessage()));
        }
    }
    
    /**
     * Add balance to wallet
     */
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Wallet>> addBalance(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            Double amount = Double.parseDouble(request.get("amount").toString());
            String description = request.getOrDefault("description", "Wallet top-up").toString();
            
            Wallet wallet = walletService.addBalance(userId, amount, description, "DEPOSIT");
            return ResponseEntity.ok(ApiResponse.success(wallet, "Balance added successfully"));
        } catch (Exception e) {
            log.error("Error adding balance: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to add balance: " + e.getMessage()));
        }
    }
    
    /**
     * Get transaction history
     */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<WalletTransaction>>> getTransactions(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<WalletTransaction> transactions = walletService.getTransactionHistory(userId);
            return ResponseEntity.ok(ApiResponse.success(transactions, "Transactions retrieved"));
        } catch (Exception e) {
            log.error("Error getting transactions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get transactions: " + e.getMessage()));
        }
    }
}
