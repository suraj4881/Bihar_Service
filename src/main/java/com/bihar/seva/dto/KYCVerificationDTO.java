package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class KYCVerificationDTO {
    @NotBlank(message = "Document ID is required")
    private String documentId;
    
    @NotBlank(message = "Status is required")
    private String status; // VERIFIED, REJECTED
    
    private String rejectionReason;
    private String verificationNotes;
    private String faceMatchScore;
    private boolean isFaceMatched = false;
}
