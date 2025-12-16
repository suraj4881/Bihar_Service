package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;

@Data
public class BookingRequestDTO {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Provider ID is required")
    private String providerId;
    
    @NotBlank(message = "Service is required")
    private String service;
    
    @NotBlank(message = "Address is required")
    private String address;
    
    private String city;
    private String pincode;
    private String landmark;
    
    @NotNull(message = "Scheduled date is required")
    private LocalDateTime scheduledDate;
    
    @Positive(message = "Price must be positive")
    private double price;
    
    private String specialInstructions;
    private String emergencyContact;
    private String emergencyPhone;
}