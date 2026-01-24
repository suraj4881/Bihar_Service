package com.bihar.seva.repositories;

import com.bihar.seva.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    
    List<Payment> findByCustomerId(String customerId);
    
    List<Payment> findByProviderId(String providerId);
    
    List<Payment> findByBookingId(String bookingId);
    
    List<Payment> findByPaymentStatus(String status);
    
    List<Payment> findByProviderIdAndPaymentStatus(String providerId, String status);
}
