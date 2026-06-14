package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.BookingRequestDTO;
import com.bihar.seva.dto.BookingTrackingUpdateRequest;
import com.bihar.seva.model.Booking;
import com.bihar.seva.service.BookingService;
import com.bihar.seva.service.NotificationService;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class BookingController {
    
    private final BookingService bookingService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    
    // Create booking
    @PostMapping
    public ResponseEntity<ApiResponse> createBooking(@Valid @RequestBody BookingRequestDTO bookingRequest) {
        try {
            Booking booking = bookingService.createBooking(bookingRequest);
            
            return ResponseEntity.ok(new ApiResponse(true, "Booking created successfully", booking));
        } catch (Exception e) {
            log.error("Error creating booking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get all bookings
    @GetMapping
    public ResponseEntity<ApiResponse> getAllBookings() {
        try {
            List<Booking> bookings = bookingService.getAllBookings();
            return ResponseEntity.ok(new ApiResponse(true, "Bookings retrieved", bookings));
        } catch (Exception e) {
            log.error("Error fetching bookings: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get booking by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBookingById(
            @PathVariable String id,
            @RequestParam(required = false) String customerUserId) {
        try {
            Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", booking.getId());
            map.put("userId", booking.getUserId());
            map.put("providerId", booking.getProviderId());
            map.put("serviceId", booking.getServiceId());
            map.put("service", booking.getService());
            map.put("serviceName", booking.getServiceName());
            map.put("serviceCategory", booking.getServiceCategory());
            map.put("address", booking.getAddress());
            map.put("city", booking.getCity());
            map.put("pincode", booking.getPincode());
            map.put("scheduledDate", booking.getScheduledDate());
            map.put("bookingDate", booking.getBookingDate());
            map.put("status", booking.getStatus());
            map.put("price", booking.getPrice());
            map.put("totalAmount", booking.getTotalAmount());
            map.put("paymentStatus", booking.getPaymentStatus());
            map.put("specialInstructions", booking.getSpecialInstructions());
            map.put("emergencyContact", booking.getEmergencyContact());
            map.put("emergencyPhone", booking.getEmergencyPhone());
            map.put("providerLatitude", booking.getProviderLatitude());
            map.put("providerLongitude", booking.getProviderLongitude());
            map.put("providerLocationUpdatedAt", booking.getProviderLocationUpdatedAt());
            map.put("arrivedAt", booking.getArrivedAt());
            
            String customerName = booking.getEmergencyContact();
            if (customerName == null || customerName.isEmpty()) {
                userRepository.findById(booking.getUserId()).ifPresent(user -> map.put("customerName", user.getName()));
            } else {
                map.put("customerName", customerName);
            }
            map.put("customerPhone", booking.getEmergencyPhone());
            userRepository.findById(booking.getProviderId()).ifPresent(user -> {
                map.put("providerName", user.getName());
                map.put("providerPhone", user.getPhone());
            });
            if (customerUserId != null && customerUserId.equals(booking.getUserId())) {
                map.put("serviceCompletionPin", booking.getServiceCompletionPin());
                map.put("completionOtpSentAt", booking.getCompletionOtpSentAt());
            }
            return ResponseEntity.ok(new ApiResponse(true, "Booking retrieved", map));
        } catch (Exception e) {
            log.error("Error fetching booking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get user bookings
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getBookingsByUser(
            @PathVariable String userId,
            @RequestParam(required = false) String status) {
        try {
            List<Booking> bookings;
            if (status != null) {
                bookings = bookingService.getBookingsByUserAndStatus(userId, status);
            } else {
                bookings = bookingService.getBookingsByUser(userId);
            }
            List<java.util.Map<String, Object>> enriched = new java.util.ArrayList<>();
            for (Booking booking : bookings) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", booking.getId());
                map.put("userId", booking.getUserId());
                map.put("providerId", booking.getProviderId());
                map.put("serviceId", booking.getServiceId());
                map.put("service", booking.getService());
                map.put("serviceName", booking.getServiceName());
                map.put("serviceCategory", booking.getServiceCategory());
                map.put("address", booking.getAddress());
                map.put("city", booking.getCity());
                map.put("pincode", booking.getPincode());
                map.put("scheduledDate", booking.getScheduledDate());
                map.put("bookingDate", booking.getBookingDate());
                map.put("status", booking.getStatus());
                map.put("price", booking.getPrice());
                map.put("totalAmount", booking.getTotalAmount());
                map.put("paymentStatus", booking.getPaymentStatus());
                map.put("specialInstructions", booking.getSpecialInstructions());
                map.put("emergencyContact", booking.getEmergencyContact());
                map.put("emergencyPhone", booking.getEmergencyPhone());
                map.put("providerLatitude", booking.getProviderLatitude());
                map.put("providerLongitude", booking.getProviderLongitude());
                map.put("providerLocationUpdatedAt", booking.getProviderLocationUpdatedAt());
                map.put("arrivedAt", booking.getArrivedAt());
                map.put("serviceCompletionPin", booking.getServiceCompletionPin());
                map.put("completionOtpSentAt", booking.getCompletionOtpSentAt());
                
                userRepository.findById(booking.getProviderId()).ifPresent(user -> {
                    map.put("providerName", user.getName());
                    map.put("providerPhone", user.getPhone());
                });
                enriched.add(map);
            }
            return ResponseEntity.ok(new ApiResponse(true, "User bookings retrieved", enriched));
        } catch (Exception e) {
            log.error("Error fetching user bookings: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get provider bookings
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse> getBookingsByProvider(
            @PathVariable String providerId,
            @RequestParam(required = false) String status) {
        try {
            List<Booking> bookings;
            if (status != null) {
                bookings = bookingService.getBookingsByProviderAndStatus(providerId, status);
            } else {
                bookings = bookingService.getBookingsByProvider(providerId);
            }
            List<java.util.Map<String, Object>> enriched = new java.util.ArrayList<>();
            for (Booking booking : bookings) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", booking.getId());
                map.put("userId", booking.getUserId());
                map.put("providerId", booking.getProviderId());
                map.put("serviceId", booking.getServiceId());
                map.put("service", booking.getService());
                map.put("serviceName", booking.getServiceName());
                map.put("serviceCategory", booking.getServiceCategory());
                map.put("address", booking.getAddress());
                map.put("city", booking.getCity());
                map.put("pincode", booking.getPincode());
                map.put("scheduledDate", booking.getScheduledDate());
                map.put("bookingDate", booking.getBookingDate());
                map.put("status", booking.getStatus());
                map.put("price", booking.getPrice());
                map.put("totalPrice", booking.getTotalPrice());
                map.put("totalAmount", booking.getTotalAmount());
                map.put("commission", booking.getCommission());
                map.put("completedDate", booking.getCompletedDate());
                map.put("customerRating", booking.getCustomerRating());
                map.put("customerFeedback", booking.getCustomerFeedback());
                map.put("paymentStatus", booking.getPaymentStatus());
                map.put("specialInstructions", booking.getSpecialInstructions());
                map.put("emergencyContact", booking.getEmergencyContact());
                map.put("emergencyPhone", booking.getEmergencyPhone());
                
                String customerName = booking.getEmergencyContact();
                String customerPhone = booking.getEmergencyPhone();
                if (customerName == null || customerName.isEmpty()) {
                    userRepository.findById(booking.getUserId()).ifPresent(user -> map.put("customerName", user.getName()));
                } else {
                    map.put("customerName", customerName);
                }
                if (customerPhone != null && !customerPhone.isEmpty()) {
                    map.put("customerPhone", customerPhone);
                }
                enriched.add(map);
            }
            return ResponseEntity.ok(new ApiResponse(true, "Provider bookings retrieved", enriched));
        } catch (Exception e) {
            log.error("Error fetching provider bookings: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Provider accepts booking
    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse> acceptBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
            if (!"PAID".equals(booking.getPaymentStatus())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Payment not verified yet", null));
            }
            booking = bookingService.updateBookingStatus(id, "CONFIRMED");
            
            // Notify customer
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Confirmed",
                "Your booking has been confirmed by the provider",
                "BOOKING"
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Booking accepted", booking));
        } catch (Exception e) {
            log.error("Error accepting booking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Provider rejects booking
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectBooking(
            @PathVariable String id,
            @RequestParam String reason) {
        try {
            Booking booking = bookingService.cancelBooking(id, reason, "PROVIDER");
            
            // Notify customer
            notificationService.createNotification(
                booking.getUserId(),
                "Booking Rejected",
                "Your booking has been rejected: " + reason,
                "BOOKING"
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Booking rejected", booking));
        } catch (Exception e) {
            log.error("Error rejecting booking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Mark booking as completed (legacy - use completion OTP + photos flow)
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse> completeBooking(@PathVariable String id) {
        return ResponseEntity.badRequest()
            .body(new ApiResponse(false,
                "Completion requires the booking completion PIN, photos, and PAID status. Use POST /api/bookings/{id}/complete-verification.",
                null));
    }

    /** Provider: submit photos + same 4-digit PIN created at booking; completes if payment is PAID. */
    @PostMapping(value = "/{id}/complete-verification", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> completeWithVerification(
            @PathVariable String id,
            @RequestParam String providerId,
            @RequestParam String otp,
            @RequestParam("files") MultipartFile[] files) {
        try {
            java.util.List<MultipartFile> list = files != null ? java.util.Arrays.asList(files) : java.util.Collections.emptyList();
            Booking booking = bookingService.completeWithVerification(id, providerId, otp, list);
            notificationService.createNotification(
                booking.getUserId(),
                "Service Completed",
                "Please rate your experience",
                "BOOKING"
            );
            return ResponseEntity.ok(new ApiResponse(true, "Booking completed", booking));
        } catch (Exception e) {
            log.error("Error completing booking with verification: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    /** Provider: generate a new 4-digit completion code; customer sees it on their dashboard. */
    @PostMapping("/{id}/completion-otp/send")
    public ResponseEntity<ApiResponse> sendCompletionOtp(
            @PathVariable String id,
            @RequestParam String providerId,
            @RequestParam(required = false) String customerUserId,
            @RequestParam(required = false) String serviceId) {
        try {
            Booking booking = bookingService.sendCompletionOtpToCustomer(id, providerId, customerUserId, serviceId);
            notificationService.createNotification(
                booking.getUserId(),
                "Completion code updated",
                "Your provider sent a new 4-digit code - check your dashboard and share it when asked.",
                "BOOKING"
            );
            return ResponseEntity.ok(new ApiResponse(true, "New completion code is visible on the customer dashboard", null));
        } catch (Exception e) {
            log.error("Error sending completion OTP: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Customer cancels booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancelBooking(
            @PathVariable String id,
            @RequestParam String reason) {
        try {
            Booking booking = bookingService.cancelBooking(id, reason, "USER");
            
            // Notify provider
            notificationService.createNotification(
                booking.getProviderId(),
                "Booking Cancelled",
                "Customer has cancelled the booking",
                "BOOKING"
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Booking cancelled", booking));
        } catch (Exception e) {
            log.error("Error cancelling booking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<ApiResponse> getTracking(@PathVariable String id) {
        try {
            Booking booking = bookingService.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("providerLatitude", booking.getProviderLatitude());
            map.put("providerLongitude", booking.getProviderLongitude());
            map.put("providerLocationUpdatedAt", booking.getProviderLocationUpdatedAt());
            map.put("arrivedAt", booking.getArrivedAt());
            map.put("status", booking.getStatus());
            return ResponseEntity.ok(new ApiResponse(true, "Tracking retrieved", map));
        } catch (Exception e) {
            log.error("Error fetching tracking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/tracking")
    public ResponseEntity<ApiResponse> updateTracking(
            @PathVariable String id,
            @RequestBody BookingTrackingUpdateRequest request) {
        try {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Latitude and longitude are required", null));
            }
            Booking booking = bookingService.updateProviderLocation(id, request.getLatitude(), request.getLongitude());
            notificationService.createNotification(
                booking.getUserId(),
                "Provider is on the way",
                "Your provider shared live location",
                "BOOKING"
            );
            return ResponseEntity.ok(new ApiResponse(true, "Tracking updated", booking));
        } catch (Exception e) {
            log.error("Error updating tracking: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/arrive")
    public ResponseEntity<ApiResponse> markArrived(@PathVariable String id) {
        try {
            Booking booking = bookingService.markArrived(id);
            notificationService.createNotification(
                booking.getUserId(),
                "Provider Arrived",
                "Your provider has arrived at the location",
                "BOOKING"
            );
            return ResponseEntity.ok(new ApiResponse(true, "Provider marked arrived", booking));
        } catch (Exception e) {
            log.error("Error marking arrived: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Update booking status
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateBookingStatus(
            @PathVariable String id,
            @RequestParam String status) {
        try {
            Booking booking = bookingService.updateBookingStatus(id, status);
            return ResponseEntity.ok(new ApiResponse(true, "Status updated", booking));
        } catch (Exception e) {
            log.error("Error updating booking status: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Add rating and review
    @PutMapping("/{id}/rating")
    public ResponseEntity<ApiResponse> addRating(
            @PathVariable String id,
            @RequestParam int rating,
            @RequestParam String feedback) {
        try {
            Booking booking = bookingService.addRating(id, rating, feedback);
            return ResponseEntity.ok(new ApiResponse(true, "Rating added", booking));
        } catch (Exception e) {
            log.error("Error adding rating: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}
