package com.bihar.seva.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.bihar.seva.model.User;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByVerificationCode(String verificationCode);
    long countByIsActive(boolean isActive);
    long countByIsVerified(boolean isVerified);
}