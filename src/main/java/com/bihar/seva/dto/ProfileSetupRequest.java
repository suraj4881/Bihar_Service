package com.bihar.seva.dto;

import lombok.Data;

@Data
public class ProfileSetupRequest {
    private String userId;
    private String password; // Optional - for OTP login users
    private String address;
    private String city;
    private String pincode;
    // Preferences can be added as needed
}

