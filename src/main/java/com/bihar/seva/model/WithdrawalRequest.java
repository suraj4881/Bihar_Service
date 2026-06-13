package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "withdrawal_requests")
public class WithdrawalRequest {
    @Id
    private String id;
    private String providerId;
    private Double amount;
    private String method; // UPI, BANK
    private String upiId;
    private String accountHolderName;
    private String accountNumber;
    private String ifsc;
    private String bankName;
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, PAID
    private String remarks;
    private String transactionId;
    private LocalDateTime requestedAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
