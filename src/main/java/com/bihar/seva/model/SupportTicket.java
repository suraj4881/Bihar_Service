package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.annotation.Transient;

@Data
@Document(collection = "support_tickets")
public class SupportTicket {
    @Id
    private String id;

    private String userId;
    private String userRole;
    private String userName;
    private String userPhone;

    private String bookingId;
    private String serviceId;

    private String category; // BOOKING, SERVICE, PAYMENT, ACCOUNT, OTHER
    private String subject;
    private String description;

    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT

    private String assignedTo;
    private String resolutionNote;
    
    private List<String> attachments;
    @Transient
    private List<SupportMessage> messages;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
