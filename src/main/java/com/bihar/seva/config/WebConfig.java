package com.bihar.seva.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded KYC documents - use absolute path
        String uploadPath = Paths.get("uploads").toAbsolutePath().toString();
        // Normalize path separators for Windows
        uploadPath = uploadPath.replace("\\", "/");
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath)
                .setCachePeriod(3600);
        
        // Serve profile photos
        String profilePath = Paths.get("uploads/profile-photos").toAbsolutePath().toString().replace("\\", "/");
        if (!profilePath.endsWith("/")) {
            profilePath += "/";
        }
        registry.addResourceHandler("/uploads/profile-photos/**")
                .addResourceLocations("file:" + profilePath)
                .setCachePeriod(3600);
    }
}
