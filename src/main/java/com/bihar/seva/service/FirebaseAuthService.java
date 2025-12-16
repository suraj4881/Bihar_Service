package com.bihar.seva.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class FirebaseAuthService {
    
    /**
     * Verify Firebase ID token
     */
    public FirebaseToken verifyToken(String idToken) {
        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            log.error("Error verifying Firebase token: ", e);
            throw new RuntimeException("Invalid Firebase token: " + e.getMessage());
        }
    }
    
    /**
     * Get user by UID
     */
    public UserRecord getUserByUid(String uid) {
        try {
            return FirebaseAuth.getInstance().getUser(uid);
        } catch (FirebaseAuthException e) {
            log.error("Error getting user by UID: ", e);
            throw new RuntimeException("User not found: " + e.getMessage());
        }
    }
    
    /**
     * Get user by phone number
     */
    public UserRecord getUserByPhone(String phoneNumber) {
        try {
            // Ensure phone number is in E.164 format (+91XXXXXXXXXX)
            if (!phoneNumber.startsWith("+")) {
                phoneNumber = "+91" + phoneNumber;
            }
            return FirebaseAuth.getInstance().getUserByPhoneNumber(phoneNumber);
        } catch (FirebaseAuthException e) {
            log.error("Error getting user by phone: ", e);
            return null; // User doesn't exist
        }
    }
    
    /**
     * Create or update user
     */
    public UserRecord createOrUpdateUser(String phoneNumber, String displayName, String email) {
        try {
            // Ensure phone number is in E.164 format
            if (!phoneNumber.startsWith("+")) {
                phoneNumber = "+91" + phoneNumber;
            }
            
            UserRecord existingUser = getUserByPhone(phoneNumber);
            
            if (existingUser != null) {
                // Update existing user
                UserRecord.UpdateRequest request = new UserRecord.UpdateRequest(existingUser.getUid());
                if (displayName != null) {
                    request.setDisplayName(displayName);
                }
                if (email != null) {
                    request.setEmail(email);
                }
                return FirebaseAuth.getInstance().updateUser(request);
            } else {
                // Create new user
                UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setPhoneNumber(phoneNumber);
                
                if (displayName != null) {
                    request.setDisplayName(displayName);
                }
                if (email != null) {
                    request.setEmail(email);
                }
                
                return FirebaseAuth.getInstance().createUser(request);
            }
        } catch (FirebaseAuthException e) {
            log.error("Error creating/updating user: ", e);
            throw new RuntimeException("Failed to create/update user: " + e.getMessage());
        }
    }
    
    /**
     * Set custom claims for user (e.g., role)
     */
    public void setCustomClaims(String uid, Map<String, Object> claims) {
        try {
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
            log.info("Custom claims set for user: {}", uid);
        } catch (FirebaseAuthException e) {
            log.error("Error setting custom claims: ", e);
            throw new RuntimeException("Failed to set custom claims: " + e.getMessage());
        }
    }
    
    /**
     * Delete user
     */
    public void deleteUser(String uid) {
        try {
            FirebaseAuth.getInstance().deleteUser(uid);
            log.info("User deleted: {}", uid);
        } catch (FirebaseAuthException e) {
            log.error("Error deleting user: ", e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }
    
    /**
     * Extract phone number from Firebase token
     */
    public String getPhoneFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        String phone = (String) token.getClaims().get("phone_number");
        if (phone != null && phone.startsWith("+91")) {
            return phone.substring(3); // Remove +91 prefix
        }
        return phone;
    }
    
    /**
     * Extract email from Firebase token
     */
    public String getEmailFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        return token.getEmail();
    }
    
    /**
     * Extract UID from Firebase token
     */
    public String getUidFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        return token.getUid();
    }
    
    /**
     * Get phone or email from token (for both auth types)
     */
    public Map<String, String> getIdentifierFromToken(String idToken) {
        FirebaseToken token = verifyToken(idToken);
        Map<String, String> result = new HashMap<>();
        
        // Try to get phone number first
        String phone = (String) token.getClaims().get("phone_number");
        if (phone != null) {
            if (phone.startsWith("+91")) {
                phone = phone.substring(3); // Remove +91 prefix
            }
            result.put("phone", phone);
            result.put("type", "PHONE");
            return result;
        }
        
        // If no phone, get email
        String email = token.getEmail();
        if (email != null) {
            result.put("email", email);
            result.put("type", "EMAIL");
            return result;
        }
        
        result.put("type", "UNKNOWN");
        return result;
    }
    
    /**
     * Check if Firebase is configured
     */
    public boolean isConfigured() {
        try {
            FirebaseAuth.getInstance();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

