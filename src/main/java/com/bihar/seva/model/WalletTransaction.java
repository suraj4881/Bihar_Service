package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * Wallet Transaction History
 * Tracks all wallet transactions (credit/debit)
 */
@Data
@Document(collection = "wallet_transactions")
public class WalletTransaction {
    @Id
    private String id;
    
    @Indexed
    private String walletId;
    
    @Indexed
    private String userId;
    
    private String transactionType; // CREDIT, DEBIT
    private String transactionCategory; // PAYMENT, COMMISSION, REFUND, WITHDRAWAL, DEPOSIT
    
    private Double amount;
    private Double balanceBefore;
    private Double balanceAfter;
    
    private String description;
    private String referenceId; // Booking ID, Payment ID, etc.
    private String referenceType; // BOOKING, PAYMENT, COMMISSION, etc.
    
    // Status
    private String status; // PENDING, SUCCESS, FAILED
    private String failureReason;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
}
