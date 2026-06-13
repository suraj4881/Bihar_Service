package com.bihar.seva.repositories;

import com.bihar.seva.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByProviderId(String providerId);
    List<Review> findByCustomerId(String customerId);
    List<Review> findByBookingId(String bookingId);
    List<Review> findByProviderIdAndIsApproved(String providerId, boolean isApproved);
    List<Review> findByIsApproved(boolean isApproved);
    long countByProviderId(String providerId);
    
    // Calculate average rating across all reviews
    @Query(value = "{isApproved: true}")
    default Double getAverageRating() {
        List<Review> reviews = findByIsApproved(true);
        if (reviews.isEmpty()) {
            return 4.8; // Default rating
        }
        double sum = reviews.stream()
            .mapToInt(Review::getRating)
            .average()
            .orElse(4.8);
        return Math.round(sum * 10.0) / 10.0;
    }
}

