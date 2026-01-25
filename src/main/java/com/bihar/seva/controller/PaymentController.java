package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.Payment;
import com.bihar.seva.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;
    
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

    /**
     * Razorpay webhook endpoint
     */
    @PostMapping("/razorpay/webhook")
    public ResponseEntity<ApiResponse<String>> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        try {
            boolean verified = paymentService.verifyRazorpayWebhook(payload, signature);
            if (!verified) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid Razorpay webhook signature"));
            }
            log.info("Razorpay webhook received: {}", payload);
            return ResponseEntity.ok(ApiResponse.success("OK", "Webhook processed"));
        } catch (Exception e) {
            log.error("Error handling Razorpay webhook: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to process webhook: " + e.getMessage()));
        }
    }

    /**
     * Create Razorpay order for a booking
     */
    @PostMapping("/razorpay/order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createRazorpayOrder(
            @RequestBody Map<String, String> request) {
        try {
            String bookingId = request.get("bookingId");
            if (bookingId == null || bookingId.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("bookingId is required"));
            }
            Map<String, Object> order = paymentService.createRazorpayOrder(bookingId);
            return ResponseEntity.ok(ApiResponse.success(order, "Razorpay order created"));
        } catch (Exception e) {
            log.error("Error creating Razorpay order: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to create order: " + e.getMessage()));
        }
    }

    /**
     * Razorpay key for frontend
     */
    @GetMapping("/razorpay/key")
    public ResponseEntity<ApiResponse<Map<String, String>>> getRazorpayKey() {
        return ResponseEntity.ok(ApiResponse.success(
            Map.of("keyId", razorpayKeyId),
            "Razorpay key retrieved"
        ));
    }

    /**
     * Razorpay payment verification
     */
    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<Payment>> verifyRazorpayPayment(
            @RequestBody Map<String, String> request) {
        try {
            String bookingId = request.get("bookingId");
            String orderId = request.get("orderId");
            String paymentId = request.get("paymentId");
            String signature = request.get("signature");
            String paymentMethod = request.getOrDefault("paymentMethod", "RAZORPAY");

            if (bookingId == null || bookingId.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("bookingId is required"));
            }

            boolean verified = paymentService.verifyRazorpayPaymentSignature(orderId, paymentId, signature);
            if (!verified) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid Razorpay payment signature"));
            }

            Payment payment = paymentService.processPayment(bookingId, paymentMethod, paymentId);
            return ResponseEntity.ok(ApiResponse.success(payment, "Payment verified and processed"));
        } catch (Exception e) {
            log.error("Error verifying Razorpay payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to verify payment: " + e.getMessage()));
        }
    }

    /**
     * Razorpay callback/return endpoint
     */
    @GetMapping("/razorpay/callback")
    public ResponseEntity<ApiResponse<Map<String, String>>> handleRazorpayCallback(
            @RequestParam Map<String, String> params) {
        try {
            log.info("Razorpay callback received: {}", params);
            return ResponseEntity.ok(ApiResponse.success(params, "Callback received"));
        } catch (Exception e) {
            log.error("Error handling Razorpay callback: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to process callback: " + e.getMessage()));
        }
    }
}
