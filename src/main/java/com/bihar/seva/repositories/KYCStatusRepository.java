package com.bihar.seva.repositories;

import com.bihar.seva.model.KYCStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface KYCStatusRepository extends MongoRepository<KYCStatus, String> {
    Optional<KYCStatus> findByUserId(String userId);
    List<KYCStatus> findByOverallStatus(String status);
}