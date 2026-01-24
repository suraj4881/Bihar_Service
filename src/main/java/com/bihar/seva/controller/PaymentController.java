package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Payment;
import com.bihar.seva.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for Payment operations
 */
@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {
    
    private final PaymentService paymentService;
    
    /**
     * Calculate payment amount (with commission)
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Payment>> calculatePayment(
            @RequestBody Map<String, Object> request) {
        try {
            String serviceId = request.get("serviceId").toString();
            Double basePrice = Double.parseDouble(request.get("basePrice").toString());
            
            Payment payment = paymentService.calculatePayment(serviceId, basePrice);
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment calculated"));
        } catch (Exception e) {
            log.error("Error calculating payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate payment: " + e.getMessage()));
        }
    }
    
    /**
     * Process payment
     */
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<Payment>> processPayment(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String bookingId = request.get("bookingId").toString();
            String paymentMethod = request.get("paymentMethod").toString();
            String transactionId = request.getOrDefault("transactionId", "").toString();
            
            Payment payment = paymentService.processPayment(bookingId, paymentMethod, transactionId);
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment processed"));
        } catch (Exception e) {
            log.error("Error processing payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to process payment: " + e.getMessage()));
        }
    }
    
    /**
     * Get payment by booking
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<Payment>> getPaymentByBooking(@PathVariable String bookingId) {
        try {
            Payment payment = paymentService.getPaymentByBooking(bookingId);
            if (payment == null) {
                return ResponseEntity.ok(ApiResponse.error("Payment not found"));
            }
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment retrieved"));
        } catch (Exception e) {
            log.error("Error getting payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get payment: " + e.getMessage()));
        }
    }
    
    /**
     * Get customer payments
     */
    @GetMapping("/my-payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getMyPayments(Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<Payment> payments = paymentService.getPaymentsByCustomer(userId);
            return ResponseEntity.ok(ApiResponse.success(payments, "Payments retrieved"));
        } catch (Exception e) {
            log.error("Error getting payments: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get payments: " + e.getMessage()));
        }
    }
    
    /**
     * Refund payment
     */
    @PostMapping("/refund/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> refundPayment(
            @PathVariable String paymentId,
            @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "Customer request");
            Payment payment = paymentService.refundPayment(paymentId, reason);
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment refunded"));
        } catch (Exception e) {
            log.error("Error refunding payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to refund payment: " + e.getMessage()));
        }
    }
}
