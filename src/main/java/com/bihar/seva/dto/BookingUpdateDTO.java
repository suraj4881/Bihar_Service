package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Data
public class BookingUpdateDTO {
    @NotBlank(message = "Status is required")
    private String status;
    
    private LocalDateTime scheduledDate;
    private String specialInstructions;
}
