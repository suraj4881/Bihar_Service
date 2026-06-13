package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class DebugController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Check user details by email (for debugging)
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@PathVariable String email) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(new ApiResponse<>(false, "User not found", null));
            }
            
            User user = userOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());
            response.put("isActive", user.isActive());
            response.put("isVerified", user.isVerified());
            response.put("hasPassword", user.getPassword() != null && !user.getPassword().isEmpty());
            response.put("passwordHash", user.getPassword() != null ? 
                user.getPassword().substring(0, Math.min(20, user.getPassword().length())) + "..." : "NULL");
            response.put("verificationCode", user.getVerificationCode());
            response.put("createdAt", user.getCreatedAt());
            
            log.info("📊 User details retrieved for: {}", email);
            return ResponseEntity.ok(new ApiResponse<>(true, "User details", response));
            
        } catch (Exception e) {
            log.error("❌ Error getting user details: {}", email, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error: " + e.getMessage(), null));
        }
    }
    
    /**
     * Test password matching (for debugging)
     */
    @PostMapping("/test-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testPassword(
            @RequestParam String email,
            @RequestParam String password) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.ok(new ApiResponse<>(false, "User not found", null));
            }
            
            User user = userOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("email", email);
            response.put("passwordProvided", password.substring(0, Math.min(3, password.length())) + "***");
            response.put("passwordHashInDB", user.getPassword() != null ? 
                user.getPassword().substring(0, Math.min(20, user.getPassword().length())) + "..." : "NULL");
            response.put("passwordMatches", passwordEncoder.matches(password, user.getPassword()));
            response.put("isVerified", user.isVerified());
            response.put("isActive", user.isActive());
            
            boolean matches = passwordEncoder.matches(password, user.getPassword());
            
            log.info("🔍 Password test - Email: {}, Matches: {}, Verified: {}, Active: {}", 
                email, matches, user.isVerified(), user.isActive());
            
            return ResponseEntity.ok(new ApiResponse<>(true, 
                matches ? "Password matches!" : "Password does NOT match", 
                response));
            
        } catch (Exception e) {
            log.error("❌ Error testing password: {}", email, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error: " + e.getMessage(), null));
        }
    }
}

