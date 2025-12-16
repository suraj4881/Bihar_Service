package com.bihar.seva.repositories;

import com.bihar.seva.model.ProviderProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProviderProfileRepository extends MongoRepository<ProviderProfile, String> {
    Optional<ProviderProfile> findByUserId(String userId);
    Optional<ProviderProfile> findByProviderId(String providerId);
}

