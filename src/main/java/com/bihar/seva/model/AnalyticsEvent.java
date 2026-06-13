package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "analytics_events")
public class AnalyticsEvent {
    @Id
    private String id;
    private String eventType;
    private String page;
    private String target;
    private String userId;
    private String userRole;
    private String ipAddress;
    private String userAgent;
    private String deviceType;
    private String os;
    private String browser;
    private LocalDateTime createdAt;
}
