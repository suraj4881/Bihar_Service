package com.bihar.seva.repositories;

import com.bihar.seva.model.ServiceCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends MongoRepository<ServiceCategory, String> {
    List<ServiceCategory> findByActive(boolean active);
    Optional<ServiceCategory> findByName(String name);
}
