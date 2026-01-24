package com.bihar.seva.repositories;

import com.bihar.seva.model.Wallet;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface WalletRepository extends MongoRepository<Wallet, String> {
    
    Optional<Wallet> findByUserId(String userId);
    
    Optional<Wallet> findByUserIdAndIsActiveTrue(String userId);
}
