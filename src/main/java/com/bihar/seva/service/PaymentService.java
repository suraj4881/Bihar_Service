package com.bihar.seva.service;

import com.bihar.seva.model.Payment;
import com.bihar.seva.model.DynamicService;
import com.bihar.seva.model.Booking;
import com.bihar.seva.repositories.PaymentRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import com.bihar.seva.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    
    private static final Double COMMISSION_RATE = 10.0; // 10% commission
    
    /**
     * Process payment for a booking
     */
    @Transactional
    public Payment processPayment(String bookingId, String paymentMethod, String transactionId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        
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
                
            } catch (Exception e) {
                log.error("Payment processing failed: {}", e.getMessage());
                payment.setPaymentStatus("FAILED");
            }
        } else {
            // For ONLINE, UPI, CARD - payment gateway integration needed
            // For now, mark as pending
            payment.setPaymentStatus("PENDING");
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
}
