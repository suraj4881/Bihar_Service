package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Notification;
import com.bihar.seva.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    
    // Get user notifications
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getUserNotifications(@PathVariable String userId) {
        try {
            List<Notification> notifications = notificationService.getUserNotifications(userId);
            return ResponseEntity.ok(new ApiResponse(true, "Notifications retrieved", notifications));
        } catch (Exception e) {
            log.error("Error fetching notifications: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get unread notifications
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<ApiResponse> getUnreadNotifications(@PathVariable String userId) {
        try {
            List<Notification> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(new ApiResponse(true, "Unread notifications retrieved", notifications));
        } catch (Exception e) {
            log.error("Error fetching unread notifications: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Get unread count
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<ApiResponse> getUnreadCount(@PathVariable String userId) {
        try {
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(new ApiResponse(true, "Unread count retrieved", count));
        } catch (Exception e) {
            log.error("Error fetching unread count: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Mark notification as read
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable String notificationId) {
        try {
            Notification notification = notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read", notification));
        } catch (Exception e) {
            log.error("Error marking notification as read: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Mark all as read
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(@PathVariable String userId) {
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read", null));
        } catch (Exception e) {
            log.error("Error marking all as read: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Delete notification
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable String notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(new ApiResponse(true, "Notification deleted", null));
        } catch (Exception e) {
            log.error("Error deleting notification: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
    
    // Create notification (admin/system use)
    @PostMapping
    public ResponseEntity<ApiResponse> createNotification(@RequestBody Notification notification) {
        try {
            Notification created = notificationService.createNotification(notification);
            return ResponseEntity.ok(new ApiResponse(true, "Notification created", created));
        } catch (Exception e) {
            log.error("Error creating notification: ", e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}

