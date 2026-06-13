package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Review;
import com.bihar.seva.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    
    private final ReviewService reviewService;
    
    // Create review
    @PostMapping
    public ResponseEntity<ApiResponse> createReview(@Valid @RequestBody Review review) {
        try {
            Review created = reviewService.createReview(review);
            return ResponseEntity.ok(new ApiResponse(true, "Review created successfully", created));
        } catch (Exception e) {
            log.error("Error creating review: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider reviews
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse> getProviderReviews(@PathVariable String providerId) {
        try {
            List<Review> reviews = reviewService.getProviderReviews(providerId);
            return ResponseEntity.ok(new ApiResponse(true, "Reviews retrieved", reviews));
        } catch (Exception e) {
            log.error("Error fetching reviews: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get customer reviews
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse> getCustomerReviews(@PathVariable String customerId) {
        try {
            List<Review> reviews = reviewService.getCustomerReviews(customerId);
            return ResponseEntity.ok(new ApiResponse(true, "Reviews retrieved", reviews));
        } catch (Exception e) {
            log.error("Error fetching customer reviews: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get review by booking
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse> getReviewByBooking(@PathVariable String bookingId) {
        try {
            var review = reviewService.getReviewByBooking(bookingId);
            if (review.isPresent()) {
                return ResponseEntity.ok(new ApiResponse(true, "Review retrieved", review.get()));
            } else {
                return ResponseEntity.ok(new ApiResponse(true, "No review found", null));
            }
        } catch (Exception e) {
            log.error("Error fetching review: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Provider responds to review
    @PutMapping("/{reviewId}/response")
    public ResponseEntity<ApiResponse> addProviderResponse(
            @PathVariable String reviewId,
            @RequestParam String response) {
        try {
            Review review = reviewService.updateProviderResponse(reviewId, response);
            return ResponseEntity.ok(new ApiResponse(true, "Response added", review));
        } catch (Exception e) {
            log.error("Error adding response: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Admin: Get pending reviews
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse> getPendingReviews() {
        try {
            List<Review> reviews = reviewService.getPendingReviews();
            return ResponseEntity.ok(new ApiResponse(true, "Pending reviews retrieved", reviews));
        } catch (Exception e) {
            log.error("Error fetching pending reviews: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Admin: Approve review
    @PutMapping("/{reviewId}/approve")
    public ResponseEntity<ApiResponse> approveReview(@PathVariable String reviewId) {
        try {
            Review review = reviewService.approveReview(reviewId);
            return ResponseEntity.ok(new ApiResponse(true, "Review approved", review));
        } catch (Exception e) {
            log.error("Error approving review: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Delete review
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse> deleteReview(@PathVariable String reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(new ApiResponse(true, "Review deleted", null));
        } catch (Exception e) {
            log.error("Error deleting review: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}

