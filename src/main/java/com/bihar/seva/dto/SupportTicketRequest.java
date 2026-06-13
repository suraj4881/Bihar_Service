package com.bihar.seva.dto;

import lombok.Data;

@Data
public class SupportTicketRequest {
    private String userId;
    private String userRole;
    private String userName;
    private String userPhone;
    private String bookingId;
    private String serviceId;
    private String category;
    private String subject;
    private String description;
    private String priority;
}
