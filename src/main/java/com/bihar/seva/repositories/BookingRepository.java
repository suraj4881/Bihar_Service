package com.bihar.seva.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.bihar.seva.model.Booking;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserId(String userId);
    List<Booking> findByProviderId(String providerId);
    List<Booking> findByStatus(String status);
    List<Booking> findByUserIdAndStatus(String userId, String status);
    List<Booking> findByProviderIdAndStatus(String providerId, String status);
    long countByStatus(String status);
    long countByCreatedAtAfter(LocalDateTime date);
    long countByProviderIdAndStatus(String providerId, String status);
    
    // Count today's bookings
    default long countTodayBookings() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return countByCreatedAtAfter(startOfDay);
    }
}