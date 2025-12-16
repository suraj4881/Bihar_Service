package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Document(collection = "earnings")
@Data
public class Earnings {
    @Id 
    private String id;
    
    @NotBlank(message = "Provider ID is required")
    @Indexed
    private String providerId;
    
    @NotBlank(message = "Booking ID is required")
    @Indexed
    private String bookingId;
    
    private double amount;
    private double commission;
    private double netAmount; // amount - commission
    
    private String status = "PENDING"; // PENDING, PAID, HOLD, REFUNDED
    private String paymentMethod; // UPI, BANK_TRANSFER, CASH
    private String transactionId;
    
    private LocalDateTime earnedAt = LocalDateTime.now();
    private LocalDateTime paidAt;
    
    // Bank details used for payment
    private String bankAccount;
    private String ifscCode;
    private String upiId;
    
    private String notes;
}

