package com.bihar.seva.service;

import com.bihar.seva.model.Payment;
import com.bihar.seva.model.DynamicService;
import com.bihar.seva.model.Booking;
import com.bihar.seva.repositories.PaymentRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Payment Service - Handles payments with 10% commission
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final DynamicServiceRepository serviceRepository;
    private final BookingRepository bookingRepository;
    private final WalletService walletService;
    private final EmailService emailService;
    private final SMSService smsService;
    private final WhatsAppService whatsAppService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${razorpay.webhook.secret:}")
    private String razorpayWebhookSecret;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Value("${notifications.payment.email.enabled:true}")
    private boolean paymentEmailEnabled;

    @Value("${notifications.payment.sms.enabled:true}")
    private boolean paymentSmsEnabled;

    @Value("${notifications.payment.whatsapp.enabled:true}")
    private boolean paymentWhatsappEnabled;
    
    private static final Double COMMISSION_RATE = 10.0; // 10% commission
    
    /**
     * Process payment for a booking
     */
    @Transactional
    public Payment processPayment(String bookingId, String paymentMethod, String transactionId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new RuntimeException("Payment already completed");
        }
        
        // Get service by serviceId (preferred) or fallback to service name
        DynamicService service;
        if (booking.getServiceId() != null && !booking.getServiceId().isEmpty()) {
            service = serviceRepository.findById(booking.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found: " + booking.getServiceId()));
        } else if (booking.getService() != null && !booking.getService().isEmpty()) {
            // Fallback to service name (legacy)
            service = serviceRepository.findByServiceNameIgnoreCase(booking.getService())
                .orElseThrow(() -> new RuntimeException("Service not found: " + booking.getService()));
        } else {
            throw new RuntimeException("Service ID or name is required");
        }
        
        // Calculate amounts
        Double basePrice = service.getBasePrice() != null ? service.getBasePrice() : service.getPrice();
        if (basePrice == null) {
            throw new RuntimeException("Service price not set");
        }
        
        Double commissionAmount = basePrice * (COMMISSION_RATE / 100);
        Double totalAmount = basePrice + commissionAmount;
        
        // Create payment record
        Payment payment = new Payment();
        payment.setBookingId(bookingId);
        payment.setCustomerId(booking.getUserId()); // Booking uses userId for customer
        payment.setProviderId(service.getProviderId());
        payment.setServiceId(service.getId());
        payment.setTotalAmount(totalAmount);
        payment.setBasePrice(basePrice);
        payment.setCommissionAmount(commissionAmount);
        payment.setCommissionRate(COMMISSION_RATE);
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus("PROCESSING");
        payment.setTransactionId(transactionId);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());
        
        // Process payment based on method
        if ("WALLET".equals(paymentMethod)) {
            // Deduct from customer wallet
            try {
                walletService.deductBalance(
                    booking.getUserId(), // Booking uses userId for customer
                    totalAmount,
                    "Payment for booking: " + bookingId,
                    "PAYMENT"
                );
                
                // Add to provider wallet (basePrice only, commission goes to platform)
                walletService.addBalance(
                    service.getProviderId(),
                    basePrice,
                    "Payment for service: " + service.getServiceName(),
                    "PAYOUT"
                );
                
                payment.setPaymentStatus("SUCCESS");
                payment.setCommissionDeducted(true);
                payment.setCommissionDeductedAt(LocalDateTime.now());
                payment.setProviderPayoutDone(true);
                payment.setProviderPayoutAt(LocalDateTime.now());
                payment.setProviderPayoutAmount(basePrice);
                booking.setPaymentStatus("PAID");
                booking.setStatus("CONFIRMED");
                booking.setPaymentMethod(paymentMethod);
                booking.setTransactionId(transactionId);
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
                notificationService.createNotification(
                    booking.getProviderId(),
                    "New Booking Confirmed",
                    "Payment received for booking " + bookingId,
                    "BOOKING"
                );
                notificationService.createNotification(
                    booking.getUserId(),
                    "Payment Successful",
                    "Your payment is successful for booking " + bookingId,
                    "PAYMENT"
                );
                sendPaymentChannelNotifications(booking, payment);
            } catch (Exception e) {
                log.error("Payment processing failed: {}", e.getMessage());
                payment.setPaymentStatus("FAILED");
            }
        } else if ("RAZORPAY".equalsIgnoreCase(paymentMethod)) {
            Double payoutAmount = basePrice;
            if (payoutAmount != null) {
                walletService.addBalance(
                    service.getProviderId(),
                    payoutAmount,
                    "Payment for service: " + service.getServiceName(),
                    "PAYOUT"
                );
            }
            payment.setPaymentStatus("SUCCESS");
            payment.setCommissionDeducted(true);
            payment.setCommissionDeductedAt(LocalDateTime.now());
            payment.setProviderPayoutDone(true);
            payment.setProviderPayoutAt(LocalDateTime.now());
            payment.setProviderPayoutAmount(payoutAmount);
            booking.setPaymentStatus("PAID");
            booking.setStatus("CONFIRMED");
            booking.setPaymentMethod(paymentMethod);
            booking.setTransactionId(transactionId);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            notificationService.createNotification(
                booking.getProviderId(),
                "New Booking Confirmed",
                "Payment received for booking " + bookingId,
                "BOOKING"
            );
            notificationService.createNotification(
                booking.getUserId(),
                "Payment Successful",
                "Your payment is successful for booking " + bookingId,
                "PAYMENT"
            );
            sendPaymentChannelNotifications(booking, payment);
        } else {
            if (transactionId == null || transactionId.isBlank()) {
                throw new RuntimeException("Transaction ID required for online payments");
            }
            if (paymentMethod != null && !paymentMethod.isBlank()) {
                payment.setPaymentGateway(paymentMethod.toUpperCase());
            }
            // Hold confirmation until admin verifies transaction ID
            payment.setPaymentStatus("PENDING_VERIFICATION");

            booking.setPaymentStatus("PENDING");
            booking.setStatus("PAYMENT_PENDING");
            booking.setPaymentMethod(paymentMethod);
            booking.setTransactionId(transactionId);
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
        }
        
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment processed: {} for booking: {}. Amount: {}, Commission: {}", 
            savedPayment.getId(), bookingId, totalAmount, commissionAmount);
        
        return savedPayment;
    }
    
    /**
     * Calculate payment amounts (without processing)
     */
    public Payment calculatePayment(String serviceId, Double basePrice) {
        Double commissionAmount = basePrice * (COMMISSION_RATE / 100);
        Double totalAmount = basePrice + commissionAmount;
        
        Payment payment = new Payment();
        payment.setBasePrice(basePrice);
        payment.setCommissionAmount(commissionAmount);
        payment.setCommissionRate(COMMISSION_RATE);
        payment.setTotalAmount(totalAmount);
        
        return payment;
    }
    
    /**
     * Get payment by booking ID
     */
    public Payment getPaymentByBooking(String bookingId) {
        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        return payments.isEmpty() ? null : payments.get(0);
    }
    
    /**
     * Get payments by customer
     */
    public List<Payment> getPaymentsByCustomer(String customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }
    
    /**
     * Get payments by provider
     */
    public List<Payment> getPaymentsByProvider(String providerId) {
        return paymentRepository.findByProviderId(providerId);
    }
    
    /**
     * Refund payment
     */
    @Transactional
    public Payment refundPayment(String paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        
        if (!"SUCCESS".equals(payment.getPaymentStatus())) {
            throw new RuntimeException("Can only refund successful payments");
        }
        
        if (payment.getIsRefunded()) {
            throw new RuntimeException("Payment already refunded");
        }
        
        // Refund to customer wallet
        Double refundAmount = payment.getTotalAmount();
        try {
            walletService.addBalance(
                payment.getCustomerId(),
                refundAmount,
                "Refund for payment: " + paymentId,
                "REFUND"
            );
            
            // Deduct from provider wallet if payout was done
            if (payment.getProviderPayoutDone() && payment.getProviderPayoutAmount() != null) {
                walletService.deductBalance(
                    payment.getProviderId(),
                    payment.getProviderPayoutAmount(),
                    "Refund deduction for payment: " + paymentId,
                    "REFUND_DEDUCTION"
                );
            }
            
            payment.setIsRefunded(true);
            payment.setRefundAmount(refundAmount);
            payment.setRefundReason(reason);
            payment.setRefundedAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            
            Payment savedPayment = paymentRepository.save(payment);
            log.info("Payment refunded: {} for amount: {}", paymentId, refundAmount);
            return savedPayment;
            
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }
    }

    /**
     * Admin verifies payment transaction before confirming booking
     */
    @Transactional
    public Payment verifyPaymentByAdmin(String paymentId, String transactionId, boolean approved, String note) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (transactionId != null && !transactionId.isBlank()
            && payment.getTransactionId() != null
            && !transactionId.equals(payment.getTransactionId())) {
            throw new RuntimeException("Transaction ID does not match");
        }

        Booking booking = bookingRepository.findById(payment.getBookingId())
            .orElseThrow(() -> new RuntimeException("Booking not found: " + payment.getBookingId()));

        payment.setAdminVerificationNote(note);
        payment.setAdminVerifiedAt(LocalDateTime.now());

        if (!approved) {
            payment.setPaymentStatus("FAILED");
            payment.setUpdatedAt(LocalDateTime.now());
            booking.setPaymentStatus("PENDING");
            booking.setStatus("PAYMENT_PENDING");
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            notificationService.createNotification(
                booking.getUserId(),
                "Payment Verification Failed",
                "Payment verification failed for booking " + booking.getId(),
                "PAYMENT"
            );
            return paymentRepository.save(payment);
        }

        if ("SUCCESS".equals(payment.getPaymentStatus())) {
            return payment;
        }

        Double payoutAmount = payment.getBasePrice();
        if (payoutAmount == null) {
            payoutAmount = booking.getPrice();
        }
        if (payoutAmount != null) {
            walletService.addBalance(
                payment.getProviderId(),
                payoutAmount,
                "Payment for service booking: " + booking.getId(),
                "PAYOUT"
            );
        }

        payment.setPaymentStatus("SUCCESS");
        payment.setProviderPayoutDone(true);
        payment.setProviderPayoutAmount(payoutAmount);
        payment.setProviderPayoutAt(LocalDateTime.now());
        payment.setCommissionDeducted(true);
        payment.setCommissionDeductedAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        booking.setPaymentStatus("PAID");
        booking.setStatus("CONFIRMED");
        booking.setPaymentMethod(payment.getPaymentMethod());
        booking.setTransactionId(payment.getTransactionId());
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        notificationService.createNotification(
            booking.getProviderId(),
            "New Booking Confirmed",
            "Payment verified for booking " + booking.getId(),
            "BOOKING"
        );
        notificationService.createNotification(
            booking.getUserId(),
            "Payment Verified",
            "Your payment is verified for booking " + booking.getId(),
            "PAYMENT"
        );
        sendPaymentChannelNotifications(booking, payment);

        return paymentRepository.save(payment);
    }

    /**
     * Create Razorpay order for a booking
     */
    public Map<String, Object> createRazorpayOrder(String bookingId) {
        if (razorpayKeyId == null || razorpayKeyId.isBlank()
            || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new RuntimeException("Razorpay key id/secret not configured");
        }

        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        DynamicService service;
        if (booking.getServiceId() != null && !booking.getServiceId().isEmpty()) {
            service = serviceRepository.findById(booking.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found: " + booking.getServiceId()));
        } else if (booking.getService() != null && !booking.getService().isEmpty()) {
            service = serviceRepository.findByServiceNameIgnoreCase(booking.getService())
                .orElseThrow(() -> new RuntimeException("Service not found: " + booking.getService()));
        } else {
            throw new RuntimeException("Service ID or name is required");
        }

        Double basePrice = service.getBasePrice() != null ? service.getBasePrice() : service.getPrice();
        if (basePrice == null) {
            throw new RuntimeException("Service price not set");
        }

        Double commissionAmount = basePrice * (COMMISSION_RATE / 100);
        Double totalAmount = basePrice + commissionAmount;
        int amountPaise = (int) Math.round(totalAmount * 100);

        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", amountPaise);
        payload.put("currency", "INR");
        payload.put("receipt", "booking_" + bookingId);
        payload.put("payment_capture", 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(razorpayKeyId, razorpayKeySecret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            "https://api.razorpay.com/v1/orders",
            HttpMethod.POST,
            entity,
            new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        Map<String, Object> body = response.getBody();
        if (body == null || body.get("id") == null) {
            throw new RuntimeException("Failed to create Razorpay order");
        }
        String orderId = body.get("id").toString();

        booking.setPaymentMethod("RAZORPAY");
        booking.setTransactionId(orderId);
        booking.setPaymentStatus("PENDING");
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        Map<String, Object> result = new HashMap<>();
        result.put("orderId", orderId);
        result.put("amount", body.get("amount"));
        result.put("currency", body.get("currency"));
        result.put("keyId", razorpayKeyId);
        result.put("bookingId", bookingId);
        result.put("totalAmount", totalAmount);
        return result;
    }

    /**
     * Verify Razorpay webhook signature (HMAC SHA256)
     */
    public boolean verifyRazorpayWebhook(String payload, String signature) {
        if (razorpayWebhookSecret == null || razorpayWebhookSecret.isBlank()) {
            log.warn("Razorpay webhook secret not configured; skipping signature verification.");
            return true;
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }
        try {
            String expected = hmacSha256Hex(payload, razorpayWebhookSecret);
            return expected.equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Razorpay webhook signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    public boolean verifyRazorpayPaymentSignature(String orderId, String paymentId, String signature) {
        if (razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            log.warn("Razorpay key secret not configured; cannot verify payment signature.");
            return false;
        }
        if (orderId == null || orderId.isBlank() || paymentId == null || paymentId.isBlank()) {
            return false;
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }
        try {
            String payload = orderId + "|" + paymentId;
            String expected = hmacSha256Hex(payload, razorpayKeySecret);
            return expected.equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Razorpay payment signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Handle Razorpay webhook payload
     */
    public void handleRazorpayWebhook(String payload) {
        try {
            JSONObject root = new JSONObject(payload);
            String event = root.optString("event");
            if (!"payment.captured".equalsIgnoreCase(event)) {
                return;
            }
            JSONObject payment = root.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
            String orderId = payment.optString("order_id");
            String paymentId = payment.optString("id");
            if (orderId == null || orderId.isBlank()) {
                return;
            }
            Booking booking = bookingRepository.findByTransactionId(orderId);
            if (booking == null) {
                return;
            }
            if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
                return;
            }
            processPayment(booking.getId(), "RAZORPAY", paymentId);
        } catch (Exception e) {
            log.error("Failed to handle Razorpay webhook", e);
        }
    }

    /**
     * Recheck Razorpay payment status by bookingId and confirm if captured.
     */
    public Payment reconcileRazorpayPayment(String bookingId) {
        if (razorpayKeyId == null || razorpayKeyId.isBlank()
            || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new RuntimeException("Razorpay key id/secret not configured");
        }
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
            throw new RuntimeException("Payment already completed");
        }
        String orderId = booking.getTransactionId();
        if (orderId == null || orderId.isBlank()) {
            throw new RuntimeException("Razorpay order id not found for booking");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(razorpayKeyId, razorpayKeySecret);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(
            "https://api.razorpay.com/v1/orders/" + orderId + "/payments",
            HttpMethod.GET,
            entity,
            String.class
        );
        JSONObject body = new JSONObject(response.getBody() == null ? "{}" : response.getBody());
        JSONArray items = body.optJSONArray("items");
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("No payments found for this order yet");
        }
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String status = item.optString("status");
            if ("captured".equalsIgnoreCase(status)) {
                String paymentId = item.optString("id");
                return processPayment(booking.getId(), "RAZORPAY", paymentId);
            }
        }
        throw new RuntimeException("Payment not captured yet");
    }

    private String hmacSha256Hex(String payload, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8),
            "HmacSHA256"
        );
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void sendPaymentChannelNotifications(Booking booking, Payment payment) {
        String amountText = payment.getTotalAmount() != null
            ? "₹" + payment.getTotalAmount()
            : "your payment";
        String customerMessage = "Payment successful for booking " + booking.getId() + " (" + amountText + ").";
        String providerMessage = "New booking confirmed: " + booking.getId() + " (" + amountText + ").";

        User customer = userRepository.findById(booking.getUserId()).orElse(null);
        User provider = userRepository.findById(booking.getProviderId()).orElse(null);

        if (paymentEmailEnabled) {
            if (customer != null && customer.getEmail() != null && !customer.getEmail().isBlank()) {
                emailService.sendSimpleEmail(customer.getEmail(), "Payment Successful", customerMessage);
            }
            if (provider != null && provider.getEmail() != null && !provider.getEmail().isBlank()) {
                emailService.sendSimpleEmail(provider.getEmail(), "New Booking Confirmed", providerMessage);
            }
        }
        if (paymentSmsEnabled) {
            if (customer != null && customer.getPhone() != null && !customer.getPhone().isBlank()) {
                smsService.sendSMS(customer.getPhone(), customerMessage);
            }
            if (provider != null && provider.getPhone() != null && !provider.getPhone().isBlank()) {
                smsService.sendSMS(provider.getPhone(), providerMessage);
            }
        }
        if (paymentWhatsappEnabled) {
            if (customer != null && customer.getPhone() != null && !customer.getPhone().isBlank()) {
                // Send template-based WhatsApp message for payment success
                String customerLanguage = customer.getLanguage() != null ? customer.getLanguage() : "English";
                whatsAppService.sendPaymentSuccessTemplate(
                    customer.getPhone(), 
                    customerLanguage, 
                    booking.getId(), 
                    payment.getTotalAmount()
                );
            }
            if (provider != null && provider.getPhone() != null && !provider.getPhone().isBlank()) {
                // Provider also gets template message to avoid 24-hour window restriction
                String providerLanguage = provider.getLanguage() != null ? provider.getLanguage() : "English";
                whatsAppService.sendPaymentSuccessTemplate(
                    provider.getPhone(), 
                    providerLanguage, 
                    booking.getId(), 
                    payment.getTotalAmount()
                );
            }
        }
    }
}
