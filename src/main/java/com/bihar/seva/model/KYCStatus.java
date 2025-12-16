package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "kyc_status")
@Data
public class KYCStatus {
    @Id 
    private String id;
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    private String overallStatus = "PENDING"; // PENDING, VERIFIED, REJECTED, PARTIAL
    
    private int documentsUploaded = 0;
    private int documentsVerified = 0;
    private int documentsRequired = 2; // Minimum 2 documents required
    
    private List<String> uploadedDocuments; // List of document types uploaded
    private List<String> verifiedDocuments; // List of document types verified
    private List<String> rejectedDocuments; // List of document types rejected
    
    private boolean selfieUploaded = false;
    private boolean selfieVerified = false;
    private String selfieImage;
    
    private String rejectionReason;
    private String verifiedBy; // Admin ID who verified
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // KYC Level (Bronze, Silver, Gold)
    private String kycLevel = "BRONZE";
    
    // Verification score (0-100)
    private int verificationScore = 0;
    
    // Additional verification flags
    private boolean addressVerified = false;
    private boolean phoneVerified = false;
    private boolean emailVerified = false;
    private boolean biometricVerified = false;
}
