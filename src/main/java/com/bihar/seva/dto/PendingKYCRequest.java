package com.bihar.seva.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for representing a pending KYC request with all documents
 */
@Data
public class PendingKYCRequest {
    private String userId;
    private String userRole; // CUSTOMER or PROVIDER
    private String userName;
    private String userEmail;
    private String userPhone;
    
    // Document statuses
    private boolean hasAadhaar;
    private String aadhaarId;
    private String aadhaarStatus;
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;
    private LocalDateTime aadhaarSubmittedAt;
    
    private boolean hasPAN;
    private String panId;
    private String panStatus;
    private String panImageUrl;
    private LocalDateTime panSubmittedAt;
    
    private boolean hasSelfie;
    private String selfieId;
    private String selfieStatus;
    private String selfieImageUrl;
    private LocalDateTime selfieSubmittedAt;
    
    // Overall status
    private String overallStatus; // PENDING, UNDER_REVIEW, PARTIAL
    private LocalDateTime earliestSubmittedAt;
    
    // All document IDs for verification
    private List<String> documentIds;
}
