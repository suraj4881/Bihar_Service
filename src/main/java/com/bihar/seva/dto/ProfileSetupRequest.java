package com.bihar.seva.dto;

import com.bihar.seva.model.CustomerProfile;
import lombok.Data;

@Data
public class ProfileSetupRequest {
    private String userId;
    private String customerId;
    private String password; // Optional - for OTP login users
    private CustomerProfile.Address address;
    private CustomerProfile.Preferences preferences;
}

