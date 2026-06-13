package com.bihar.seva.dto;

import lombok.Data;

@Data
public class AnalyticsEventRequest {
    private String eventType;
    private String page;
    private String target;
    private String userId;
    private String userRole;
}
