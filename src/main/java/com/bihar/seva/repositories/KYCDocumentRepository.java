package com.bihar.seva.repositories;

import com.bihar.seva.model.KYCDocument;
import com.bihar.seva.model.KYCDocument.VerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface KYCDocumentRepository extends MongoRepository<KYCDocument, String> {
    Optional<KYCDocument> findByUserId(String userId);
    List<KYCDocument> findByStatus(VerificationStatus status);
    List<KYCDocument> findByUserRole(String userRole);
    Long countByStatus(VerificationStatus status);
}
