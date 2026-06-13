package com.bihar.seva.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "bookings")
@Data
public class Booking {
    @Id 
    private String id;
    
    @NotBlank(message = "User ID is required")
    @Indexed
    private String userId;
    
    @NotBlank(message = "Provider ID is required")
    @Indexed
    private String providerId;
    
    @NotBlank(message = "Service ID is required")
    @Indexed
    private String serviceId; // Reference to DynamicService ID
    
    private String service; // Legacy field - kept for backward compatibility
    private String serviceName; // Display name for the service
    private String serviceCategory; // Category like "Plumbing", "Electrical"
    
    @NotBlank(message = "Address is required")
    private String address;
    
    private String city;
    private String state = "Bihar";
    private String pincode;
    private String landmark;
    
    @NotNull(message = "Booking date is required")
    private LocalDateTime bookingDate;
    
    private LocalDateTime scheduledDate;
    private LocalDateTime completedDate;
    
    private String status = "PENDING"; // PENDING, PAYMENT_PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    
    @NotNull(message = "Price is required")
    private double price;
    
    private double totalPrice; // Total price for the service
    private double commission;
    private double totalAmount;
    private String paymentStatus = "PENDING"; // PENDING, PAID, REFUNDED
    private String paymentMethod;
    private String transactionId;
    
    private String specialInstructions;
    private String customerNotes;
    private String providerNotes;
    
    // Live tracking (provider -> customer)
    private Double providerLatitude;
    private Double providerLongitude;
    private LocalDateTime providerLocationUpdatedAt;
    private LocalDateTime arrivedAt;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Rating and feedback
    private int customerRating;
    private String customerFeedback;
    private int providerRating;
    private String providerFeedback;
    
    // Emergency contact
    private String emergencyContact;
    private String emergencyPhone;
    
    // Cancellation details
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    private String cancelledBy; // USER, PROVIDER, ADMIN
    
    // Rescheduling
    private List<LocalDateTime> rescheduleRequests;
    private String rescheduleReason;

    /** Proof photos after service (paths relative to upload root), set on verified completion */
    private List<String> completionPhotoPaths;

    /**
     * 4-digit PIN for end-of-service verification. Set at booking creation and regenerated when the
     * provider requests a new code; must match for verified completion.
     */
    private String serviceCompletionPin;

    /** When the provider last tapped “Send OTP”; customer UI can highlight the current code. */
    private LocalDateTime completionOtpSentAt;
}