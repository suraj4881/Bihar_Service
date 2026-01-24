package com.bihar.seva.repositories;

import com.bihar.seva.model.WalletTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WalletTransactionRepository extends MongoRepository<WalletTransaction, String> {
    
    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(String walletId);
    
    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<WalletTransaction> findByReferenceIdAndReferenceType(String referenceId, String referenceType);
}
