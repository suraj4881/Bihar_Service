package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class KYCDocumentUploadDTO {
    @NotBlank(message = "Document type is required")
    private String documentType; // AADHAR, PAN, VOTER, DRIVER_LICENSE
    
    @NotBlank(message = "Document number is required")
    private String documentNumber;
    
    @NotBlank(message = "Document front image is required")
    private String documentFrontImage; // Base64 encoded image
    
    private String documentBackImage; // Base64 encoded image (for Aadhar)
    
    @NotBlank(message = "Selfie image is required")
    private String selfieImage; // Base64 encoded selfie
    
    // Document specific fields
    private String fullName;
    private String dateOfBirth;
    private String address;
    private String pincode;
    private String state;
    
    // Driver License specific
    private String licenseClass;
    private String licenseExpiry;
}
