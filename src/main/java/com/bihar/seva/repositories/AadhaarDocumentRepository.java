package com.bihar.seva.repositories;

import com.bihar.seva.model.AadhaarDocument;
import com.bihar.seva.model.AadhaarDocument.VerificationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AadhaarDocumentRepository extends MongoRepository<AadhaarDocument, String> {
    Optional<AadhaarDocument> findByUserId(String userId);
    List<AadhaarDocument> findByStatus(VerificationStatus status);
    List<AadhaarDocument> findByUserRole(String userRole);
    Long countByStatus(VerificationStatus status);
    
    // Find documents that are NOT VERIFIED and NOT REJECTED (i.e., PENDING, UNDER_REVIEW, or NULL)
    // MongoDB stores enum values as strings (e.g., "PENDING", "VERIFIED"), so we check for null or status not in ['VERIFIED', 'REJECTED']
    @Query("{ $or: [ { status: null }, { status: { $nin: ['VERIFIED', 'REJECTED'] } } ] }")
    List<AadhaarDocument> findPendingOrUnderReview();
    
    // Alternative: Find by status IN [PENDING, UNDER_REVIEW] or null (using enum values)
    @Query("{ $or: [ { status: null }, { status: { $in: ['PENDING', 'UNDER_REVIEW'] } } ] }")
    List<AadhaarDocument> findPendingOrUnderReviewAlternative();
}
