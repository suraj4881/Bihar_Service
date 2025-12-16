package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Provider;
import com.bihar.seva.model.User;
import com.bihar.seva.service.FirebaseAuthService;
import com.bihar.seva.service.UserService;
import com.bihar.seva.service.ProviderService;
import com.bihar.seva.service.JWTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/firebase-auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FirebaseAuthController {
    
    private final FirebaseAuthService firebaseAuthService;
    private final UserService userService;
    private final ProviderService providerService;
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
            
            String phone = identifier.get("phone");
            String userEmail = identifier.get("email");
            
            log.info("Phone: {}, Email from token: {}", phone, userEmail);
            
            // If email from token, use it; otherwise use provided email
            if (userEmail != null) {
                email = userEmail;
            }
            
            log.info("Final email to use: {}", email);
            
            // Check if user/provider exists in our database
            User existingUser = null;
            Provider existingProvider = null;
            
            if (phone != null) {
                log.info("Looking up user by phone: {}", phone);
                existingUser = userService.findByPhone(phone).orElse(null);
                existingProvider = providerService.findByPhone(phone).orElse(null);
            } else if (email != null) {
                log.info("Looking up user by email: {}", email);
                existingUser = userService.findByEmail(email).orElse(null);
                // Provider lookup by email if needed
            }
            
            log.info("Existing user: {}, Existing provider: {}", existingUser != null, existingProvider != null);
            
            Map<String, Object> response = new HashMap<>();
            
            if (existingUser != null) {
                // Existing customer
                log.info("Found existing customer");
                response.put("user", existingUser);
                response.put("role", "CUSTOMER");
                response.put("token", jwtService.generateToken(existingUser.getEmail() != null ? existingUser.getEmail() : existingUser.getPhone(), "CUSTOMER"));
                response.put("isNewUser", false);
                
                return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
                
            } else if (existingProvider != null) {
                // Existing provider
                log.info("Found existing provider");
                response.put("user", existingProvider);
                response.put("role", "PROVIDER");
                response.put("token", jwtService.generateToken(existingProvider.getEmail() != null ? existingProvider.getEmail() : existingProvider.getPhone(), "PROVIDER"));
                response.put("isNewUser", false);
                
                return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", response));
                
            } else {
                // New user - registration required
                log.info("New user detected. Role: {}, Name: {}", role, name);
                
                if (role == null || name == null) {
                    // Need additional info for registration
                    log.info("Missing role or name, requiring registration");
                    response.put("phone", phone);
                    response.put("email", email);
                    response.put("firebaseUid", firebaseUid);
                    response.put("requiresRegistration", true);
                    response.put("message", "Please complete registration");
                    
                    return ResponseEntity.ok(new ApiResponse<>(true, "Phone/Email verified, registration required", response));
                }
                
                // Complete registration
                if ("PROVIDER".equalsIgnoreCase(role)) {
                    log.info("Creating new provider");
                    // Create provider account
                    Provider newProvider = new Provider();
                    newProvider.setName(name);
                    newProvider.setPhone(phone);
                    newProvider.setEmail(email);
                    newProvider.setPassword("firebase-auth"); // No password needed for Firebase auth
                    newProvider.setVerified(true); // Already verified via Firebase
                    
                    response.put("user", newProvider);
                    response.put("role", "PROVIDER");
                    response.put("token", jwtService.generateToken(email != null ? email : phone, "PROVIDER"));
                    response.put("isNewUser", true);
                    
                } else {
                    log.info("Creating new customer");
                    // Create customer account
                    User newUser = new User();
                    newUser.setName(name);
                    newUser.setPhone(phone);
                    newUser.setEmail(email);
                    newUser.setPassword("firebase-auth"); // No password needed
                    newUser.setVerified(true); // Already verified
                    
                    User savedUser = userService.saveUser(newUser);
                    log.info("Customer saved with ID: {}", savedUser.getId());
                    
                    response.put("user", savedUser);
                    response.put("role", "CUSTOMER");
                    response.put("token", jwtService.generateToken(email != null ? email : phone, "CUSTOMER"));
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
     * Check if phone number exists in database
     */
    @GetMapping("/check-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPhone(@RequestParam String phone) {
        try {
            User user = userService.findByPhone(phone).orElse(null);
            Provider provider = providerService.findByPhone(phone).orElse(null);
            
            Map<String, Object> response = new HashMap<>();
            
            if (user != null) {
                response.put("exists", true);
                response.put("role", "CUSTOMER");
                response.put("name", user.getName());
            } else if (provider != null) {
                response.put("exists", true);
                response.put("role", "PROVIDER");
                response.put("name", provider.getName());
            } else {
                response.put("exists", false);
                response.put("message", "New user");
            }
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Phone check complete", response));
            
        } catch (Exception e) {
            log.error("Error checking phone: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    /**
     * Complete registration for new user after Firebase OTP verification
     */
    @PostMapping("/complete-registration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeRegistration(
            @RequestParam String phone,
            @RequestParam String name,
            @RequestParam String role,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Double price) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            if ("PROVIDER".equalsIgnoreCase(role)) {
                // Create provider
                Provider provider = new Provider();
                provider.setName(name);
                provider.setPhone(phone);
                provider.setEmail(email);
                provider.setCity(city);
                provider.setSkill(skill);
                provider.setPrice(price != null ? price : 0.0);
                provider.setPassword("firebase-auth");
                provider.setVerified(true); // Phone verified via Firebase
                
                // You'll need to implement saveProviderWithoutEncryption in ProviderService
                // Provider savedProvider = providerService.saveProvider(provider);
                
                response.put("user", provider);
                response.put("role", "PROVIDER");
                response.put("token", jwtService.generateToken(phone, "PROVIDER"));
                
            } else {
                // Create customer
                User user = new User();
                user.setName(name);
                user.setPhone(phone);
                user.setEmail(email);
                user.setCity(city);
                user.setPassword("firebase-auth");
                user.setVerified(true);
                
                User savedUser = userService.saveUser(user);
                
                response.put("user", savedUser);
                response.put("role", "CUSTOMER");
                response.put("token", jwtService.generateToken(phone, "CUSTOMER"));
            }
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Registration completed successfully", response));
            
        } catch (Exception e) {
            log.error("Registration error: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Registration failed: " + e.getMessage(), null));
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

