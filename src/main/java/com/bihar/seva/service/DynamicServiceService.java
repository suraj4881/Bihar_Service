package com.bihar.seva.service;

import com.bihar.seva.model.Category;
import com.bihar.seva.model.DynamicService;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.CategoryRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for Dynamic Service Creation with Auto-Categorization
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicServiceService {
    
    private final DynamicServiceRepository serviceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    
    /**
     * Create a new service with auto-categorization
     * If similar service exists, suggest existing category
     */
    public DynamicService createService(DynamicService service, String providerId) {
        log.info("Creating service: {} for provider: {}", service.getServiceName(), providerId);
        
        // Get provider details
        User provider = userRepository.findById(providerId)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        
        service.setProviderId(providerId);
        service.setProviderName(provider.getName());
        service.setPhone(provider.getPhone());
        
        // Use provider-selected category when sent; otherwise auto-categorize from title
        String category;
        if (service.getCategory() != null && !service.getCategory().isBlank()) {
            category = service.getCategory().trim();
            service.setCategory(category);
            log.info("Using provider-selected category: {}", category);
        } else {
            category = autoCategorizeService(service.getServiceName());
            service.setCategory(category);
        }
        
        // Set location if provider has GPS coordinates
        if (provider.getLatitude() != null && provider.getLongitude() != null) {
            Point location = new Point(provider.getLongitude(), provider.getLatitude());
            service.setLocation(location);
        }
        
        // Calculate final price with commission
        service.calculateFinalPrice();
        
        // Set timestamps
        service.setCreatedAt(LocalDateTime.now());
        service.setUpdatedAt(LocalDateTime.now());
        
        // Save service
        DynamicService savedService = serviceRepository.save(service);
        
        // Update category stats
        updateCategoryStats(category);
        
        log.info("Service created successfully: {}", savedService.getId());
        return savedService;
    }
    
    /**
     * Auto-categorize service based on service name
     * Checks for similar services and suggests existing category
     */
    private String autoCategorizeService(String serviceName) {
        log.info("Auto-categorizing service: {}", serviceName);
        
        // Normalize service name for comparison
        String normalizedName = normalizeServiceName(serviceName);
        
        // Check if similar service exists
        List<DynamicService> similarServices = serviceRepository.findSimilarServices(normalizedName);
        
        if (!similarServices.isEmpty()) {
            // Find most common category from similar services
            Map<String, Long> categoryCount = similarServices.stream()
                .filter(s -> s.getCategory() != null)
                .collect(Collectors.groupingBy(
                    DynamicService::getCategory,
                    Collectors.counting()
                ));
            
            if (!categoryCount.isEmpty()) {
                // Get most common category
                String suggestedCategory = categoryCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
                
                if (suggestedCategory != null) {
                    log.info("Found similar service, using category: {}", suggestedCategory);
                    return suggestedCategory;
                }
            }
        }
        
        // No similar service found, create new category or use service name as category
        String newCategory = extractCategoryFromName(serviceName);
        
        // Check if category exists
        Optional<Category> existingCategory = categoryRepository.findByNameIgnoreCase(newCategory);
        
        if (existingCategory.isPresent()) {
            log.info("Category exists: {}", newCategory);
            return newCategory;
        } else {
            // Create new category
            Category category = new Category();
            category.setName(newCategory.toLowerCase());
            category.setDisplayName(newCategory);
            category.setDescription("Auto-generated category");
            category.setIsAutoGenerated(true);
            category.setIsActive(true);
            category.setCreatedAt(LocalDateTime.now());
            category.setUpdatedAt(LocalDateTime.now());
            
            Category savedCategory = categoryRepository.save(category);
            log.info("Created new category: {}", savedCategory.getName());
            return savedCategory.getName();
        }
    }
    
    /**
     * Normalize service name for comparison
     */
    private String normalizeServiceName(String serviceName) {
        return serviceName.toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "")
            .trim();
    }
    
    /**
     * Extract category from service name
     * Simple keyword-based extraction
     */
    private String extractCategoryFromName(String serviceName) {
        String lowerName = serviceName.toLowerCase();
        
        // Common service categories mapping
        Map<String, String> categoryKeywords = new HashMap<>();
        categoryKeywords.put("plumb", "Plumbing");
        categoryKeywords.put("electric", "Electrical");
        categoryKeywords.put("clean", "Cleaning");
        categoryKeywords.put("carpent", "Carpentry");
        categoryKeywords.put("paint", "Painting");
        categoryKeywords.put("ac", "AC Repair");
        categoryKeywords.put("appliance", "Appliance Repair");
        categoryKeywords.put("repair", "Repair Services");
        categoryKeywords.put("install", "Installation");
        categoryKeywords.put("maintenance", "Maintenance");
        
        for (Map.Entry<String, String> entry : categoryKeywords.entrySet()) {
            if (lowerName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // Default: Use first word of service name as category
        String[] words = serviceName.split("\\s+");
        if (words.length > 0) {
            return words[0].substring(0, 1).toUpperCase() + words[0].substring(1).toLowerCase();
        }
        
        return "Other Services";
    }
    
    /**
     * Get existing services for dropdown (to prevent duplicates)
     * Returns service names that match the search text
     */
    public List<String> getExistingServiceNames(String searchText) {
        if (searchText == null || searchText.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        String normalized = normalizeServiceName(searchText);
        List<DynamicService> services = serviceRepository.findSimilarServices(normalized);
        
        return services.stream()
            .map(DynamicService::getServiceName)
            .distinct()
            .limit(10) // Limit to 10 suggestions
            .collect(Collectors.toList());
    }
    
    /**
     * Get existing services with full details for auto-complete
     * Shows similar services so provider can select existing one
     */
    public List<DynamicService> getExistingServicesForAutocomplete(String searchText) {
        if (searchText == null || searchText.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        String normalized = normalizeServiceName(searchText);
        List<DynamicService> services = serviceRepository.findSimilarServices(normalized);
        
        return services.stream()
            .filter(s -> s.getIsActive() && s.getIsApproved())
            .distinct()
            .limit(10)
            .collect(Collectors.toList());
    }
    
    /**
     * Get services by provider
     */
    public List<DynamicService> getServicesByProvider(String providerId) {
        return serviceRepository.findByProviderIdAndIsActiveTrue(providerId);
    }

    /**
     * Get service by ID
     */
    public Optional<DynamicService> getServiceById(String serviceId) {
        return serviceRepository.findById(serviceId);
    }

    /**
     * Get services by approval status
     */
    public List<DynamicService> getServicesByApproval(Boolean isApproved) {
        if (isApproved == null) {
            return serviceRepository.findAll();
        }
        return isApproved ? serviceRepository.findByIsApprovedTrue() : serviceRepository.findByIsApprovedFalse();
    }

    /**
     * Approve a service
     */
    public DynamicService approveService(String serviceId, String adminUserId) {
        DynamicService service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));

        service.setIsApproved(true);
        service.setApprovedBy(adminUserId);
        service.setApprovedAt(LocalDateTime.now());
        service.setRejectionReason(null);
        service.setUpdatedAt(LocalDateTime.now());

        return serviceRepository.save(service);
    }

    /**
     * Reject a service
     */
    public DynamicService rejectService(String serviceId, String adminUserId, String rejectionReason) {
        DynamicService service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));

        service.setIsApproved(false);
        service.setApprovedBy(adminUserId);
        service.setApprovedAt(LocalDateTime.now());
        service.setRejectionReason(rejectionReason);
        service.setUpdatedAt(LocalDateTime.now());

        return serviceRepository.save(service);
    }
    
    /**
     * Update category statistics
     */
    private void updateCategoryStats(String categoryName) {
        Optional<Category> categoryOpt = categoryRepository.findByNameIgnoreCase(categoryName);
        if (categoryOpt.isPresent()) {
            Category category = categoryOpt.get();
            long serviceCount = serviceRepository.countByCategoryAndIsActiveTrueAndIsApprovedTrue(categoryName);
            category.setServiceCount((int) serviceCount);
            category.setUpdatedAt(LocalDateTime.now());
            categoryRepository.save(category);
        }
    }
    
    /**
     * Search services by location and radius
     */
    public List<DynamicService> searchServicesByLocation(
        Double latitude, Double longitude, Double radiusInKm) {
        
        if (latitude == null || longitude == null) {
            return Collections.emptyList();
        }
        
        // Convert km to meters
        double maxDistanceInMeters = (radiusInKm != null ? radiusInKm : 5.0) * 1000;
        
        log.info("Searching services near: [{}, {}] within {} km", 
            latitude, longitude, radiusInKm);
        
        return serviceRepository.findNearbyServices(
            longitude, latitude, maxDistanceInMeters
        );
    }
    
    /**
     * Search services by text and location
     */
    public List<DynamicService> searchServices(String searchText, 
        Double latitude, Double longitude, Double radiusInKm) {
        
        List<DynamicService> results;
        
        if (searchText != null && !searchText.trim().isEmpty()) {
            // Text search across service + provider fields
            String escaped = Pattern.quote(searchText.trim());
            results = serviceRepository.searchByText(escaped);
        } else {
            // Location-based search
            results = searchServicesByLocation(latitude, longitude, radiusInKm);
        }
        
        // Filter by location if coordinates provided
        if (latitude != null && longitude != null && radiusInKm != null) {
            double maxDistance = radiusInKm * 1000; // Convert to meters
            
            results = results.stream()
                .filter(service -> {
                    if (service.getLocation() == null) return false;
                    double distance = calculateDistance(
                        service.getLocation().getY(), service.getLocation().getX(),
                        latitude, longitude
                    );
                    return distance <= maxDistance;
                })
                .collect(Collectors.toList());
        }
        
        return results;
    }
    
    /**
     * Calculate distance between two points (Haversine formula)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c * 1000; // Return in meters
    }
    
    /**
     * Search services by pincode
     */
    public List<DynamicService> searchServicesByPincode(String pincode, String searchText, String category) {
        log.info("Searching services by pincode: {}", pincode);
        
        List<DynamicService> results = serviceRepository.findByPincodeAndIsActiveTrueAndIsApprovedTrue(pincode);
        
        // Filter by search text if provided
        if (searchText != null && !searchText.trim().isEmpty()) {
            String normalizedSearch = normalizeSearchText(searchText);
            results = results.stream()
                .filter(service -> matchesSearchText(service, normalizedSearch))
                .collect(Collectors.toList());
        }
        
        // Filter by category if provided
        if (category != null && !category.trim().isEmpty()) {
            results = results.stream()
                .filter(service -> category.equalsIgnoreCase(service.getCategory()))
                .collect(Collectors.toList());
        }
        
        return results;
    }
    
    /**
     * Search services by city
     */
    public List<DynamicService> searchServicesByCity(String city, String searchText, String category) {
        log.info("Searching services by city: {}", city);
        
        String cityPattern = Pattern.quote(city.trim());
        List<DynamicService> results = serviceRepository.searchByCityPattern(cityPattern);
        
        // Filter by search text if provided
        if (searchText != null && !searchText.trim().isEmpty()) {
            String normalizedSearch = normalizeSearchText(searchText);
            results = results.stream()
                .filter(service -> matchesSearchText(service, normalizedSearch))
                .collect(Collectors.toList());
        }
        
        // Filter by category if provided
        if (category != null && !category.trim().isEmpty()) {
            results = results.stream()
                .filter(service -> category.equalsIgnoreCase(service.getCategory()))
                .collect(Collectors.toList());
        }
        
        return results;
    }

    private String normalizeSearchText(String searchText) {
        if (searchText == null) {
            return "";
        }
        return searchText.trim().toLowerCase(Locale.ROOT);
    }

    private boolean matchesSearchText(DynamicService service, String normalizedSearch) {
        if (normalizedSearch == null || normalizedSearch.isEmpty()) {
            return true;
        }

        String serviceName = normalizeSearchText(service.getServiceName());
        String providerName = normalizeSearchText(service.getProviderName());
        String category = normalizeSearchText(service.getCategory());
        String description = normalizeSearchText(service.getDescription());
        boolean tagsMatch = false;

        if (service.getTags() != null) {
            tagsMatch = service.getTags().stream()
                .map(this::normalizeSearchText)
                .anyMatch(tag -> tag.contains(normalizedSearch));
        }

        return serviceName.contains(normalizedSearch)
            || providerName.contains(normalizedSearch)
            || category.contains(normalizedSearch)
            || description.contains(normalizedSearch)
            || tagsMatch;
    }
}
