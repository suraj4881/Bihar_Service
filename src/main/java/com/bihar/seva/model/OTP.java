package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "otps")
@Data
public class OTP {
    @Id 
    private String id;
    
    private String phoneNumber;
    private String email; // Optional - only for email OTPs
    
    private String otpCode;
    
    private String otpType; // PHONE, EMAIL, AADHAR, PAN
    private boolean used = false;
    private boolean verified = false;
    private int attempts = 0;
    private int maxAttempts = 3;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    private LocalDateTime verifiedAt;
    
    private String purpose; // REGISTRATION, LOGIN, RESET_PASSWORD, KYC_VERIFICATION
    private String userId; // Link to user if available
    private String ipAddress;
    private String userAgent;
}
