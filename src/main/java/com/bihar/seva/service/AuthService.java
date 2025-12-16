package com.bihar.seva.service;

import com.bihar.seva.dto.LoginRequestDTO;
import com.bihar.seva.dto.RegisterRequestDTO;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private UserRepository userRepository; // Keep for backward compatibility
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private ProviderRepository providerRepository;
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailVerificationService emailVerificationService;
    
    /**
     * Register user - saves to appropriate collection based on role
     * Returns User object for backward compatibility (converted from Customer/Provider/Admin)
     */
    public User registerUser(RegisterRequestDTO requestDTO) {
        LoggingUtil.logMethodEntry(logger, "registerUser", requestDTO.getEmail());
        
        try {
            // ✅ Log received data
            logger.info("📥 Received registration request:");
            logger.info("   Name: {}", requestDTO.getName());
            logger.info("   Email: {}", requestDTO.getEmail());
            logger.info("   Phone: {}", requestDTO.getPhone());
            logger.info("   Role: {}", requestDTO.getRole());
            logger.info("   Language: {}", requestDTO.getLanguage());
            logger.info("   City: {}", requestDTO.getCity());
            
            String role = requestDTO.getRole();
            if (role == null || role.trim().isEmpty()) {
                logger.warn("⚠️ Role is null or empty, defaulting to CUSTOMER");
                role = "CUSTOMER";
            }
            
            String encodedPassword = passwordEncoder.encode(requestDTO.getPassword());
            logger.info("🔐 Password encoded for user: {}", requestDTO.getEmail());
            
            String language = requestDTO.getLanguage();
            if (language == null || language.trim().isEmpty()) {
                language = "English";
            }
            
            String verificationCode = UUID.randomUUID().toString();
            LocalDateTime now = LocalDateTime.now();
            
            // Register based on role
            if ("PROVIDER".equalsIgnoreCase(role)) {
                // Check if provider already exists
                if (providerRepository.findByEmail(requestDTO.getEmail()).isPresent()) {
                    throw new RuntimeException("Email already exists");
                }
                
                Provider provider = new Provider();
                provider.setId(UUID.randomUUID().toString());
                provider.setName(requestDTO.getName());
                provider.setEmail(requestDTO.getEmail());
                provider.setPhone(requestDTO.getPhone());
                provider.setPassword(encodedPassword);
                provider.setAddress(requestDTO.getAddress());
                provider.setCity(requestDTO.getCity());
                provider.setPincode(requestDTO.getPincode());
                provider.setLanguage(language);
                provider.setActive(true);
                provider.setVerified(false);
                provider.setVerificationCode(verificationCode);
                provider.setCreatedAt(now);
                provider.setUpdatedAt(now);
                
                Provider savedProvider = providerRepository.save(provider);
                logger.info("✅ Provider saved to 'providers' collection - ID: {}", savedProvider.getId());
                
                // Send verification email
                try {
                    User tempUser = convertProviderToUser(savedProvider);
                    emailVerificationService.sendVerificationEmail(tempUser);
                } catch (Exception e) {
                    logger.error("❌ Failed to send verification email: {}", e.getMessage());
                }
                
                return convertProviderToUser(savedProvider);
                
            } else if ("ADMIN".equalsIgnoreCase(role)) {
                // Check if admin already exists
                if (adminRepository.findByEmail(requestDTO.getEmail()).isPresent()) {
                    throw new RuntimeException("Email already exists");
                }
                
                Admin admin = new Admin();
                admin.setId(UUID.randomUUID().toString());
                admin.setName(requestDTO.getName());
                admin.setEmail(requestDTO.getEmail());
                admin.setPassword(encodedPassword);
                admin.setRole("ADMIN");
                admin.setActive(true);
                admin.setCreatedAt(now);
                
                Admin savedAdmin = adminRepository.save(admin);
                logger.info("✅ Admin saved to 'admins' collection - ID: {}", savedAdmin.getId());
                
                return convertAdminToUser(savedAdmin);
                
            } else {
                // CUSTOMER - default
                // Check if customer already exists
                if (customerRepository.findByEmail(requestDTO.getEmail()).isPresent()) {
                    throw new RuntimeException("Email already exists");
                }
                
                Customer customer = new Customer();
                customer.setId(UUID.randomUUID().toString());
                customer.setName(requestDTO.getName());
                customer.setEmail(requestDTO.getEmail());
                customer.setPhone(requestDTO.getPhone());
                customer.setPassword(encodedPassword);
                customer.setAddress(requestDTO.getAddress());
                customer.setCity(requestDTO.getCity());
                customer.setPincode(requestDTO.getPincode());
                customer.setLanguage(language);
                customer.setActive(true);
                customer.setVerified(false);
                customer.setVerificationCode(verificationCode);
                customer.setCreatedAt(now);
                customer.setUpdatedAt(now);
                
                Customer savedCustomer = customerRepository.save(customer);
                logger.info("✅ Customer saved to 'customers' collection - ID: {}", savedCustomer.getId());
                
                // Send verification email
                try {
                    User tempUser = convertCustomerToUser(savedCustomer);
                    emailVerificationService.sendVerificationEmail(tempUser);
                } catch (Exception e) {
                    logger.error("❌ Failed to send verification email: {}", e.getMessage());
                }
                
                return convertCustomerToUser(savedCustomer);
            }
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "registerUser", ex, requestDTO.getEmail());
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
     * Convert Admin to User (for backward compatibility)
     */
    private User convertAdminToUser(Admin admin) {
        User user = new User();
        user.setId(admin.getId());
        user.setName(admin.getName());
        user.setEmail(admin.getEmail());
        user.setPassword(admin.getPassword());
        user.setActive(admin.isActive());
        user.setVerified(true); // Admins are always verified
        user.setOnline(false);
        user.setCreatedAt(admin.getCreatedAt());
        user.setUpdatedAt(admin.getLastLogin() != null ? admin.getLastLogin() : admin.getCreatedAt());
        user.setRole("ADMIN");
        return user;
    }
    
    /**
     * Login user - checks all collections (customers, providers, admins)
     */
    public Map<String, Object> loginUser(LoginRequestDTO requestDTO) {
        LoggingUtil.logMethodEntry(logger, "loginUser", requestDTO.getEmail());
        
        try {
            String identifier = requestDTO.getEmail();
            String password = requestDTO.getPassword();
            User user = null;
            String role = null;
            
            // Normalize email to lowercase for case-insensitive lookup
            String normalizedEmail = identifier != null ? identifier.toLowerCase().trim() : null;
            
            logger.info("🔍 Login attempt - Email: {} (normalized: {}), Password length: {}", 
                identifier, normalizedEmail, password != null ? password.length() : 0);
            
            // Try to find user in all collections
            if (identifier != null && identifier.contains("@")) {
                // Email login - check all collections (try both original and normalized)
                logger.info("🔍 Searching for user with email: {} (also trying: {})", identifier, normalizedEmail);
                Optional<Customer> customerOpt = customerRepository.findByEmail(normalizedEmail);
                if (!customerOpt.isPresent()) {
                    customerOpt = customerRepository.findByEmail(identifier);
                }
                Optional<Provider> providerOpt = providerRepository.findByEmail(normalizedEmail);
                if (!providerOpt.isPresent()) {
                    providerOpt = providerRepository.findByEmail(identifier);
                }
                Optional<Admin> adminOpt = adminRepository.findByEmail(normalizedEmail);
                if (!adminOpt.isPresent()) {
                    adminOpt = adminRepository.findByEmail(identifier);
                }
                
                logger.info("🔍 Search results - Customer: {}, Provider: {}, Admin: {}", 
                    customerOpt.isPresent(), providerOpt.isPresent(), adminOpt.isPresent());
                
                if (customerOpt.isPresent()) {
                    Customer customer = customerOpt.get();
                    String customerPassword = customer.getPassword();
                    
                    logger.info("🔍 Customer found - ID: {}, Has password: {}", 
                        customer.getId(), customerPassword != null && !customerPassword.isEmpty());
                    
                    if (customerPassword == null || customerPassword.isEmpty()) {
                        logger.warn("⚠️ Customer found but password not set for: {}", identifier);
                        throw new RuntimeException("Password not set. Please set your password first.");
                    }
                    
                    boolean passwordMatches = passwordEncoder.matches(password, customerPassword);
                    logger.info("🔍 Password match result for customer: {}", passwordMatches);
                    
                    if (passwordMatches) {
                        user = convertCustomerToUser(customer);
                        role = "CUSTOMER";
                        
                        // Update online status
                        customer.setOnline(true);
                        customer.setLastSeen(LocalDateTime.now());
                        customer.setUpdatedAt(LocalDateTime.now());
                        customerRepository.save(customer);
                        logger.info("✅ Customer login successful - ID: {}", customer.getId());
                    } else {
                        logger.warn("⚠️ Password mismatch for customer: {} - Stored hash: {}...", 
                            identifier, customerPassword.substring(0, Math.min(20, customerPassword.length())));
                    }
                } else if (providerOpt.isPresent()) {
                    Provider provider = providerOpt.get();
                    String providerPassword = provider.getPassword();
                    
                    logger.info("🔍 Provider found - ID: {}, Has password: {}", 
                        provider.getId(), providerPassword != null && !providerPassword.isEmpty());
                    
                    if (providerPassword == null || providerPassword.isEmpty()) {
                        logger.warn("⚠️ Provider found but password not set for: {}", identifier);
                        throw new RuntimeException("Password not set. Please set your password first.");
                    }
                    
                    boolean passwordMatches = passwordEncoder.matches(password, providerPassword);
                    logger.info("🔍 Password match result for provider: {}", passwordMatches);
                    
                    if (passwordMatches) {
                        user = convertProviderToUser(provider);
                        role = "PROVIDER";
                        
                        provider.setUpdatedAt(LocalDateTime.now());
                        providerRepository.save(provider);
                        logger.info("✅ Provider login successful - ID: {}", provider.getId());
                    } else {
                        logger.warn("⚠️ Password mismatch for provider: {} - Stored hash: {}...", 
                            identifier, providerPassword.substring(0, Math.min(20, providerPassword.length())));
                    }
                } else if (adminOpt.isPresent()) {
                    Admin admin = adminOpt.get();
                    String adminPassword = admin.getPassword();
                    
                    logger.info("🔍 Admin found - ID: {}, Has password: {}", 
                        admin.getId(), adminPassword != null && !adminPassword.isEmpty());
                    
                    if (adminPassword == null || adminPassword.isEmpty()) {
                        logger.warn("⚠️ Admin found but password not set for: {}", identifier);
                        throw new RuntimeException("Password not set. Please set your password first.");
                    }
                    
                    boolean passwordMatches = passwordEncoder.matches(password, adminPassword);
                    logger.info("🔍 Password match result for admin: {}", passwordMatches);
                    
                    if (passwordMatches) {
                        user = convertAdminToUser(admin);
                        role = "ADMIN";
                        
                        admin.setLastLogin(LocalDateTime.now());
                        adminRepository.save(admin);
                        logger.info("✅ Admin login successful - ID: {}", admin.getId());
                    } else {
                        logger.warn("⚠️ Password mismatch for admin: {} - Stored hash: {}...", 
                            identifier, adminPassword.substring(0, Math.min(20, adminPassword.length())));
                    }
                } else {
                    // Check legacy User collection
                    logger.info("🔍 Checking legacy User collection for: {}", identifier);
                    Optional<User> legacyUserOpt = userRepository.findByEmail(identifier);
                    if (legacyUserOpt.isPresent()) {
                        User legacyUser = legacyUserOpt.get();
                        String legacyPassword = legacyUser.getPassword();
                        
                        logger.info("🔍 Legacy user found - ID: {}, Has password: {}", 
                            legacyUser.getId(), legacyPassword != null && !legacyPassword.isEmpty());
                        
                        if (legacyPassword == null || legacyPassword.isEmpty()) {
                            logger.warn("⚠️ Legacy user found but password not set for: {}", identifier);
                            throw new RuntimeException("Password not set. Please set your password first.");
                        }
                        
                        boolean passwordMatches = passwordEncoder.matches(password, legacyPassword);
                        logger.info("🔍 Password match result for legacy user: {}", passwordMatches);
                        
                        if (passwordMatches) {
                            user = legacyUser;
                            role = legacyUser.getRole() != null ? legacyUser.getRole() : "CUSTOMER";
                            logger.info("✅ Legacy user login successful - ID: {}", legacyUser.getId());
                        } else {
                            logger.warn("⚠️ Password mismatch for legacy user: {} - Stored hash: {}...", 
                                identifier, legacyPassword.substring(0, Math.min(20, legacyPassword.length())));
                        }
                    } else {
                        logger.warn("🔍 No user found in any collection for email: {}", identifier);
                    }
                }
            } else {
                // Phone login - check customers and providers
                Optional<Customer> customerOpt = customerRepository.findByPhone(identifier);
                Optional<Provider> providerOpt = providerRepository.findByPhone(identifier);
                
                if (customerOpt.isPresent()) {
                    Customer customer = customerOpt.get();
                    if (passwordEncoder.matches(requestDTO.getPassword(), customer.getPassword())) {
                        user = convertCustomerToUser(customer);
                        role = "CUSTOMER";
                        
                        customer.setOnline(true);
                        customer.setLastSeen(LocalDateTime.now());
                        customer.setUpdatedAt(LocalDateTime.now());
                        customerRepository.save(customer);
                    }
                } else if (providerOpt.isPresent()) {
                    Provider provider = providerOpt.get();
                    if (passwordEncoder.matches(requestDTO.getPassword(), provider.getPassword())) {
                        user = convertProviderToUser(provider);
                        role = "PROVIDER";
                        
                        provider.setUpdatedAt(LocalDateTime.now());
                        providerRepository.save(provider);
                    }
                }
            }
            
            if (user == null) {
                logger.warn("❌ Invalid credentials for: {} - User not found or password incorrect", identifier);
                throw new RuntimeException("Invalid email or password");
            }
            
            // Validate user object
            if (user.getId() == null || user.getId().isEmpty()) {
                logger.error("❌ User object has null/empty ID after conversion");
                throw new RuntimeException("User data error. Please contact support.");
            }
            
            if (!user.isActive()) {
                logger.warn("⚠️ Login attempt with deactivated account: {}", identifier);
                throw new RuntimeException("Account is deactivated");
            }
            
            if (!user.isVerified()) {
                logger.warn("⚠️ Login attempt with unverified email: {}", user.getEmail() != null ? user.getEmail() : identifier);
                throw new RuntimeException("Please verify your email before logging in");
            }
            
            String token = "jwt-token-" + user.getId();
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("role", role != null ? role : "CUSTOMER");
            response.put("userType", role != null ? role : "CUSTOMER");
            
            logger.info("✅ User logged in successfully - Email: {}, Role: {}, Collection: {}", 
                user.getEmail() != null ? user.getEmail() : identifier, 
                role != null ? role : "CUSTOMER", 
                (role != null ? role.toLowerCase() : "customer") + "s");
            LoggingUtil.logMethodExit(logger, "loginUser", "User logged in successfully");
            return response;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "loginUser", ex, requestDTO.getEmail());
            throw ex;
        }
    }
    
    /**
     * Verify email - checks all collections
     */
    public boolean verifyEmail(String verificationCode) {
        LoggingUtil.logMethodEntry(logger, "verifyEmail", verificationCode);
        
        try {
            // Check customers
            Optional<Customer> customerOpt = customerRepository.findByVerificationCode(verificationCode);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                customer.setVerified(true);
                customer.setVerificationCode(null);
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                logger.info("✅ Customer email verified - ID: {}", customer.getId());
                return true;
            }
            
            // Check providers
            Optional<Provider> providerOpt = providerRepository.findByVerificationCode(verificationCode);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setVerified(true);
                provider.setVerificationCode(null);
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                logger.info("✅ Provider email verified - ID: {}", provider.getId());
                return true;
            }
            
            // Check legacy users collection
            Optional<User> userOpt = userRepository.findByVerificationCode(verificationCode);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerified(true);
                user.setVerificationCode(null);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ User email verified (legacy) - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("Invalid verification code");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "verifyEmail", ex, verificationCode);
            throw ex;
        }
    }
    
    /**
     * Resend verification code - checks all collections
     */
    public boolean resendVerificationCode(String email) {
        LoggingUtil.logMethodEntry(logger, "resendVerificationCode", email);
        
        try {
            String newCode = UUID.randomUUID().toString();
            
            // Check customers
            Optional<Customer> customerOpt = customerRepository.findByEmail(email);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                customer.setVerificationCode(newCode);
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                logger.info("✅ Verification code resent to customer - ID: {}", customer.getId());
                return true;
            }
            
            // Check providers
            Optional<Provider> providerOpt = providerRepository.findByEmail(email);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setVerificationCode(newCode);
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                logger.info("✅ Verification code resent to provider - ID: {}", provider.getId());
                return true;
            }
            
            // Check legacy users
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerificationCode(newCode);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ Verification code resent to user (legacy) - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("User not found");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "resendVerificationCode", ex, email);
            throw ex;
        }
    }
    
    /**
     * Forgot password - checks all collections
     */
    public boolean forgotPassword(String email) {
        LoggingUtil.logMethodEntry(logger, "forgotPassword", email);
        
        try {
            String resetToken = "reset-token-" + UUID.randomUUID().toString();
            
            // Check customers
            Optional<Customer> customerOpt = customerRepository.findByEmail(email);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                customer.setVerificationCode(resetToken);
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                logger.info("✅ Password reset token generated for customer - ID: {}", customer.getId());
                return true;
            }
            
            // Check providers
            Optional<Provider> providerOpt = providerRepository.findByEmail(email);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setVerificationCode(resetToken);
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                logger.info("✅ Password reset token generated for provider - ID: {}", provider.getId());
                return true;
            }
            
            // Check legacy users
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setVerificationCode(resetToken);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ Password reset token generated for user (legacy) - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("User not found");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "forgotPassword", ex, email);
            throw ex;
        }
    }
    
    /**
     * Reset password - checks all collections
     */
    public boolean resetPassword(String token, String newPassword) {
        LoggingUtil.logMethodEntry(logger, "resetPassword", token);
        
        try {
            String encodedPassword = passwordEncoder.encode(newPassword);
            
            // Check customers
            Optional<Customer> customerOpt = customerRepository.findByVerificationCode(token);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                customer.setPassword(encodedPassword);
                customer.setVerificationCode(null);
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                logger.info("✅ Password reset for customer - ID: {}", customer.getId());
                return true;
            }
            
            // Check providers
            Optional<Provider> providerOpt = providerRepository.findByVerificationCode(token);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setPassword(encodedPassword);
                provider.setVerificationCode(null);
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                logger.info("✅ Password reset for provider - ID: {}", provider.getId());
                return true;
            }
            
            // Check legacy users
            Optional<User> userOpt = userRepository.findByVerificationCode(token);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(encodedPassword);
                user.setVerificationCode(null);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ Password reset for user (legacy) - ID: {}", user.getId());
                return true;
            }
            
            throw new RuntimeException("Invalid reset token");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "resetPassword", ex, token);
            throw ex;
        }
    }
    
    /**
     * Logout user - Set offline status (checks all collections)
     */
    public boolean logoutUser(String userId) {
        LoggingUtil.logMethodEntry(logger, "logoutUser", userId);
        
        try {
            // Try customers first
            Optional<Customer> customerOpt = customerRepository.findById(userId);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                customer.setOnline(false);
                customer.setLastSeen(LocalDateTime.now());
                customer.setUpdatedAt(LocalDateTime.now());
                customerRepository.save(customer);
                logger.info("✅ Customer logged out - ID: {}", userId);
                return true;
            }
            
            // Try providers
            Optional<Provider> providerOpt = providerRepository.findById(userId);
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setUpdatedAt(LocalDateTime.now());
                providerRepository.save(provider);
                logger.info("✅ Provider logged out - ID: {}", userId);
                return true;
            }
            
            // Try legacy users
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setOnline(false);
                user.setLastSeen(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                logger.info("✅ User logged out (legacy) - ID: {}", userId);
                return true;
            }
            
            throw new RuntimeException("User not found");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "logoutUser", ex, userId);
            throw ex;
        }
    }
}
