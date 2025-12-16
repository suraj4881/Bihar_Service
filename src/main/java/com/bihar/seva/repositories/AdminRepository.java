package com.bihar.seva.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.bihar.seva.model.Admin;
import java.util.Optional;

public interface AdminRepository extends MongoRepository<Admin, String> {
    Optional<Admin> findByEmail(String email);
    long countByIsActive(boolean isActive);
}

