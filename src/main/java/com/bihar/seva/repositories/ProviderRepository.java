package com.bihar.seva.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.bihar.seva.model.Provider;
import java.util.List;
import java.util.Optional;

public interface ProviderRepository extends MongoRepository<Provider, String> {
    List<Provider> findByCity(String city);
    List<Provider> findBySkillContainingIgnoreCase(String skill);
    List<Provider> findByIsVerifiedTrue();
    Optional<Provider> findByEmail(String email);
    Optional<Provider> findByPhone(String phone);
    Optional<Provider> findByVerificationCode(String verificationCode);
    long countByIsActive(boolean isActive);
    long countByIsVerified(boolean isVerified);
    long countByKycStatus(String kycStatus);
    List<Provider> findByIsActive(boolean isActive);
}