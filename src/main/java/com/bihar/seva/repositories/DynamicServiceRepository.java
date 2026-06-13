package com.bihar.seva.repositories;

import com.bihar.seva.model.DynamicService;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DynamicServiceRepository extends MongoRepository<DynamicService, String> {
    
    // Find by provider
    List<DynamicService> findByProviderId(String providerId);
    
    // Find active services by provider
    List<DynamicService> findByProviderIdAndIsActiveTrue(String providerId);
    
    // Find by category
    List<DynamicService> findByCategoryAndIsActiveTrueAndIsApprovedTrue(String category);
    
    // Find by city
    List<DynamicService> findByCityAndIsActiveTrueAndIsApprovedTrue(String city);

    // Find by city or area (partial match)
    @Query("{ $and: [ { $or: [ " +
        "{ 'city': { $regex: ?0, $options: 'i' } }, " +
        "{ 'address': { $regex: ?0, $options: 'i' } }, " +
        "{ 'serviceAreas': { $regex: ?0, $options: 'i' } } " +
        "] }, { 'isActive': true }, { 'isApproved': true } ] }")
    List<DynamicService> searchByCityPattern(String cityPattern);
    
    // Find by pincode
    List<DynamicService> findByPincodeAndIsActiveTrueAndIsApprovedTrue(String pincode);
    
    // Location-based search (within radius)
    @Query("{ 'location': { $near: { $geometry: { type: 'Point', coordinates: [?0, ?1] }, $maxDistance: ?2 }, 'isActive': true, 'isApproved': true } }")
    List<DynamicService> findNearbyServices(double longitude, double latitude, double maxDistanceInMeters);
    
    // Text search for service name
    @Query("{ $text: { $search: ?0 }, 'isActive': true, 'isApproved': true }")
    List<DynamicService> searchByServiceName(String searchText);

    // Text search across service + provider fields
    @Query("{ $and: [ { $or: [ " +
        "{ 'serviceName': { $regex: ?0, $options: 'i' } }, " +
        "{ 'providerName': { $regex: ?0, $options: 'i' } }, " +
        "{ 'category': { $regex: ?0, $options: 'i' } }, " +
        "{ 'description': { $regex: ?0, $options: 'i' } }, " +
        "{ 'tags': { $regex: ?0, $options: 'i' } } " +
        "] }, { 'isActive': true }, { 'isApproved': true } ] }")
    List<DynamicService> searchByText(String searchText);
    
    // Find similar service names (for auto-categorization)
    // Matches services where serviceName contains the pattern (case-insensitive)
    @Query("{ 'serviceName': { $regex: ?0, $options: 'i' }, 'isActive': true, 'isApproved': true }")
    List<DynamicService> findSimilarServices(String serviceNamePattern);
    
    // Find services by service name (exact or partial match)
    List<DynamicService> findByServiceNameContainingIgnoreCaseAndIsActiveTrueAndIsApprovedTrue(String serviceName);
    
    // Find by category and location
    @Query("{ 'category': ?0, 'location': { $near: { $geometry: { type: 'Point', coordinates: [?1, ?2] }, $maxDistance: ?3 }, 'isActive': true, 'isApproved': true } }")
    List<DynamicService> findByCategoryAndLocation(String category, double longitude, double latitude, double maxDistanceInMeters);
    
    // Count services by category
    long countByCategoryAndIsActiveTrueAndIsApprovedTrue(String category);
    
    // Find pending approvals
    List<DynamicService> findByIsApprovedFalse();

    // Find approved services
    List<DynamicService> findByIsApprovedTrue();
    
    // Find by service name (exact match for duplicate check)
    Optional<DynamicService> findByServiceNameIgnoreCaseAndProviderId(String serviceName, String providerId);
    
    // Find by service name (for PaymentService)
    Optional<DynamicService> findByServiceNameIgnoreCase(String serviceName);
}
