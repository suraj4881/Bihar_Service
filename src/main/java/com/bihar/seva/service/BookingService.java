package com.bihar.seva.service;

import com.bihar.seva.dto.BookingRequestDTO;
import com.bihar.seva.model.Booking;
import com.bihar.seva.model.Review;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import com.bihar.seva.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DynamicServiceRepository dynamicServiceRepository;
    private final ReviewRepository reviewRepository;
    
    public Booking createBooking(BookingRequestDTO bookingRequest) {
        // Validate user exists
        userRepository.findById(bookingRequest.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate provider exists
        com.bihar.seva.model.User provider = userRepository.findById(bookingRequest.getProviderId())
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        
        if (!"PROVIDER".equals(provider.getRole())) {
            throw new RuntimeException("User is not a provider");
        }
        
        // Check if provider is verified
        if (!provider.isVerified()) {
            throw new RuntimeException("Provider is not verified");
        }
        
        Booking booking = new Booking();
        booking.setUserId(bookingRequest.getUserId());
        booking.setProviderId(bookingRequest.getProviderId());
        booking.setService(bookingRequest.getService());
        booking.setServiceId(bookingRequest.getServiceId());
        booking.setAddress(bookingRequest.getAddress());
        booking.setCity(bookingRequest.getCity());
        booking.setPincode(bookingRequest.getPincode());
        booking.setLandmark(bookingRequest.getLandmark());
        booking.setScheduledDate(bookingRequest.getScheduledDate());
        booking.setBookingDate(LocalDateTime.now());
        booking.setPrice(bookingRequest.getPrice());
        booking.setSpecialInstructions(bookingRequest.getSpecialInstructions());
        booking.setEmergencyContact(bookingRequest.getEmergencyContact());
        booking.setEmergencyPhone(bookingRequest.getEmergencyPhone());
        
        // Calculate commission (15% of price)
        booking.setCommission(bookingRequest.getPrice() * 0.15);
        booking.setTotalAmount(bookingRequest.getPrice());
        booking.setStatus("PAYMENT_PENDING");
        booking.setPaymentStatus("PENDING");
        
        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} for user: {} with provider: {}", 
            saved.getId(), bookingRequest.getUserId(), bookingRequest.getProviderId());
        return saved;
    }
    
    public Optional<Booking> findById(String id) {
        return bookingRepository.findById(id);
    }
    
    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }
    
    public List<Booking> getBookingsByUserAndStatus(String userId, String status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }
    
    public List<Booking> getBookingsByProvider(String providerId) {
        return bookingRepository.findByProviderId(providerId);
    }
    
    public List<Booking> getBookingsByProviderAndStatus(String providerId, String status) {
        return bookingRepository.findByProviderIdAndStatus(providerId, status);
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public Booking updateBookingStatus(String id, String status) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(status);
        booking.setUpdatedAt(LocalDateTime.now());
        
        if ("COMPLETED".equals(status)) {
            booking.setCompletedDate(LocalDateTime.now());
            
            // Update provider stats
            com.bihar.seva.model.User provider = userRepository.findById(booking.getProviderId()).orElse(null);
            if (provider != null && "PROVIDER".equals(provider.getRole())) {
                provider.setTotalBookings(provider.getTotalBookings() + 1);
                userRepository.save(provider);
            }
            
            // Update service completedJobs count
            if (booking.getServiceId() != null && !booking.getServiceId().isEmpty()) {
                com.bihar.seva.model.DynamicService service = dynamicServiceRepository.findById(booking.getServiceId()).orElse(null);
                if (service != null) {
                    int currentJobs = service.getCompletedJobs() != null ? service.getCompletedJobs() : 0;
                    service.setCompletedJobs(currentJobs + 1);
                    dynamicServiceRepository.save(service);
                    log.info("Updated completedJobs for service: {} to {}", service.getId(), currentJobs + 1);
                }
            }
        }
        
        log.info("Booking {} status updated to: {}", id, status);
        return bookingRepository.save(booking);
    }

    public Booking updateProviderLocation(String id, Double latitude, Double longitude) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setProviderLatitude(latitude);
        booking.setProviderLongitude(longitude);
        booking.setProviderLocationUpdatedAt(LocalDateTime.now());

        if ("CONFIRMED".equals(booking.getStatus())) {
            booking.setStatus("IN_PROGRESS");
        }
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking markArrived(String id) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setArrivedAt(LocalDateTime.now());
        if ("CONFIRMED".equals(booking.getStatus())) {
            booking.setStatus("IN_PROGRESS");
        }
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }
    
    public Booking cancelBooking(String id, String reason, String cancelledBy) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus("CANCELLED");
        booking.setCancellationReason(reason);
        booking.setCancelledBy(cancelledBy);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        
        log.info("Booking {} cancelled by: {}", id, cancelledBy);
        return bookingRepository.save(booking);
    }
    
    public Booking addRating(String id, int customerRating, String customerFeedback) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!"COMPLETED".equals(booking.getStatus())) {
            throw new RuntimeException("Can only rate completed bookings");
        }
        
        booking.setCustomerRating(customerRating);
        booking.setCustomerFeedback(customerFeedback);
        booking.setUpdatedAt(LocalDateTime.now());
        
        // Create or update Review entry for provider rating
        try {
            // Check if review already exists for this booking
            List<Review> existingReviews = reviewRepository.findByBookingId(id);
            Review review;
            
            if (existingReviews.isEmpty()) {
                // Create new review
                review = new Review();
                review.setBookingId(id);
                review.setProviderId(booking.getProviderId());
                review.setCustomerId(booking.getUserId());
                
                // Get customer name from user
                userRepository.findById(booking.getUserId()).ifPresent(user -> {
                    review.setCustomerName(user.getName());
                    review.setCustomerPhoto(user.getProfilePhoto());
                });
                
                review.setRating(customerRating);
                review.setComment(customerFeedback);
                review.setService(booking.getServiceName() != null ? booking.getServiceName() : booking.getService());
                review.setCreatedAt(LocalDateTime.now());
                review.setUpdatedAt(LocalDateTime.now());
                review.setApproved(true); // Auto-approve customer ratings
            } else {
                // Update existing review
                review = existingReviews.get(0);
                review.setRating(customerRating);
                review.setComment(customerFeedback);
                review.setUpdatedAt(LocalDateTime.now());
            }
            
            reviewRepository.save(review);
            
            // Update provider's average rating
            updateProviderRating(booking.getProviderId());
            
            log.info("Rating added to booking: {}, rating: {}, review created/updated", id, customerRating);
        } catch (Exception e) {
            log.error("Error creating review for booking {}: ", id, e);
            // Continue even if review creation fails
        }
        
        return bookingRepository.save(booking);
    }
    
    private void updateProviderRating(String providerId) {
        try {
            List<Review> reviews = reviewRepository.findByProviderIdAndIsApproved(providerId, true);
            
            if (!reviews.isEmpty()) {
                double avgRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
                
                userRepository.findById(providerId).ifPresent(provider -> {
                    if ("PROVIDER".equals(provider.getRole())) {
                        provider.setRating(Math.round(avgRating * 10.0) / 10.0);
                        userRepository.save(provider);
                        log.info("Updated provider {} rating to: {}", providerId, avgRating);
                    }
                });
            }
        } catch (Exception e) {
            log.error("Error updating provider rating for {}: ", providerId, e);
        }
    }
    
    public void deleteBooking(String id, String userId) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Only allow deletion if user is the customer or provider of this booking
        if (!booking.getUserId().equals(userId) && !booking.getProviderId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this booking");
        }
        
        // Only allow deletion of cancelled or completed bookings
        if (!"CANCELLED".equals(booking.getStatus()) && !"COMPLETED".equals(booking.getStatus())) {
            throw new RuntimeException("Can only delete cancelled or completed bookings");
        }
        
        bookingRepository.deleteById(id);
        log.info("Booking {} deleted by user: {}", id, userId);
    }
    
    public Map<String, Object> getProviderStats(String providerId) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Get all bookings for this provider
            List<Booking> allBookings = bookingRepository.findByProviderId(providerId);
            
            // Count bookings by status
            long totalBookings = allBookings.size();
            long pendingBookings = allBookings.stream()
                .filter(b -> "PENDING".equals(b.getStatus()) || "PAYMENT_PENDING".equals(b.getPaymentStatus()))
                .count();
            long completedBookings = allBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .count();
            
            // Calculate earnings
            double totalEarnings = allBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .mapToDouble(b -> b.getTotalAmount() != 0 ? b.getTotalAmount() : b.getPrice())
                .sum();
            
            // Calculate this month earnings
            YearMonth currentMonth = YearMonth.now();
            double thisMonthEarnings = allBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) && 
                    b.getCompletedDate() != null &&
                    YearMonth.from(b.getCompletedDate()).equals(currentMonth))
                .mapToDouble(b -> b.getTotalAmount() != 0 ? b.getTotalAmount() : b.getPrice())
                .sum();
            
            // Get provider rating and reviews
            List<Review> reviews = reviewRepository.findByProviderIdAndIsApproved(providerId, true);
            long totalReviews = reviews.size();
            double averageRating = 0.0;
            
            if (!reviews.isEmpty()) {
                averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
                averageRating = Math.round(averageRating * 10.0) / 10.0;
            } else {
                // Fallback to provider's stored rating
                Optional<User> providerOpt = userRepository.findById(providerId);
                if (providerOpt.isPresent()) {
                    User provider = providerOpt.get();
                    Double storedRating = provider.getRating();
                    if (storedRating != null && storedRating > 0) {
                        averageRating = storedRating;
                    }
                }
            }
            
            stats.put("totalBookings", totalBookings);
            stats.put("pendingBookings", pendingBookings);
            stats.put("completedBookings", completedBookings);
            stats.put("totalEarnings", totalEarnings);
            stats.put("thisMonthEarnings", thisMonthEarnings);
            stats.put("averageRating", averageRating);
            stats.put("totalReviews", totalReviews);
            
        } catch (Exception e) {
            log.error("Error calculating provider stats for {}: ", providerId, e);
            // Return default stats
            stats.put("totalBookings", 0L);
            stats.put("pendingBookings", 0L);
            stats.put("completedBookings", 0L);
            stats.put("totalEarnings", 0.0);
            stats.put("thisMonthEarnings", 0.0);
            stats.put("averageRating", 0.0);
            stats.put("totalReviews", 0L);
        }
        
        return stats;
    }
}
