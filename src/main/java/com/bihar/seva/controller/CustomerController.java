package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.User;
import com.bihar.seva.service.UserService;
import com.bihar.seva.service.BookingService;
import com.bihar.seva.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {
    
    private final UserService userService;
    private final BookingService bookingService;
    private final NotificationService notificationService;
    
    // Customer Dashboard
    @GetMapping("/{userId}/dashboard")
    public ResponseEntity<ApiResponse> getCustomerDashboard(@PathVariable String userId) {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            // Get user info
            User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Get bookings count
            long totalBookings = bookingService.getBookingsByUser(userId).size();
            long upcomingBookings = bookingService.getBookingsByUserAndStatus(userId, "CONFIRMED").size();
            long completedBookings = bookingService.getBookingsByUserAndStatus(userId, "COMPLETED").size();
            
            // Get unread notifications count
            long unreadNotifications = notificationService.getUnreadCount(userId);
            
            dashboard.put("user", user);
            dashboard.put("totalBookings", totalBookings);
            dashboard.put("upcomingBookings", upcomingBookings);
            dashboard.put("completedBookings", completedBookings);
            dashboard.put("unreadNotifications", unreadNotifications);
            
            return ResponseEntity.ok(new ApiResponse(true, "Dashboard retrieved", dashboard));
        } catch (Exception e) {
            log.error("Error fetching customer dashboard: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}

