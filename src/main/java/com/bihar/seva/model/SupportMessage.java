
package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "support_messages")
public class SupportMessage {
    @Id
    private String id;
    private String ticketId;
    private String senderRole;
    private String senderName;
    private String message;
    private LocalDateTime createdAt;
}
