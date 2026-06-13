package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
public class OTPRequestDTO {
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    private String phoneNumber;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "OTP type is required")
    private String otpType; // PHONE, EMAIL, AADHAR, PAN
    
    @NotBlank(message = "Purpose is required")
    private String purpose; // REGISTRATION, LOGIN, RESET_PASSWORD, KYC_VERIFICATION
}
