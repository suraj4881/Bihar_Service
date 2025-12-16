package com.bihar.seva.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;

@Configuration
@Slf4j
public class FirebaseConfig {
    
    @PostConstruct
    public void initialize() {
        try {
            // Try to load from classpath first
            try {
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                        new ClassPathResource("firebase-service-account.json").getInputStream()))
                    .build();
                
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    log.info("Firebase Admin SDK initialized successfully");
                }
            } catch (Exception e) {
                // If file not found, initialize with default credentials
                log.warn("Firebase service account file not found, using default credentials");
                log.info("Firebase can be configured later by placing firebase-service-account.json in resources folder");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase", e);
        }
    }
}

