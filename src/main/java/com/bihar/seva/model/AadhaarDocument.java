package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "aadhaar")
public class AadhaarDocument {
    @Id
    private String id;
    private String userId;
    private String userRole; // "CUSTOMER" or "PROVIDER"
    
    // Aadhaar Front and Back Images
    private String frontImageUrl;
    private String backImageUrl;
    
    // Aadhaar Number (if verified via OTP)
    private String aadhaarNumber;
    private boolean isOtpVerified;
    
    // Verification Status
    private VerificationStatus status = VerificationStatus.PENDING;
    private String rejectionReason;
    private String verifiedBy; // Admin user ID
    private LocalDateTime verifiedAt;
    
    // Timestamps
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
    
    public enum VerificationStatus {
        PENDING,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED
    }
}
