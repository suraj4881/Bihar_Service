package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.BookingRequestDTO;
import com.bihar.seva.model.Booking;
import com.bihar.seva.service.BookingService;
import com.bihar.seva.service.NotificationService;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            
            // Send notification to provider
            notificationService.createNotification(
                booking.getProviderId(),
                "New Booking Request",
                "You have a new booking request for " + booking.getService(),
                "BOOKING"
            );
            
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
    public ResponseEntity<ApiResponse> getBookingById(@PathVariable String id) {
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
            
            String customerName = booking.getEmergencyContact();
            if (customerName == null || customerName.isEmpty()) {
                userRepository.findById(booking.getUserId()).ifPresent(user -> map.put("customerName", user.getName()));
            } else {
                map.put("customerName", customerName);
            }
            map.put("customerPhone", booking.getEmergencyPhone());
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
            return ResponseEntity.ok(new ApiResponse(true, "User bookings retrieved", bookings));
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
                map.put("totalAmount", booking.getTotalAmount());
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
            Booking booking = bookingService.updateBookingStatus(id, "CONFIRMED");
            
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
    
    // Mark booking as completed
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse> completeBooking(@PathVariable String id) {
        try {
            Booking booking = bookingService.updateBookingStatus(id, "COMPLETED");
            
            // Create earnings record
            // Commission is now handled via PaymentService
            
            // Notify customer
            notificationService.createNotification(
                booking.getUserId(),
                "Service Completed",
                "Please rate your experience",
                "BOOKING"
            );
            
            return ResponseEntity.ok(new ApiResponse(true, "Booking completed", booking));
        } catch (Exception e) {
            log.error("Error completing booking: ", e);
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
