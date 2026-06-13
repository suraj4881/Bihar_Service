package com.bihar.seva.dto;

import lombok.Data;

@Data
public class SupportTicketStatusUpdateRequest {
    private String status;
    private String resolutionNote;
}
