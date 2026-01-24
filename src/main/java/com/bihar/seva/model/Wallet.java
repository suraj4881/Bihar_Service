package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * User Wallet for storing balance
 * Separate wallets for providers and customers
 */
@Data
@Document(collection = "wallets")
public class Wallet {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String userId;
    
    private String userRole; // PROVIDER, CUSTOMER
    
    private Double balance = 0.0; // Current balance
    
    private String currency = "INR";
    
    // Wallet limits
    private Double maxBalance = 100000.0; // Maximum balance allowed
    private Double minBalance = 0.0;
    
    // Status
    private Boolean isActive = true;
    private Boolean isLocked = false; // Locked by admin
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Add amount to wallet
     */
    public void addBalance(Double amount) {
        if (amount > 0 && (this.balance + amount) <= maxBalance) {
            this.balance += amount;
            this.updatedAt = LocalDateTime.now();
        }
    }
    
    /**
     * Deduct amount from wallet
     */
    public boolean deductBalance(Double amount) {
        if (amount > 0 && (this.balance - amount) >= minBalance) {
            this.balance -= amount;
            this.updatedAt = LocalDateTime.now();
            return true;
        }
        return false;
    }
}
