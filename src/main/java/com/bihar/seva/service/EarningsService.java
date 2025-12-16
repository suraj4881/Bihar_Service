package com.bihar.seva.service;

import com.bihar.seva.model.Earnings;
import com.bihar.seva.model.Booking;
import com.bihar.seva.repositories.EarningsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class EarningsService {
    
    private final EarningsRepository earningsRepository;
    
    public Earnings createEarning(Booking booking, double commissionRate) {
        Earnings earnings = new Earnings();
        earnings.setProviderId(booking.getProviderId());
        earnings.setBookingId(booking.getId());
        earnings.setAmount(booking.getPrice());
        
        double commission = booking.getPrice() * commissionRate;
        earnings.setCommission(commission);
        earnings.setNetAmount(booking.getPrice() - commission);
        
        earnings.setEarnedAt(LocalDateTime.now());
        
        Earnings saved = earningsRepository.save(earnings);
        log.info("Earnings created: {} for provider: {}", saved.getId(), booking.getProviderId());
        return saved;
    }
    
    public List<Earnings> getProviderEarnings(String providerId) {
        return earningsRepository.findByProviderId(providerId);
    }
    
    public List<Earnings> getProviderEarningsByStatus(String providerId, String status) {
        return earningsRepository.findByProviderIdAndStatus(providerId, status);
    }
    
    public Map<String, Object> getProviderEarningsSummary(String providerId) {
        List<Earnings> allEarnings = earningsRepository.findByProviderId(providerId);
        
        double totalEarned = allEarnings.stream()
            .mapToDouble(Earnings::getNetAmount)
            .sum();
        
        double pendingAmount = allEarnings.stream()
            .filter(e -> "PENDING".equals(e.getStatus()))
            .mapToDouble(Earnings::getNetAmount)
            .sum();
        
        double paidAmount = allEarnings.stream()
            .filter(e -> "PAID".equals(e.getStatus()))
            .mapToDouble(Earnings::getNetAmount)
            .sum();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEarned", totalEarned);
        summary.put("pendingAmount", pendingAmount);
        summary.put("paidAmount", paidAmount);
        summary.put("totalBookings", allEarnings.size());
        
        return summary;
    }
    
    public Map<String, Object> getEarningsByPeriod(String providerId, LocalDateTime start, LocalDateTime end) {
        List<Earnings> earnings = earningsRepository.findByProviderIdAndEarnedAtBetween(providerId, start, end);
        
        double totalEarned = earnings.stream()
            .mapToDouble(Earnings::getNetAmount)
            .sum();
        
        double totalCommission = earnings.stream()
            .mapToDouble(Earnings::getCommission)
            .sum();
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalEarned", totalEarned);
        result.put("totalCommission", totalCommission);
        result.put("bookingCount", earnings.size());
        result.put("earnings", earnings);
        
        return result;
    }
    
    public Earnings markAsPaid(String earningId, String transactionId, String paymentMethod) {
        Earnings earnings = earningsRepository.findById(earningId)
            .orElseThrow(() -> new RuntimeException("Earnings not found"));
        
        earnings.setStatus("PAID");
        earnings.setTransactionId(transactionId);
        earnings.setPaymentMethod(paymentMethod);
        earnings.setPaidAt(LocalDateTime.now());
        
        Earnings saved = earningsRepository.save(earnings);
        log.info("Earnings marked as paid: {}", earningId);
        return saved;
    }
}

