package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "kyc_documents")
public class KYCDocument {
    @Id
    private String id;
    private String userId;
    private String userRole; // "CUSTOMER" or "PROVIDER"
    
    // Document Details
    private String documentType; // "AADHAAR", "PAN", "DRIVING_LICENSE", "VOTER_ID"
    private String documentNumber;
    private String documentFrontUrl; // S3 or local storage URL
    private String documentBackUrl;  // For documents with both sides
    
    // Selfie with Document
    private String selfieUrl;
    
    // Additional Provider Documents
    private String certificateUrl; // Trade certificate, skill certificate
    private String experienceProofUrl;
    
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
