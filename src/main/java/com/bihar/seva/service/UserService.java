package com.bihar.seva.service;

import com.bihar.seva.dto.ProfileUpdateDTO;
import com.bihar.seva.dto.UserRegistrationDTO;
import com.bihar.seva.exception.DuplicateResourceException;
import com.bihar.seva.exception.ResourceNotFoundException;
import com.bihar.seva.exception.ValidationException;
import com.bihar.seva.model.Admin;
import com.bihar.seva.model.Customer;
import com.bihar.seva.model.Provider;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.AdminRepository;
import com.bihar.seva.repositories.CustomerRepository;
import com.bihar.seva.repositories.ProviderRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.util.LoggingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UserRepository userRepository; // Legacy support
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private ProviderRepository providerRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private FileUploadService fileUploadService;
    
    @Autowired
    private SMSService smsService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private com.bihar.seva.repositories.BookingRepository bookingRepository;
    
    // In-memory OTP storage for Aadhaar and Phone OTPs
    private final Map<String, OTPData> aadhaarOTPStorage = new ConcurrentHashMap<>();
    private final Map<String, OTPData> phoneOTPStorage = new ConcurrentHashMap<>();
    private final Map<String, OTPData> emailOTPStorage = new ConcurrentHashMap<>(); // For phone change email OTP
    private final Random random = new Random();
    
    public User registerUser(UserRegistrationDTO registrationDTO) {
        LoggingUtil.logMethodEntry(logger, "registerUser", registrationDTO.getEmail());
        
        try {
            // Validate input
            validateRegistrationData(registrationDTO);
            
            // Check if user already exists
            if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
                LoggingUtil.logWarning(logger, "registerUser", "User with email already exists", registrationDTO.getEmail());
                throw new DuplicateResourceException("User with this email already exists");
            }
            
            if (userRepository.findByPhone(registrationDTO.getPhone()).isPresent()) {
                LoggingUtil.logWarning(logger, "registerUser", "User with phone already exists", registrationDTO.getPhone());
                throw new DuplicateResourceException("User with this phone number already exists");
            }
            
            User user = new User();
            user.setName(registrationDTO.getName());
            user.setEmail(registrationDTO.getEmail());
            user.setPhone(registrationDTO.getPhone());
            user.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
            user.setAddress(registrationDTO.getAddress());
            user.setCity(registrationDTO.getCity());
            user.setPincode(registrationDTO.getPincode());
            user.setVerificationCode(UUID.randomUUID().toString());
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "CREATE", "users", savedUser.getId(), "SUCCESS");
            LoggingUtil.logMethodExit(logger, "registerUser", "User created successfully");
            
            return savedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "registerUser", ex, registrationDTO.getEmail());
            throw ex;
        }
    }
    
    private void validateRegistrationData(UserRegistrationDTO registrationDTO) {
        if (registrationDTO == null) {
            throw new ValidationException("Registration data cannot be null");
        }
        
        if (!StringUtils.hasText(registrationDTO.getName())) {
            throw new ValidationException("Name is required");
        }
        
        if (!StringUtils.hasText(registrationDTO.getEmail())) {
            throw new ValidationException("Email is required");
        }
        
        if (!StringUtils.hasText(registrationDTO.getPhone())) {
            throw new ValidationException("Phone number is required");
        }
        
        if (!StringUtils.hasText(registrationDTO.getPassword())) {
            throw new ValidationException("Password is required");
        }
        
        if (registrationDTO.getPassword().length() < 6) {
            throw new ValidationException("Password must be at least 6 characters long");
        }
    }
    
    public Optional<User> findByEmail(String email) {
        LoggingUtil.logMethodEntry(logger, "findByEmail", email);
        
        try {
            if (!StringUtils.hasText(email)) {
                throw new ValidationException("Email cannot be null or empty");
            }
            
            Optional<User> user = userRepository.findByEmail(email);
            LoggingUtil.logDatabaseOperation(logger, "FIND_BY_EMAIL", "users", email, user.isPresent() ? "FOUND" : "NOT_FOUND");
            LoggingUtil.logMethodExit(logger, "findByEmail", user.isPresent() ? "User found" : "User not found");
            
            return user;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "findByEmail", ex, email);
            throw ex;
        }
    }
    
    public Optional<User> findById(String id) {
        LoggingUtil.logMethodEntry(logger, "findById", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            Optional<User> user = userRepository.findById(id);
            LoggingUtil.logDatabaseOperation(logger, "FIND_BY_ID", "users", id, user.isPresent() ? "FOUND" : "NOT_FOUND");
            LoggingUtil.logMethodExit(logger, "findById", user.isPresent() ? "User found" : "User not found");
            
            return user;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "findById", ex, id);
            throw ex;
        }
    }
    
    public List<User> getAllUsers() {
        LoggingUtil.logMethodEntry(logger, "getAllUsers");
        
        try {
            List<User> users = userRepository.findAll();
            LoggingUtil.logDatabaseOperation(logger, "FIND_ALL", "users", "ALL", "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getAllUsers", "Retrieved " + users.size() + " users");
            
            return users;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getAllUsers", ex);
            throw ex;
        }
    }
    
    public User updateUser(String id, User user) {
        LoggingUtil.logMethodEntry(logger, "updateUser", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            if (user == null) {
                throw new ValidationException("User data cannot be null");
            }
            
            // Check if user exists
            if (!userRepository.existsById(id)) {
                throw new ResourceNotFoundException("User not found with ID: " + id);
            }
            
            user.setId(id);
            user.setUpdatedAt(LocalDateTime.now());
            
            User updatedUser = userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "UPDATE", "users", id, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "updateUser", "User updated successfully");
            
            return updatedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "updateUser", ex, id);
            throw ex;
        }
    }
    
    public void deleteUser(String id) {
        LoggingUtil.logMethodEntry(logger, "deleteUser", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            // Check if user exists
            if (!userRepository.existsById(id)) {
                throw new ResourceNotFoundException("User not found with ID: " + id);
            }
            
            userRepository.deleteById(id);
            LoggingUtil.logDatabaseOperation(logger, "DELETE", "users", id, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "deleteUser", "User deleted successfully");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "deleteUser", ex, id);
            throw ex;
        }
    }
    
    public User verifyUser(String verificationCode) {
        LoggingUtil.logMethodEntry(logger, "verifyUser", verificationCode);
        
        try {
            if (!StringUtils.hasText(verificationCode)) {
                throw new ValidationException("Verification code cannot be null or empty");
            }
            
            User user = userRepository.findByVerificationCode(verificationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid verification code"));
            
            user.setVerified(true);
            user.setVerificationCode(null);
            user.setUpdatedAt(LocalDateTime.now());
            
            User verifiedUser = userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "VERIFY", "users", user.getId(), "SUCCESS");
            LoggingUtil.logMethodExit(logger, "verifyUser", "User verified successfully");
            
            return verifiedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyUser", ex, verificationCode);
            throw ex;
        }
    }
    
    public boolean changePassword(String userId, String currentPassword, String newPassword) {
        LoggingUtil.logMethodEntry(logger, "changePassword", userId);
        
        try {
            if (!StringUtils.hasText(userId)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            if (!StringUtils.hasText(currentPassword)) {
                throw new ValidationException("Current password cannot be null or empty");
            }
            
            if (!StringUtils.hasText(newPassword)) {
                throw new ValidationException("New password cannot be null or empty");
            }
            
            if (newPassword.length() < 6) {
                throw new ValidationException("New password must be at least 6 characters long");
            }
            
            // Find user
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            // Verify current password
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                LoggingUtil.logWarning(logger, "changePassword", "Current password incorrect", userId);
                return false;
            }
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "CHANGE_PASSWORD", "users", userId, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "changePassword", "Password changed successfully");
            
            return true;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "changePassword", ex, userId);
            throw ex;
        }
    }
    
    public User updateProfile(String userId, ProfileUpdateDTO profileDTO) {
        LoggingUtil.logMethodEntry(logger, "updateProfile", userId);
        
        try {
            if (!StringUtils.hasText(userId)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            if (profileDTO == null) {
                throw new ValidationException("Profile data cannot be null");
            }
            
            // Find existing user
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            // Check if email is being changed and if it's already taken by another user
            if (!user.getEmail().equals(profileDTO.getEmail())) {
                Optional<User> existingUser = userRepository.findByEmail(profileDTO.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                    throw new DuplicateResourceException("Email already exists");
                }
            }
            
            // Update user fields
            user.setName(profileDTO.getName());
            user.setEmail(profileDTO.getEmail());
            user.setAddress(profileDTO.getAddress());
            user.setCity(profileDTO.getCity());
            user.setPincode(profileDTO.getPincode());
            
            if (StringUtils.hasText(profileDTO.getProfilePhoto())) {
                user.setProfilePhoto(profileDTO.getProfilePhoto());
            }
            
            user.setUpdatedAt(LocalDateTime.now());
            
            // Save to database
            User updatedUser = userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "UPDATE_PROFILE", "users", userId, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "updateProfile", "Profile updated successfully");
            
            logger.info("✅ Profile updated for user: {} - Name: {}, Email: {}, City: {}", 
                userId, updatedUser.getName(), updatedUser.getEmail(), updatedUser.getCity());
            
            return updatedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "updateProfile", ex, userId);
            throw ex;
        }
    }
    
    // Method for Firebase authentication - save user without password encryption
    public User saveUser(User user) {
        LoggingUtil.logMethodEntry(logger, "saveUser", user.getPhone());
        
        try {
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            User savedUser = userRepository.save(user);
            LoggingUtil.logDatabaseOperation(logger, "CREATE", "users", savedUser.getId(), "SUCCESS");
            LoggingUtil.logMethodExit(logger, "saveUser", "User saved successfully");
            
            return savedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "saveUser", ex, user.getPhone());
            throw ex;
        }
    }
    
    // Find user by phone number
    public Optional<User> findByPhone(String phone) {
        LoggingUtil.logMethodEntry(logger, "findByPhone", phone);
        
        try {
            if (!StringUtils.hasText(phone)) {
                throw new ValidationException("Phone cannot be null or empty");
            }
            
            Optional<User> user = userRepository.findByPhone(phone);
            LoggingUtil.logDatabaseOperation(logger, "FIND_BY_PHONE", "users", phone, user.isPresent() ? "FOUND" : "NOT_FOUND");
            LoggingUtil.logMethodExit(logger, "findByPhone", user.isPresent() ? "User found" : "User not found");
            
            return user;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "findByPhone", ex, phone);
            throw ex;
        }
    }
    
    /**
     * Upload profile photo - checks all collections (customers, providers, admins)
     */
    public User uploadProfilePhoto(String userId, MultipartFile photo) throws IOException {
        LoggingUtil.logMethodEntry(logger, "uploadProfilePhoto", userId);
        
        try {
            // Upload photo using FileUploadService
            String photoPath = fileUploadService.uploadFile(photo, "profile-photos");
            // URL encode the file path to handle special characters
            String encodedPath = java.net.URLEncoder.encode(photoPath, "UTF-8").replace("+", "%20");
            String photoUrl = "http://localhost:8080/api/files/serve?filePath=" + encodedPath;
            
            // Try to find user in customers collection
            Optional<Customer> customerOpt = customerRepository.findById(userId);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                
                // Delete old photo if exists
                if (StringUtils.hasText(customer.getProfilePhoto())) {
                    try {
                        String oldPath = customer.getProfilePhoto();
                        if (oldPath.contains("/api/files/serve?filePath=")) {
                            oldPath = oldPath.substring(oldPath.indexOf("filePath=") + 9);
                            // URL decode if needed
                            try {
                                oldPath = java.net.URLDecoder.decode(oldPath, "UTF-8");
                            } catch (Exception e) {
                                // Already decoded or not encoded
                            }
                        }
                        // Normalize path separators
                        oldPath = oldPath.replace("\\", "/");
                        fileUploadService.deleteFile(oldPath);
                    } catch (Exception e) {
                        logger.warn("Failed to delete old photo: {}", e.getMessage());
                    }
                }
                
                customer.setProfilePhoto(photoUrl);
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                
                logger.info("✅ Profile photo uploaded successfully for customer: {} - URL: {}", userId, photoUrl);
                return convertCustomerToUser(customer);
            }
            
            // Try to find user in providers collection
            Optional<Provider> providerOpt = providerRepository.findById(userId);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                
                // Delete old photo if exists
                if (StringUtils.hasText(provider.getProfilePhoto())) {
                    try {
                        String oldPath = provider.getProfilePhoto();
                        if (oldPath.contains("/api/files/serve?filePath=")) {
                            oldPath = oldPath.substring(oldPath.indexOf("filePath=") + 9);
                            // URL decode if needed
                            try {
                                oldPath = java.net.URLDecoder.decode(oldPath, "UTF-8");
                            } catch (Exception e) {
                                // Already decoded or not encoded
                            }
                        }
                        // Normalize path separators
                        oldPath = oldPath.replace("\\", "/");
                        fileUploadService.deleteFile(oldPath);
                    } catch (Exception e) {
                        logger.warn("Failed to delete old photo: {}", e.getMessage());
                    }
                }
                
                provider.setProfilePhoto(photoUrl);
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                
                logger.info("✅ Profile photo uploaded successfully for provider: {} - URL: {}", userId, photoUrl);
                return convertProviderToUser(provider);
            }
            
            // Try to find user in admins collection
            Optional<Admin> adminOpt = adminRepository.findById(userId);
            if (adminOpt.isPresent()) {
                // Admins might not have profilePhoto field, but we'll skip for now
                logger.info("✅ Admin photo upload skipped (not implemented) - ID: {}", userId);
                throw new ValidationException("Profile photo upload not supported for admin accounts");
            }
            
            // Try legacy users collection
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Delete old photo if exists
                if (StringUtils.hasText(user.getProfilePhoto())) {
                    try {
                        String oldPath = user.getProfilePhoto();
                        if (oldPath.contains("/api/files/serve?filePath=")) {
                            oldPath = oldPath.substring(oldPath.indexOf("filePath=") + 9);
                            // URL decode if needed
                            try {
                                oldPath = java.net.URLDecoder.decode(oldPath, "UTF-8");
                            } catch (Exception e) {
                                // Already decoded or not encoded
                            }
                        }
                        // Normalize path separators
                        oldPath = oldPath.replace("\\", "/");
                        fileUploadService.deleteFile(oldPath);
                    } catch (Exception e) {
                        logger.warn("Failed to delete old photo: {}", e.getMessage());
                    }
                }
                
                user.setProfilePhoto(photoUrl);
                user.setUpdatedAt(LocalDateTime.now());
                User updatedUser = userRepository.save(user);
                
                logger.info("✅ Profile photo uploaded successfully for user (legacy): {} - URL: {}", userId, photoUrl);
                return updatedUser;
            }
            
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "uploadProfilePhoto", ex, userId);
            throw ex;
        }
    }
    
    /**
     * Convert Customer to User (for backward compatibility)
     */
    private User convertCustomerToUser(Customer customer) {
        User user = new User();
        user.setId(customer.getId());
        user.setName(customer.getName());
        user.setEmail(customer.getEmail());
        user.setPhone(customer.getPhone());
        user.setPassword(customer.getPassword());
        user.setLanguage(customer.getLanguage());
        user.setAddress(customer.getAddress());
        user.setCity(customer.getCity());
        user.setPincode(customer.getPincode());
        user.setProfilePhoto(customer.getProfilePhoto());
        user.setActive(customer.isActive());
        user.setVerified(customer.isVerified());
        user.setOnline(customer.isOnline());
        user.setLastSeen(customer.getLastSeen());
        user.setVerificationCode(customer.getVerificationCode());
        user.setCreatedAt(customer.getCreatedAt());
        user.setUpdatedAt(customer.getUpdatedAt());
        user.setFavoriteProviders(customer.getFavoriteProviders());
        user.setRating(customer.getRating());
        user.setTotalBookings(customer.getTotalBookings());
        user.setRole("CUSTOMER");
        return user;
    }
    
    /**
     * Convert Provider to User (for backward compatibility)
     */
    private User convertProviderToUser(Provider provider) {
        User user = new User();
        user.setId(provider.getId());
        user.setName(provider.getName());
        user.setEmail(provider.getEmail());
        user.setPhone(provider.getPhone());
        user.setPassword(provider.getPassword());
        user.setAddress(provider.getAddress());
        user.setCity(provider.getCity());
        user.setPincode(provider.getPincode());
        user.setProfilePhoto(provider.getProfilePhoto());
        user.setLanguage(provider.getLanguage());
        user.setActive(provider.isActive());
        user.setVerified(provider.isVerified());
        user.setOnline(provider.isOnline());
        user.setLastSeen(provider.getLastSeen());
        user.setCreatedAt(provider.getCreatedAt());
        user.setUpdatedAt(provider.getUpdatedAt());
        user.setRating(provider.getRating());
        user.setTotalBookings(provider.getTotalBookings());
        user.setRole("PROVIDER");
        return user;
    }
    
    /**
     * Send Aadhaar OTP for phone number change verification
     */
    public boolean sendAadhaarOTP(String userId, String aadhaarNumber) {
        LoggingUtil.logMethodEntry(logger, "sendAadhaarOTP", userId);
        
        try {
            // Validate input parameters
            if (!StringUtils.hasText(userId)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            if (!StringUtils.hasText(aadhaarNumber)) {
                throw new ValidationException("Aadhaar number is required");
            }
            
            // Remove any spaces or dashes from Aadhaar number
            aadhaarNumber = aadhaarNumber.replaceAll("[\\s-]", "");
            
            // Validate Aadhaar number format (12 digits)
            if (aadhaarNumber.length() != 12 || !aadhaarNumber.matches("\\d{12}")) {
                throw new ValidationException("Invalid Aadhaar number. Please enter 12 digits.");
            }
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            // Check if user has a registered phone number
            if (!StringUtils.hasText(user.getPhone())) {
                throw new ValidationException("User does not have a registered phone number. Please contact support.");
            }
            
            // Generate OTP
            String otp = String.format("%06d", random.nextInt(1000000));
            
            // Store OTP with expiry (5 minutes)
            String key = userId + "_" + aadhaarNumber;
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(5));
            aadhaarOTPStorage.put(key, otpData);
            
            logger.info("✅ Aadhaar OTP generated for user {}: {}", userId, otp);
            logger.info("📱 Sending OTP to registered mobile: {}", user.getPhone());
            logger.info("🔑 OTP Key: {}", key);
            
            // Send OTP via SMS to user's registered mobile number
            try {
                boolean smsSent = smsService.sendOTP(user.getPhone(), otp, "Aadhaar Verification");
                if (smsSent) {
                    logger.info("✅ OTP sent successfully via SMS to {}", user.getPhone());
                } else {
                    logger.warn("⚠️  SMS not sent (check SMS configuration). OTP: {}", otp);
                    logger.warn("💡 Check backend logs for OTP in development mode");
                }
            } catch (Exception smsEx) {
                logger.error("❌ Error sending SMS, but OTP generated: {}", otp);
                logger.error("SMS Error: {}", smsEx.getMessage());
                // Don't fail the request if SMS fails, OTP is still generated
            }
            
            LoggingUtil.logMethodExit(logger, "sendAadhaarOTP", "OTP sent successfully");
            return true;
        } catch (ValidationException | ResourceNotFoundException ex) {
            LoggingUtil.logError(logger, "sendAadhaarOTP", ex, userId);
            throw ex; // Re-throw validation/resource exceptions as-is
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "sendAadhaarOTP", ex, userId);
            logger.error("Unexpected error in sendAadhaarOTP for user {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send Aadhaar OTP: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Verify Aadhaar OTP
     */
    public boolean verifyAadhaarOTP(String userId, String aadhaarNumber, String otp) {
        LoggingUtil.logMethodEntry(logger, "verifyAadhaarOTP", userId);
        
        try {
            String key = userId + "_" + aadhaarNumber;
            OTPData storedData = aadhaarOTPStorage.get(key);
            
            if (storedData == null) {
                logger.warn("No Aadhaar OTP found for user: {}", userId);
                return false;
            }
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                logger.warn("Aadhaar OTP expired for user: {}", userId);
                aadhaarOTPStorage.remove(key);
                return false;
            }
            
            // Verify OTP
            boolean isValid = storedData.getOtp().equals(otp);
            
            if (isValid) {
                logger.info("✅ Aadhaar OTP verified successfully for user: {}", userId);
                aadhaarOTPStorage.remove(key);
            } else {
                logger.warn("❌ Invalid Aadhaar OTP for user: {}", userId);
            }
            
            LoggingUtil.logMethodExit(logger, "verifyAadhaarOTP", isValid ? "OTP verified" : "OTP invalid");
            return isValid;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyAadhaarOTP", ex, userId);
            return false;
        }
    }
    
    /**
     * Send OTP to old phone number for phone change verification
     * Returns OTP in development mode for testing
     */
    public Map<String, Object> sendOTPToOldPhone(String userId) {
        LoggingUtil.logMethodEntry(logger, "sendOTPToOldPhone", userId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            if (!StringUtils.hasText(user.getPhone())) {
                throw new ValidationException("User does not have a registered phone number");
            }
            
            String oldPhone = user.getPhone();
            logger.info("📱 Sending OTP to old phone number: {}XXXX", oldPhone.substring(0, Math.min(4, oldPhone.length())));
            
            // Generate OTP
            String otp = String.format("%06d", random.nextInt(1000000));
            
            // Store OTP with expiry (5 minutes)
            String key = userId + "_old_phone";
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(5));
            phoneOTPStorage.put(key, otpData);
            
            logger.info("✅ OTP generated for old phone verification: {}", otp);
            logger.info("📱 ========================================");
            logger.info("📱 OTP FOR PHONE CHANGE: {}", otp);
            logger.info("📱 Phone: {}", oldPhone);
            logger.info("📱 ========================================");
            
            // Send OTP via SMS to old phone number
            try {
                boolean smsSent = smsService.sendOTP(oldPhone, otp, "Phone Number Change Verification");
                if (smsSent) {
                    logger.info("✅ OTP sent successfully via SMS to old phone: {}", oldPhone);
                } else {
                    logger.warn("⚠️  SMS not sent (check SMS configuration). OTP: {}", otp);
                }
            } catch (Exception smsEx) {
                logger.error("❌ Error sending SMS to old phone: {}", smsEx.getMessage());
                // Continue even if SMS fails - OTP is logged
            }
            
            // Return OTP in development mode for testing
            Map<String, Object> result = new HashMap<>();
            result.put("otpSent", true);
            result.put("otp", otp); // Include OTP in development mode
            result.put("phone", oldPhone.substring(0, 2) + "XXXX" + oldPhone.substring(6));
            result.put("message", "OTP sent to registered phone number. Check backend logs for OTP in development mode.");
            
            LoggingUtil.logMethodExit(logger, "sendOTPToOldPhone", "OTP sent successfully");
            return result;
            
        } catch (ValidationException | ResourceNotFoundException ex) {
            LoggingUtil.logError(logger, "sendOTPToOldPhone", ex, userId);
            throw ex;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "sendOTPToOldPhone", ex, userId);
            logger.error("Unexpected error in sendOTPToOldPhone for user {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send OTP to old phone: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Verify last transaction amount for phone change (when old phone unavailable)
     */
    public boolean verifyLastTransactionAmount(String userId, double amount) {
        LoggingUtil.logMethodEntry(logger, "verifyLastTransactionAmount", userId);
        
        try {
            // Verify user exists (check all collections)
            if (!userRepository.existsById(userId) && 
                !customerRepository.existsById(userId) && 
                !providerRepository.existsById(userId)) {
                throw new ResourceNotFoundException("User not found with ID: " + userId);
            }
            
            // Get last completed booking for this user
            List<com.bihar.seva.model.Booking> bookings = bookingRepository.findByUserIdAndStatus(userId, "COMPLETED");
            
            if (bookings == null || bookings.isEmpty()) {
                logger.warn("No completed bookings found for user: {}", userId);
                throw new ValidationException("No transaction history found. Cannot verify.");
            }
            
            // Get the most recent completed booking
            com.bihar.seva.model.Booking lastBooking = bookings.stream()
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt()))
                .findFirst()
                .orElse(null);
            
            if (lastBooking == null) {
                throw new ValidationException("No transaction history found. Cannot verify.");
            }
            
            // Compare amounts (allow small difference for rounding)
            double lastAmount = lastBooking.getTotalAmount();
            double difference = Math.abs(lastAmount - amount);
            boolean isValid = difference < 1.0; // Allow 1 rupee difference
            
            if (isValid) {
                logger.info("✅ Last transaction amount verified for user: {} (Expected: {}, Provided: {})", 
                    userId, lastAmount, amount);
            } else {
                logger.warn("❌ Invalid transaction amount for user: {} (Expected: {}, Provided: {})", 
                    userId, lastAmount, amount);
            }
            
            LoggingUtil.logMethodExit(logger, "verifyLastTransactionAmount", isValid ? "Verified" : "Invalid");
            return isValid;
            
        } catch (ValidationException | ResourceNotFoundException ex) {
            LoggingUtil.logError(logger, "verifyLastTransactionAmount", ex, userId);
            throw ex;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyLastTransactionAmount", ex, userId);
            logger.error("Unexpected error in verifyLastTransactionAmount for user {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Failed to verify transaction amount: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Send OTP to email for phone change (after transaction verification)
     */
    public Map<String, Object> sendEmailOTPForPhoneChange(String userId) {
        LoggingUtil.logMethodEntry(logger, "sendEmailOTPForPhoneChange", userId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            if (!StringUtils.hasText(user.getEmail())) {
                throw new ValidationException("User does not have a registered email address");
            }
            
            logger.info("📧 Sending OTP to email for phone change: {}", user.getEmail());
            
            // Generate OTP
            String otp = String.format("%06d", random.nextInt(1000000));
            
            // Store OTP with expiry (10 minutes)
            String key = userId + "_email_phone_change";
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(10));
            emailOTPStorage.put(key, otpData);
            
            logger.info("✅ Email OTP generated for phone change: {}", otp);
            logger.info("📧 ========================================");
            logger.info("📧 EMAIL OTP FOR PHONE CHANGE: {}", otp);
            logger.info("📧 Email: {}", user.getEmail());
            logger.info("📧 ========================================");
            
            // Send OTP via email
            try {
                String subject = "Phone Number Change Verification - BiharSeva";
                String body = buildPhoneChangeEmailBody(user.getName(), otp);
                emailService.sendHtmlEmail(user.getEmail(), subject, body);
                logger.info("✅ OTP sent successfully via email to: {}", user.getEmail());
            } catch (Exception emailEx) {
                logger.error("❌ Error sending email OTP: {}", emailEx.getMessage());
                // Continue even if email fails - OTP is logged
            }
            
            // Return OTP in development mode for testing
            Map<String, Object> result = new HashMap<>();
            result.put("otpSent", true);
            result.put("otp", otp); // Include OTP in development mode
            result.put("email", user.getEmail());
            result.put("message", "OTP sent to email. Check backend logs for OTP in development mode.");
            
            LoggingUtil.logMethodExit(logger, "sendEmailOTPForPhoneChange", "OTP sent successfully");
            return result;
            
        } catch (ValidationException | ResourceNotFoundException ex) {
            LoggingUtil.logError(logger, "sendEmailOTPForPhoneChange", ex, userId);
            throw ex;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "sendEmailOTPForPhoneChange", ex, userId);
            logger.error("Unexpected error in sendEmailOTPForPhoneChange for user {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Failed to send email OTP: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Verify email OTP and change phone number
     */
    public User changePhoneWithEmailOTP(String userId, String newPhoneNumber, String emailOTP) {
        LoggingUtil.logMethodEntry(logger, "changePhoneWithEmailOTP", userId);
        
        try {
            // Validate input parameters
            if (!StringUtils.hasText(userId)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            if (!StringUtils.hasText(newPhoneNumber)) {
                throw new ValidationException("New phone number is required");
            }
            
            if (!StringUtils.hasText(emailOTP)) {
                throw new ValidationException("Email OTP is required");
            }
            
            // Remove any spaces or dashes from phone number
            newPhoneNumber = newPhoneNumber.replaceAll("[\\s-]", "");
            
            // Validate phone number format (10 digits)
            if (newPhoneNumber.length() != 10 || !newPhoneNumber.matches("\\d{10}")) {
                throw new ValidationException("Invalid phone number. Please enter 10 digits.");
            }
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            // Verify email OTP
            String key = userId + "_email_phone_change";
            OTPData storedData = emailOTPStorage.get(key);
            
            if (storedData == null) {
                logger.warn("No email OTP found for user: {}", userId);
                throw new ValidationException("Email OTP not found or expired. Please request a new OTP.");
            }
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                logger.warn("Email OTP expired for user: {}", userId);
                emailOTPStorage.remove(key);
                throw new ValidationException("Email OTP expired. Please request a new OTP.");
            }
            
            // Verify OTP
            if (!storedData.getOtp().equals(emailOTP)) {
                logger.warn("❌ Invalid email OTP for user: {}", userId);
                throw new ValidationException("Invalid email OTP. Please try again.");
            }
            
            // Check if phone number already exists
            Optional<User> existingUser = userRepository.findByPhone(newPhoneNumber);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new DuplicateResourceException("Phone number already exists");
            }
            
            // Update phone number
            String oldPhone = user.getPhone();
            user.setPhone(newPhoneNumber);
            user.setUpdatedAt(LocalDateTime.now());
            User updatedUser = userRepository.save(user);
            
            // Clear OTP
            emailOTPStorage.remove(key);
            
            logger.info("✅ Phone number changed successfully for user: {} (Old: {}, New: {})", 
                userId, oldPhone, newPhoneNumber);
            
            LoggingUtil.logMethodExit(logger, "changePhoneWithEmailOTP", "Phone number updated successfully");
            return updatedUser;
            
        } catch (ValidationException | ResourceNotFoundException | DuplicateResourceException ex) {
            LoggingUtil.logError(logger, "changePhoneWithEmailOTP", ex, userId);
            throw ex;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "changePhoneWithEmailOTP", ex, userId);
            logger.error("Unexpected error in changePhoneWithEmailOTP for user {}: {}", userId, ex.getMessage(), ex);
            throw new RuntimeException("Failed to change phone number: " + ex.getMessage(), ex);
        }
    }
    
    /**
     * Verify old phone OTP for phone change
     */
    public boolean verifyOldPhoneOTP(String userId, String otp) {
        LoggingUtil.logMethodEntry(logger, "verifyOldPhoneOTP", userId);
        
        try {
            String key = userId + "_old_phone";
            OTPData storedData = phoneOTPStorage.get(key);
            
            if (storedData == null) {
                logger.warn("No old phone OTP found for user: {}", userId);
                return false;
            }
            
            // Check if OTP expired
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                logger.warn("Old phone OTP expired for user: {}", userId);
                phoneOTPStorage.remove(key);
                return false;
            }
            
            // Verify OTP
            boolean isValid = storedData.getOtp().equals(otp);
            
            if (isValid) {
                logger.info("✅ Old phone OTP verified successfully for user: {}", userId);
                phoneOTPStorage.remove(key);
            } else {
                logger.warn("❌ Invalid old phone OTP for user: {}", userId);
            }
            
            LoggingUtil.logMethodExit(logger, "verifyOldPhoneOTP", isValid ? "OTP verified" : "OTP invalid");
            return isValid;
            
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyOldPhoneOTP", ex, userId);
            return false;
        }
    }
    
    /**
     * Get last transaction amount for user (for verification)
     */
    public Double getLastTransactionAmount(String userId) {
        LoggingUtil.logMethodEntry(logger, "getLastTransactionAmount", userId);
        
        try {
            List<com.bihar.seva.model.Booking> bookings = bookingRepository.findByUserIdAndStatus(userId, "COMPLETED");
            
            if (bookings == null || bookings.isEmpty()) {
                logger.info("No completed bookings found for user: {}", userId);
                return null;
            }
            
            com.bihar.seva.model.Booking lastBooking = bookings.stream()
                .sorted((b1, b2) -> b2.getCreatedAt().compareTo(b1.getCreatedAt()))
                .findFirst()
                .orElse(null);
            
            if (lastBooking != null) {
                logger.info("Last transaction amount for user {}: {}", userId, lastBooking.getTotalAmount());
                return lastBooking.getTotalAmount();
            }
            
            return null;
            
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getLastTransactionAmount", ex, userId);
            return null;
        }
    }
    
    /**
     * Build email body for phone change OTP
     */
    private String buildPhoneChangeEmailBody(String name, String otp) {
        return "<html><body style='font-family: Arial, sans-serif; padding: 20px;'>" +
            "<div style='max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 10px;'>" +
            "<h2 style='color: #ff6b35;'>Phone Number Change Verification</h2>" +
            "<p>Hello " + name + ",</p>" +
            "<p>You have requested to change your phone number. Please use the following OTP to verify:</p>" +
            "<div style='background-color: #fff; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;'>" +
            "<h1 style='color: #ff6b35; font-size: 32px; letter-spacing: 5px; margin: 0;'>" + otp + "</h1>" +
            "</div>" +
            "<p>This OTP is valid for 10 minutes.</p>" +
            "<p>If you did not request this change, please contact support immediately.</p>" +
            "<p style='color: #666; font-size: 12px; margin-top: 30px;'>Best regards,<br>BiharSeva Team</p>" +
            "</div></body></html>";
    }
    
    /**
     * Send OTP to new phone number (Legacy method - kept for backward compatibility)
     */
    public boolean sendPhoneOTP(String userId, String phoneNumber) {
        LoggingUtil.logMethodEntry(logger, "sendPhoneOTP", userId);
        
        try {
            // Validate input parameters
            if (!StringUtils.hasText(userId)) {
                throw new ValidationException("User ID cannot be null or empty");
            }
            
            // Verify user exists
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            logger.info("Sending phone OTP for user: {} ({})", user.getName(), userId);
            
            // Remove any spaces or dashes from phone number
            if (phoneNumber != null) {
                phoneNumber = phoneNumber.replaceAll("[\\s-]", "");
            }
            
            // Validate phone number
            if (!StringUtils.hasText(phoneNumber) || phoneNumber.length() != 10 || !phoneNumber.matches("\\d{10}")) {
                throw new ValidationException("Invalid phone number. Please enter 10 digits.");
            }
            
            // Check if phone number already exists
            Optional<User> existingUser = userRepository.findByPhone(phoneNumber);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new DuplicateResourceException("Phone number already exists");
            }
            
            // Generate OTP
            String otp = String.format("%06d", random.nextInt(1000000));
            
            // Store OTP with expiry (5 minutes)
            String key = userId + "_" + phoneNumber;
            OTPData otpData = new OTPData(otp, LocalDateTime.now().plusMinutes(5));
            phoneOTPStorage.put(key, otpData);
            
            logger.info("✅ Phone OTP generated for user {} to {}: {}", userId, phoneNumber, otp);
            logger.info("📱 Sending OTP to phone: {}", phoneNumber);
            
            // Send OTP via SMS to new phone number
            try {
                boolean smsSent = smsService.sendOTP(phoneNumber, otp, "Phone Number Change");
                if (smsSent) {
                    logger.info("✅ OTP sent successfully via SMS to {}", phoneNumber);
                } else {
                    logger.warn("⚠️  SMS not sent (check SMS configuration). OTP: {}", otp);
                    logger.warn("💡 Check backend logs for OTP in development mode");
                }
            } catch (Exception smsEx) {
                logger.error("❌ Error sending SMS, but OTP generated: {}", otp);
                logger.error("SMS Error: {}", smsEx.getMessage());
                // Don't fail the request if SMS fails, OTP is still generated
            }
            
            LoggingUtil.logMethodExit(logger, "sendPhoneOTP", "OTP sent successfully");
            return true;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "sendPhoneOTP", ex, userId);
            throw ex;
        }
    }
    
    /**
     * Change phone number after OTP verification
     */
    public User changePhoneNumber(String userId, String phoneNumber, String otp) {
        LoggingUtil.logMethodEntry(logger, "changePhoneNumber", userId);
        
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
            
            // Verify OTP
            String key = userId + "_" + phoneNumber;
            OTPData storedData = phoneOTPStorage.get(key);
            
            if (storedData == null) {
                throw new ValidationException("OTP not found. Please request a new OTP.");
            }
            
            if (LocalDateTime.now().isAfter(storedData.getExpiryTime())) {
                phoneOTPStorage.remove(key);
                throw new ValidationException("OTP expired. Please request a new OTP.");
            }
            
            if (!storedData.getOtp().equals(otp)) {
                throw new ValidationException("Invalid OTP");
            }
            
            // Check if phone number already exists
            Optional<User> existingUser = userRepository.findByPhone(phoneNumber);
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new DuplicateResourceException("Phone number already exists");
            }
            
            // Update phone number
            user.setPhone(phoneNumber);
            user.setUpdatedAt(LocalDateTime.now());
            
            // Remove OTP after successful verification
            phoneOTPStorage.remove(key);
            
            User updatedUser = userRepository.save(user);
            LoggingUtil.logMethodExit(logger, "changePhoneNumber", "Phone number updated successfully");
            
            logger.info("✅ Phone number updated for user {}: {}", userId, phoneNumber);
            
            return updatedUser;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "changePhoneNumber", ex, userId);
            throw ex;
        }
    }
    
    /**
     * Inner class to store OTP data
     */
    private static class OTPData {
        private String otp;
        private LocalDateTime expiryTime;
        
        public OTPData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
        
        public String getOtp() {
            return otp;
        }
        
        public LocalDateTime getExpiryTime() {
            return expiryTime;
        }
    }
}
