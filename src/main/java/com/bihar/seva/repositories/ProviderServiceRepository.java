package com.bihar.seva.repositories;

import com.bihar.seva.model.ProviderService;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProviderServiceRepository extends MongoRepository<ProviderService, String> {
    List<ProviderService> findByProviderId(String providerId);
    List<ProviderService> findByCategory(String category);
    List<ProviderService> findByIsApprovedAndIsActive(Boolean isApproved, Boolean isActive);
    List<ProviderService> findByIsApproved(Boolean isApproved);
    Long countByIsApproved(Boolean isApproved);
}

