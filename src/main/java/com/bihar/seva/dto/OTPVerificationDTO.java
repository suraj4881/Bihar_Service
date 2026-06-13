package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
public class OTPVerificationDTO {
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    private String phoneNumber;
    
    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
    private String otpCode;
    
    @NotBlank(message = "OTP type is required")
    private String otpType; // PHONE, EMAIL, AADHAR, PAN
}
