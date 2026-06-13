package com.bihar.seva.repositories;

import com.bihar.seva.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    
    // Find by name (case insensitive)
    Optional<Category> findByNameIgnoreCase(String name);
    
    // Find active categories
    List<Category> findByIsActiveTrueOrderByServiceCountDesc();
    
    // Find by display name
    Optional<Category> findByDisplayNameIgnoreCase(String displayName);
    
    // Find popular categories (by service count)
    List<Category> findByIsActiveTrueOrderByServiceCountDescSearchCountDesc();
}
