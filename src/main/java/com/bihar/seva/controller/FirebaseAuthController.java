package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.User;
import com.bihar.seva.service.FirebaseAuthService;
import com.bihar.seva.service.UserService;
import com.bihar.seva.service.JWTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.bihar.seva.repositories.UserRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/firebase-auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FirebaseAuthController {
    
    private final FirebaseAuthService firebaseAuthService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final JWTService jwtService;
    
    /**
     * Verify Firebase ID token and login/register user
     * Frontend sends Firebase ID token after OTP verification
     */
    @PostMapping("/verify-and-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyAndLogin(
            @RequestParam String idToken,
            @RequestParam(required = false) String role, // "customer" or "provider"
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email) {
        try {
            log.info("=== VERIFY AND LOGIN START ===");
            log.info("Role: {}, Name: {}, Email: {}", role, name, email);
            
            // Get identifier from token (phone or email)
            Map<String, String> identifier = firebaseAuthService.getIdentifierFromToken(idToken);
            log.info("Identifier from token: {}", identifier);
            
            String firebaseUid = firebaseAuthService.getUidFromToken(idToken);
            String authType = identifier.get("type");
            
            log.info("Firebase auth successful. Type: {}, UID: {}", authType, firebaseUid);
            
            String userEmail = identifier.get("email");
            
            log.info("Email from token: {}", userEmail);
            
            // If email from token, use it; otherwise use provided email
            if (userEmail != null) {
                email = userEmail;
            }
            
            // Email is required for authentication
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Email is required for authentication", null));
            }
            
            log.info("Final email to use: {}", email);
            
            // Check if user exists in our database by email only
            User existingUser = null;
            
            log.info("Looking up user by email: {}", email);
            existingUser = userService.findByEmail(email).orElse(null);
            
            log.info("Existing user: {}", existingUser != null);
            
            Map<String, Object> response = new HashMap<>();
            
            if (existingUser != null) {
                // Existing user - check role
                String userRole = existingUser.getRole() != null ? existingUser.getRole() : "CUSTOMER";
                log.info("Found existing user with role: {}", userRole);
                response.put("user", existingUser);
                response.put("role", userRole);
                response.put("token", jwtService.generateToken(existingUser.getEmail(), userRole));
                response.put("isNewUser", false);
                
                return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
                
            } else {
                // New user - registration required
                log.info("New user detected. Role: {}, Name: {}", role, name);
                
                if (role == null || name == null) {
                    // Need additional info for registration
                    log.info("Missing role or name, requiring registration");
                    response.put("email", email);
                    response.put("firebaseUid", firebaseUid);
                    response.put("requiresRegistration", true);
                    response.put("message", "Please complete registration");
                    
                    return ResponseEntity.ok(new ApiResponse<>(true, "Email verified, registration required", response));
                }
                
                // Complete registration
                if ("PROVIDER".equalsIgnoreCase(role)) {
                    log.info("Creating new provider");
                    // Create provider account
                    User newProvider = new User();
                    newProvider.setId(UUID.randomUUID().toString());
                    newProvider.setName(name);
                    newProvider.setEmail(email);
                    newProvider.setPassword("firebase-auth"); // No password needed for Firebase auth
                    newProvider.setRole("PROVIDER");
                    newProvider.setVerified(true); // Already verified via Firebase
                    newProvider.setActive(true);
                    newProvider.setCreatedAt(LocalDateTime.now());
                    newProvider.setUpdatedAt(LocalDateTime.now());
                    
                    User savedProvider = userRepository.save(newProvider);
                    
                    response.put("user", savedProvider);
                    response.put("role", "PROVIDER");
                    response.put("token", jwtService.generateToken(email, "PROVIDER"));
                    response.put("isNewUser", true);
                    
                } else {
                    log.info("Creating new customer");
                    // Create customer account
                    User newUser = new User();
                    newUser.setId(UUID.randomUUID().toString());
                    newUser.setName(name);
                    newUser.setEmail(email);
                    newUser.setPassword("firebase-auth"); // No password needed
                    newUser.setRole("CUSTOMER");
                    newUser.setVerified(true); // Already verified
                    newUser.setActive(true);
                    newUser.setCreatedAt(LocalDateTime.now());
                    newUser.setUpdatedAt(LocalDateTime.now());
                    
                    User savedUser = userRepository.save(newUser);
                    log.info("Customer saved with ID: {}", savedUser.getId());
                    
                    response.put("user", savedUser);
                    response.put("role", "CUSTOMER");
                    response.put("token", jwtService.generateToken(email, "CUSTOMER"));
                    response.put("isNewUser", true);
                }
                
                log.info("Registration successful");
                return ResponseEntity.ok(new ApiResponse<>(true, "Registration successful", response));
            }
            
        } catch (Exception e) {
            log.error("=== FIREBASE AUTH ERROR ===");
            log.error("Error type: {}", e.getClass().getName());
            log.error("Error message: {}", e.getMessage());
            log.error("Stack trace:", e);
            
            // Return detailed error for debugging
            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("errorType", e.getClass().getSimpleName());
            errorDetails.put("errorMessage", e.getMessage());
            
            return ResponseEntity.status(500)
                .body(new ApiResponse<>(false, "Authentication failed: " + e.getMessage(), errorDetails));
        }
    }
    
    /**
     * Health check to verify Firebase is configured
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFirebaseStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("configured", firebaseAuthService.isConfigured());
        status.put("message", firebaseAuthService.isConfigured() 
            ? "Firebase is configured and ready" 
            : "Firebase is not configured. Add firebase-service-account.json to resources folder");
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Status retrieved", status));
    }
}

