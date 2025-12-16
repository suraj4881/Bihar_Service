package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Document(collection = "admins")
@Data
public class Admin {
    @Id 
    private String id;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @Email(message = "Invalid email format")
    @Indexed(unique = true)
    private String email;
    
    private String password;
    private String role = "ADMIN"; // ADMIN, SUPER_ADMIN
    private boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastLogin;
    private String permissions; // JSON string of permissions
}
