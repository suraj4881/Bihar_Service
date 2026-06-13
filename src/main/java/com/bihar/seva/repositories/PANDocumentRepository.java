package com.bihar.seva.repositories;

import com.bihar.seva.model.PANDocument;
import com.bihar.seva.model.PANDocument.VerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PANDocumentRepository extends MongoRepository<PANDocument, String> {
    Optional<PANDocument> findByUserId(String userId);
    List<PANDocument> findByStatus(VerificationStatus status);
    List<PANDocument> findByUserRole(String userRole);
    Long countByStatus(VerificationStatus status);
    
    // Find documents that are NOT VERIFIED and NOT REJECTED (i.e., PENDING, UNDER_REVIEW, or NULL)
    // MongoDB stores enum values as strings (e.g., "PENDING", "VERIFIED"), so we check for null or status not in ['VERIFIED', 'REJECTED']
    @Query("{ $or: [ { status: null }, { status: { $nin: ['VERIFIED', 'REJECTED'] } } ] }")
    List<PANDocument> findPendingOrUnderReview();
    
    // Alternative: Find by status IN [PENDING, UNDER_REVIEW] or null (using enum values)
    @Query("{ $or: [ { status: null }, { status: { $in: ['PENDING', 'UNDER_REVIEW'] } } ] }")
    List<PANDocument> findPendingOrUnderReviewAlternative();
}
