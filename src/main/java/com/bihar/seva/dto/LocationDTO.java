package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;

@Data
public class LocationDTO {
    @DecimalMin(value = "-90.0", message = "Invalid latitude")
    @DecimalMax(value = "90.0", message = "Invalid latitude")
    private double latitude;
    
    @DecimalMin(value = "-180.0", message = "Invalid longitude")
    @DecimalMax(value = "180.0", message = "Invalid longitude")
    private double longitude;
    
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String landmark;
    private String locationType = "CURRENT";
    private double accuracy;
    private String source = "GPS";
    private String district;
    private String block;
    private String village;
    private String locality;
}
