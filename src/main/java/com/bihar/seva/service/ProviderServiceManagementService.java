package com.bihar.seva.service;

import com.bihar.seva.model.ProviderService;
import com.bihar.seva.repositories.ProviderServiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProviderServiceManagementService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProviderServiceManagementService.class);
    private static final String UPLOAD_DIR = "uploads/services/";
    private static final Double DEFAULT_COMMISSION_RATE = 20.0; // 20%
    
    @Autowired
    private ProviderServiceRepository providerServiceRepository;
    
    /**
     * Upload new service by provider
     */
    public ProviderService uploadService(ProviderService serviceData, List<MultipartFile> images) throws IOException {
        logger.info("Service upload started by provider: {}", serviceData.getProviderId());
        
        // Set default values
        serviceData.setCreatedAt(LocalDateTime.now());
        serviceData.setUpdatedAt(LocalDateTime.now());
        serviceData.setIsApproved(false); // Requires admin approval
        serviceData.setIsActive(false);
        serviceData.setCommissionRate(DEFAULT_COMMISSION_RATE);
        
        // Calculate final price with commission
        serviceData.calculateFinalPrice();
        
        logger.info("Provider base price: ₹{}, Commission: {}%, Final customer price: ₹{}", 
                   serviceData.getBasePrice(), 
                   serviceData.getCommissionRate(), 
                   serviceData.getFinalPrice());
        
        // Save service images
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile image : images) {
                String imageUrl = saveServiceImage(image, serviceData.getProviderId());
                imageUrls.add(imageUrl);
            }
            serviceData.setServiceImages(imageUrls);
            logger.info("Uploaded {} service images", imageUrls.size());
        }
        
        ProviderService savedService = providerServiceRepository.save(serviceData);
        logger.info("Service uploaded successfully with ID: {}", savedService.getId());
        
        return savedService;
    }
    
    /**
     * Save service image to local storage
     */
    private String saveServiceImage(MultipartFile file, String providerId) throws IOException {
        logger.debug("Saving service image for provider: {}", providerId);
        
        // Create upload directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
            logger.info("Created upload directory: {}", UPLOAD_DIR);
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        String filename = providerId + "_" + UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = Paths.get(UPLOAD_DIR + filename);
        Files.write(filePath, file.getBytes());
        
        logger.debug("Service image saved: {}", filename);
        return "/uploads/services/" + filename;
    }
    
    /**
     * Get all services by provider ID
     */
    public List<ProviderService> getServicesByProvider(String providerId) {
        logger.info("Fetching services for provider: {}", providerId);
        return providerServiceRepository.findByProviderId(providerId);
    }
    
    /**
     * Get all approved and active services
     */
    public List<ProviderService> getApprovedServices() {
        logger.info("Fetching all approved and active services");
        return providerServiceRepository.findByIsApprovedAndIsActive(true, true);
    }
    
    /**
     * Get services by category
     */
    public List<ProviderService> getServicesByCategory(String category) {
        logger.info("Fetching services for category: {}", category);
        return providerServiceRepository.findByCategory(category);
    }
    
    /**
     * Get pending services for admin approval
     */
    public List<ProviderService> getPendingServices() {
        logger.info("Fetching pending services for admin review");
        return providerServiceRepository.findByIsApproved(false);
    }
    
    /**
     * Admin approve service
     */
    public ProviderService approveService(String serviceId, String adminId) {
        logger.info("Approving service: {} by admin: {}", serviceId, adminId);
        
        Optional<ProviderService> serviceOpt = providerServiceRepository.findById(serviceId);
        if (serviceOpt.isEmpty()) {
            logger.error("Service not found: {}", serviceId);
            throw new RuntimeException("Service not found");
        }
        
        ProviderService service = serviceOpt.get();
        service.setIsApproved(true);
        service.setIsActive(true);
        service.setApprovedBy(adminId);
        service.setApprovedAt(LocalDateTime.now());
        service.setUpdatedAt(LocalDateTime.now());
        
        ProviderService savedService = providerServiceRepository.save(service);
        logger.info("Service approved successfully: {}", serviceId);
        
        return savedService;
    }
    
    /**
     * Admin reject service
     */
    public ProviderService rejectService(String serviceId, String adminId, String reason) {
        logger.info("Rejecting service: {} by admin: {}, reason: {}", serviceId, adminId, reason);
        
        Optional<ProviderService> serviceOpt = providerServiceRepository.findById(serviceId);
        if (serviceOpt.isEmpty()) {
            logger.error("Service not found: {}", serviceId);
            throw new RuntimeException("Service not found");
        }
        
        ProviderService service = serviceOpt.get();
        service.setIsApproved(false);
        service.setIsActive(false);
        service.setRejectionReason(reason);
        service.setUpdatedAt(LocalDateTime.now());
        
        ProviderService savedService = providerServiceRepository.save(service);
        logger.info("Service rejected: {}", serviceId);
        
        return savedService;
    }
    
    /**
     * Update commission rate (Admin only)
     */
    public ProviderService updateCommissionRate(String serviceId, Double newCommissionRate) {
        logger.info("Updating commission rate for service: {}, new rate: {}%", serviceId, newCommissionRate);
        
        Optional<ProviderService> serviceOpt = providerServiceRepository.findById(serviceId);
        if (serviceOpt.isEmpty()) {
            logger.error("Service not found: {}", serviceId);
            throw new RuntimeException("Service not found");
        }
        
        ProviderService service = serviceOpt.get();
        service.setCommissionRate(newCommissionRate);
        service.calculateFinalPrice(); // Recalculate prices
        service.setUpdatedAt(LocalDateTime.now());
        
        ProviderService savedService = providerServiceRepository.save(service);
        logger.info("Commission rate updated. New final price: ₹{}", savedService.getFinalPrice());
        
        return savedService;
    }
    
    /**
     * Get service by ID with appropriate price based on role
     */
    public ProviderService getServiceById(String serviceId) {
        logger.info("Fetching service by ID: {}", serviceId);
        return providerServiceRepository.findById(serviceId).orElse(null);
    }
    
    /**
     * Get pending services count
     */
    public Long getPendingServicesCount() {
        return providerServiceRepository.countByIsApproved(false);
    }
}

