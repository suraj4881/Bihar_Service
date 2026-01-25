package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * Payment Transactions
 * Tracks all payments including commission
 */
@Data
@Document(collection = "payments")
public class Payment {
    @Id
    private String id;
    
    @Indexed
    private String bookingId;
    
    @Indexed
    private String customerId;
    
    @Indexed
    private String providerId;
    
    @Indexed
    private String serviceId;
    
    // Amounts
    private Double totalAmount; // Customer pays this
    private Double basePrice; // Provider's actual price
    private Double commissionAmount; // Platform commission (10%)
    private Double commissionRate = 10.0; // Commission percentage
    
    // Payment details
    private String paymentMethod; // ONLINE, WALLET, CASH, UPI, CARD
    private String paymentStatus; // PENDING, PROCESSING, PENDING_VERIFICATION, SUCCESS, FAILED, REFUNDED
    private String transactionId; // Payment gateway transaction ID
    private String paymentGateway; // RAZORPAY, PAYTM, STRIPE, etc.

    // Admin verification
    private String adminVerificationNote;
    private LocalDateTime adminVerifiedAt;
    
    // Wallet transactions
    private String fromWalletId; // If paid from wallet
    private String toWalletId; // Provider wallet ID
    
    // Commission distribution
    private Boolean commissionDeducted = false;
    private LocalDateTime commissionDeductedAt;
    
    // Provider payout
    private Boolean providerPayoutDone = false;
    private LocalDateTime providerPayoutAt;
    private Double providerPayoutAmount; // basePrice (after commission)
    
    // Refund details
    private Boolean isRefunded = false;
    private Double refundAmount;
    private String refundReason;
    private LocalDateTime refundedAt;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Calculate commission and amounts
     */
    public void calculateCommission() {
        if (basePrice != null && commissionRate != null) {
            this.commissionAmount = basePrice * (commissionRate / 100);
            this.totalAmount = basePrice + commissionAmount;
            this.providerPayoutAmount = basePrice; // Provider gets base price
        }
    }
}
