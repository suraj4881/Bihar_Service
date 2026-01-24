package com.bihar.seva.dto;

import lombok.Data;

@Data
public class KYCStatusResponse {
    private String status; // PENDING, UNDER_REVIEW, VERIFIED, REJECTED, null
    private String verifiedAt;
    private String rejectionReason;
    private String submittedAt;
    private boolean aadhaarSubmitted;
    private boolean panSubmitted;
    private boolean selfieSubmitted;
    private String aadhaarStatus;
    private String panStatus;
    private String selfieStatus;
    // Document URLs for preview
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;
    private String panImageUrl;
    private String selfieImageUrl;
}
