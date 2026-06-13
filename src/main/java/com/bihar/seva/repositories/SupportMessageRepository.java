package com.bihar.seva.repositories;

import com.bihar.seva.model.SupportMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SupportMessageRepository extends MongoRepository<SupportMessage, String> {
    List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(String ticketId);
    List<SupportMessage> findByTicketIdInOrderByCreatedAtAsc(List<String> ticketIds);
}
