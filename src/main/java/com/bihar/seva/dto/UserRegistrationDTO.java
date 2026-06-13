package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

@Data
public class UserRegistrationDTO {
    @NotBlank(message = "Name is required")
    private String name;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
    private String phone;
    
    @NotBlank(message = "Password is required")
    private String password;
    
    private String address;
    private String city;
    private String pincode;
}
