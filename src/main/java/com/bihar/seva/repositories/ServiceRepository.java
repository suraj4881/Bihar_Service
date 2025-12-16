package com.bihar.seva.repositories;

import com.bihar.seva.model.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends MongoRepository<Service, String> {
    
    // Find by category
    List<Service> findByCategoryAndIsActiveTrue(String category);
    Page<Service> findByCategoryAndIsActiveTrue(String category, Pageable pageable);
    
    // Find all active services
    List<Service> findByIsActiveTrue();
    Page<Service> findByIsActiveTrue(Pageable pageable);
    
    // Find by subcategory
    List<Service> findBySubcategoryAndIsActiveTrue(String subcategory);
    
    // Find popular services
    List<Service> findByIsPopularTrueAndIsActiveTrueOrderByBookingCountDesc();
    
    // Find custom services
    List<Service> findByIsCustomTrueAndIsActiveTrue();
    
    // Search by name or description
    @Query("{'$and': [{'isActive': true}, {'$or': [{'name': {'$regex': '?0', '$options': 'i'}}, {'description': {'$regex': '?0', '$options': 'i'}}, {'tags': {'$regex': '?0', '$options': 'i'}}]}]}")
    List<Service> searchServices(String searchTerm);
    
    @Query("{'$and': [{'isActive': true}, {'$or': [{'name': {'$regex': '?0', '$options': 'i'}}, {'description': {'$regex': '?0', '$options': 'i'}}, {'tags': {'$regex': '?0', '$options': 'i'}}]}]}")
    Page<Service> searchServices(String searchTerm, Pageable pageable);
    
    // Find by price range
    @Query("{'$and': [{'isActive': true}, {'basePrice': {'$gte': ?0, '$lte': ?1}}]}")
    List<Service> findByPriceRange(double minPrice, double maxPrice);
    
    // Find by tags
    @Query("{'$and': [{'isActive': true}, {'tags': {'$in': ?0}}]}")
    List<Service> findByTagsIn(List<String> tags);
    
    // Find by category and price range
    @Query("{'$and': [{'isActive': true}, {'category': ?0}, {'basePrice': {'$gte': ?1, '$lte': ?2}}]}")
    List<Service> findByCategoryAndPriceRange(String category, double minPrice, double maxPrice);
    
    // Find by created by (for custom services)
    List<Service> findByCreatedByAndIsActiveTrue(String createdBy);
    
    // Find by name (exact match)
    Optional<Service> findByNameAndIsActiveTrue(String name);
    
    // Find by category and sort by popularity
    List<Service> findByCategoryAndIsActiveTrueOrderByBookingCountDesc(String category);
    
    // Find by category and sort by rating
    List<Service> findByCategoryAndIsActiveTrueOrderByAverageRatingDesc(String category);
    
    // Find by category and sort by price
    List<Service> findByCategoryAndIsActiveTrueOrderByBasePriceAsc(String category);
    
    // Count services by category
    long countByCategoryAndIsActiveTrue(String category);
    
    // Count custom services
    long countByIsCustomTrueAndIsActiveTrue();
}
