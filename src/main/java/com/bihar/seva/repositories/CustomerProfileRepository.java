package com.bihar.seva.repositories;

import com.bihar.seva.model.CustomerProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends MongoRepository<CustomerProfile, String> {
    Optional<CustomerProfile> findByUserId(String userId);
    Optional<CustomerProfile> findByCustomerId(String customerId);
}

