package com.bihar.seva.service;

import com.bihar.seva.model.Review;
import com.bihar.seva.model.Provider;
import com.bihar.seva.repositories.ReviewRepository;
import com.bihar.seva.repositories.ProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final ProviderRepository providerRepository;
    
    public Review createReview(Review review) {
        review.setCreatedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        Review savedReview = reviewRepository.save(review);
        
        // Update provider rating
        updateProviderRating(review.getProviderId());
        
        log.info("Review created: {} for provider: {}", savedReview.getId(), review.getProviderId());
        return savedReview;
    }
    
    public List<Review> getProviderReviews(String providerId) {
        return reviewRepository.findByProviderIdAndIsApproved(providerId, true);
    }
    
    public List<Review> getCustomerReviews(String customerId) {
        return reviewRepository.findByCustomerId(customerId);
    }
    
    public Optional<Review> getReviewByBooking(String bookingId) {
        List<Review> reviews = reviewRepository.findByBookingId(bookingId);
        return reviews.isEmpty() ? Optional.empty() : Optional.of(reviews.get(0));
    }
    
    public void updateProviderRating(String providerId) {
        List<Review> reviews = reviewRepository.findByProviderIdAndIsApproved(providerId, true);
        
        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
            
            Provider provider = providerRepository.findById(providerId).orElse(null);
            if (provider != null) {
                provider.setRating(Math.round(avgRating * 10.0) / 10.0);
                providerRepository.save(provider);
                log.info("Updated provider {} rating to: {}", providerId, avgRating);
            }
        }
    }
    
    public Review updateProviderResponse(String reviewId, String response) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        
        review.setProviderResponse(response);
        review.setRespondedAt(LocalDateTime.now());
        review.setUpdatedAt(LocalDateTime.now());
        
        return reviewRepository.save(review);
    }
    
    public List<Review> getPendingReviews() {
        return reviewRepository.findByIsApproved(false);
    }
    
    public Review approveReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        
        review.setApproved(true);
        review.setUpdatedAt(LocalDateTime.now());
        
        return reviewRepository.save(review);
    }
    
    public void deleteReview(String reviewId) {
        reviewRepository.deleteById(reviewId);
        log.info("Review deleted: {}", reviewId);
    }
}

