package com.bihar.seva.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.bihar.seva.model.Customer;
import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByVerificationCode(String verificationCode);
    long countByIsActive(boolean isActive);
    long countByIsVerified(boolean isVerified);
}

