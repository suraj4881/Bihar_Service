package com.bihar.seva.repositories;

import com.bihar.seva.model.WithdrawalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WithdrawalRequestRepository extends MongoRepository<WithdrawalRequest, String> {
    List<WithdrawalRequest> findByProviderIdOrderByRequestedAtDesc(String providerId);
    List<WithdrawalRequest> findAllByOrderByRequestedAtDesc();
}
