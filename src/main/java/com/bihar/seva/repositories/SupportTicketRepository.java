package com.bihar.seva.repositories;

import com.bihar.seva.model.SupportTicket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(String status);
}
