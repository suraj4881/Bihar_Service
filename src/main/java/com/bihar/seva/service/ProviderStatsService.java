package com.bihar.seva.service;

import com.bihar.seva.model.Booking;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Aggregates provider dashboard metrics from bookings and user profile.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderStatsService {

    private static final Set<String> PENDING_LIKE = Set.of(
            "PENDING", "PAYMENT_PENDING", "CONFIRMED", "IN_PROGRESS"
    );

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public Map<String, Object> buildStats(String providerId) {
        User provider = userRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        if (!"PROVIDER".equals(provider.getRole())) {
            throw new RuntimeException("User is not a provider");
        }

        List<Booking> all = bookingRepository.findByProviderId(providerId);
        long totalBookings = all.size();
        long completedCount = all.stream().filter(b -> "COMPLETED".equals(b.getStatus())).count();
        long pendingCount = all.stream()
                .filter(b -> PENDING_LIKE.contains(b.getStatus()))
                .count();

        double totalEarnings = 0;
        double thisMonthEarnings = 0;
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);

        for (Booking b : all) {
            if (!"COMPLETED".equals(b.getStatus())) {
                continue;
            }
            double share = providerShare(b);
            totalEarnings += share;
            LocalDateTime done = b.getCompletedDate();
            if (done != null && !done.toLocalDate().isBefore(firstOfMonth)) {
                thisMonthEarnings += share;
            }
        }

        List<Booking> rated = all.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) && b.getCustomerRating() > 0)
                .collect(Collectors.toList());
        int totalReviews = rated.size();
        double averageRating = 0;
        if (!rated.isEmpty()) {
            averageRating = rated.stream().mapToInt(Booking::getCustomerRating).average().orElse(0);
            averageRating = Math.round(averageRating * 10.0) / 10.0;
        } else {
            User u = userRepository.findById(providerId).orElse(null);
            if (u != null && u.getRating() > 0) {
                averageRating = u.getRating();
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("totalBookings", totalBookings);
        out.put("pendingBookings", pendingCount);
        out.put("completedBookings", completedCount);
        out.put("totalEarnings", totalEarnings);
        out.put("thisMonthEarnings", thisMonthEarnings);
        out.put("averageRating", averageRating);
        out.put("totalReviews", totalReviews);
        return out;
    }

    /** Amount credited to provider after platform commission. */
    public static double providerShare(Booking b) {
        double total = b.getTotalAmount() > 0
                ? b.getTotalAmount()
                : (b.getTotalPrice() > 0 ? b.getTotalPrice() : b.getPrice());
        double comm = b.getCommission() >= 0 ? b.getCommission() : 0;
        return Math.max(0, total - comm);
    }
}
