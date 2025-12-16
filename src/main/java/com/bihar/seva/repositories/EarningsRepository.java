package com.bihar.seva.repositories;

import com.bihar.seva.model.Earnings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EarningsRepository extends MongoRepository<Earnings, String> {
    List<Earnings> findByProviderId(String providerId);
    List<Earnings> findByProviderIdAndStatus(String providerId, String status);
    List<Earnings> findByBookingId(String bookingId);
    List<Earnings> findByProviderIdAndEarnedAtBetween(String providerId, LocalDateTime start, LocalDateTime end);
    long countByProviderIdAndStatus(String providerId, String status);
}

