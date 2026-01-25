package com.bihar.seva.dto;

import lombok.Data;

@Data
public class SupportMessageRequest {
    private String senderRole;
    private String senderName;
    private String message;
}
