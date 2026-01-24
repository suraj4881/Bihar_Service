package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Booking;
import com.bihar.seva.service.BookingService;
import com.bihar.seva.service.CallProxyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class CallProxyController {

    private static final List<String> ALLOWED_STATUSES = Arrays.asList("CONFIRMED", "IN_PROGRESS", "COMPLETED");

    private final BookingService bookingService;
    private final CallProxyService callProxyService;

    @PostMapping("/masked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestMaskedCall(@RequestBody Map<String, String> request) {
        try {
            String bookingId = request.get("bookingId");
            if (bookingId == null || bookingId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Booking ID is required"));
            }

            Booking booking = bookingService.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!ALLOWED_STATUSES.contains(booking.getStatus())) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Call available only after booking confirmation"));
            }

            Map<String, Object> payload = callProxyService.initiateMaskedCall(booking);
            return ResponseEntity.ok(ApiResponse.success(payload, "Call initiated"));
        } catch (Exception e) {
            log.error("Error initiating masked call: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to initiate call: " + e.getMessage()));
        }
    }
}
