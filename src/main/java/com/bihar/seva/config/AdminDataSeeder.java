package com.bihar.seva.config;

import com.bihar.seva.model.User;
import com.bihar.seva.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Creates a default admin user on application startup if it doesn't exist
 */
@Component
@Slf4j
public class AdminDataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Default Admin Credentials
    private static final String ADMIN_EMAIL = "admin@quicksevabihar.com";
    private static final String ADMIN_PASSWORD = "Admin@123";
    private static final String ADMIN_NAME = "QuickSeva Bihar Admin";
    private static final String ADMIN_PHONE = "9876543210";

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if admin user already exists
            if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
                log.info("✅ Admin user already exists: {}", ADMIN_EMAIL);
                return;
            }

            // Create admin user
            User admin = new User();
            admin.setName(ADMIN_NAME);
            admin.setEmail(ADMIN_EMAIL);
            admin.setPhone(ADMIN_PHONE);
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setRole("ADMIN");
            admin.setActive(true);
            admin.setVerified(true);
            admin.setLanguage("English");
            admin.setCity("Patna");
            admin.setState("Bihar");
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());

            User savedAdmin = userRepository.save(admin);
            log.info("==========================================");
            log.info("✅ ADMIN USER CREATED SUCCESSFULLY!");
            log.info("==========================================");
            log.info("📧 Email: {}", ADMIN_EMAIL);
            log.info("🔑 Password: {}", ADMIN_PASSWORD);
            log.info("👤 Name: {}", ADMIN_NAME);
            log.info("🆔 User ID: {}", savedAdmin.getId());
            log.info("==========================================");
            log.info("⚠️  Please change the password after first login!");
            log.info("==========================================");

        } catch (Exception e) {
            log.error("❌ Error creating admin user: {}", e.getMessage(), e);
        }
    }
}
