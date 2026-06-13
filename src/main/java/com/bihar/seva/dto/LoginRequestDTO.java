package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class LoginRequestDTO {
    @NotBlank(message = "Email or phone is required")
    private String email; // Can be email or phone
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
