package com.bihar.seva.service;

import com.bihar.seva.dto.BookingRequestDTO;
import com.bihar.seva.model.Booking;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DynamicServiceRepository dynamicServiceRepository;
    private final FileUploadService fileUploadService;
    private final WalletService walletService;

    private final Random random = new Random();

    public Booking createBooking(BookingRequestDTO bookingRequest) {
        // Validate user exists
        userRepository.findById(bookingRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate provider exists
        com.bihar.seva.model.User provider = userRepository.findById(bookingRequest.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        if (!"PROVIDER".equals(provider.getRole())) {
            throw new RuntimeException("User is not a provider");
        }

        // Check if provider is verified
        if (!provider.isVerified()) {
            throw new RuntimeException("Provider is not verified");
        }

        Booking booking = new Booking();
        booking.setUserId(bookingRequest.getUserId());
        booking.setProviderId(bookingRequest.getProviderId());
        booking.setService(bookingRequest.getService());
        booking.setServiceId(bookingRequest.getServiceId());
        booking.setAddress(bookingRequest.getAddress());
        booking.setCity(bookingRequest.getCity());
        booking.setPincode(bookingRequest.getPincode());
        booking.setLandmark(bookingRequest.getLandmark());
        booking.setScheduledDate(bookingRequest.getScheduledDate());
        booking.setBookingDate(LocalDateTime.now());
        booking.setPrice(bookingRequest.getPrice());
        booking.setSpecialInstructions(bookingRequest.getSpecialInstructions());
        booking.setEmergencyContact(bookingRequest.getEmergencyContact());
        booking.setEmergencyPhone(bookingRequest.getEmergencyPhone());

        // Calculate commission (15% of price)
        booking.setCommission(bookingRequest.getPrice() * 0.15);
        booking.setTotalAmount(bookingRequest.getPrice());
        booking.setStatus("PAYMENT_PENDING");
        booking.setPaymentStatus("PENDING");
        // 4-digit PIN for end-of-service verification (same code until completion)
        booking.setServiceCompletionPin(String.format("%04d", random.nextInt(10000)));

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} for user: {} with provider: {}",
                saved.getId(), bookingRequest.getUserId(), bookingRequest.getProviderId());
        return saved;
    }

    public Optional<Booking> findById(String id) {
        return bookingRepository.findById(id);
    }

    public List<Booking> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByUserAndStatus(String userId, String status) {
        return bookingRepository.findByUserIdAndStatus(userId, status);
    }

    public List<Booking> getBookingsByProvider(String providerId) {
        return bookingRepository.findByProviderId(providerId);
    }

    public List<Booking> getBookingsByProviderAndStatus(String providerId, String status) {
        return bookingRepository.findByProviderIdAndStatus(providerId, status);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking updateBookingStatus(String id, String status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        String previous = booking.getStatus();
        booking.setStatus(status);
        booking.setUpdatedAt(LocalDateTime.now());

        if ("COMPLETED".equals(status)) {
            if (booking.getCompletedDate() == null) {
                booking.setCompletedDate(LocalDateTime.now());
            }
            if (!"COMPLETED".equals(previous)) {
                com.bihar.seva.model.User provider = userRepository.findById(booking.getProviderId()).orElse(null);
                if (provider != null && "PROVIDER".equals(provider.getRole())) {
                    provider.setTotalBookings(provider.getTotalBookings() + 1);
                    userRepository.save(provider);
                }
                if (booking.getServiceId() != null && !booking.getServiceId().isEmpty()) {
                    com.bihar.seva.model.DynamicService service = dynamicServiceRepository
                            .findById(booking.getServiceId()).orElse(null);
                    if (service != null) {
                        int currentJobs = service.getCompletedJobs() != null ? service.getCompletedJobs() : 0;
                        service.setCompletedJobs(currentJobs + 1);
                        dynamicServiceRepository.save(service);
                        log.info("Updated completedJobs for service: {} to {}", service.getId(), currentJobs + 1);
                    }
                }
                creditProviderWalletForCompletedBooking(booking);
            }
        }

        log.info("Booking {} status updated to: {}", id, status);
        return bookingRepository.save(booking);
    }

    private void creditProviderWalletForCompletedBooking(Booking booking) {
        try {
            double amount = ProviderStatsService.providerShare(booking);
            if (amount <= 0) {
                return;
            }
            walletService.addBalance(
                    booking.getProviderId(),
                    amount,
                    "Completed service — booking " + booking.getId(),
                    "CREDIT");
        } catch (Exception e) {
            log.warn("Could not credit provider wallet for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    public Booking updateProviderLocation(String id, Double latitude, Double longitude) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setProviderLatitude(latitude);
        booking.setProviderLongitude(longitude);
        booking.setProviderLocationUpdatedAt(LocalDateTime.now());

        if ("CONFIRMED".equals(booking.getStatus())) {
            booking.setStatus("IN_PROGRESS");
        }
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public Booking markArrived(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setArrivedAt(LocalDateTime.now());
        if ("CONFIRMED".equals(booking.getStatus())) {
            booking.setStatus("IN_PROGRESS");
        }
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    /**
     * Provider may complete or refresh OTP for any non-terminal booking once
     * payment is captured.
     * (Strict CONFIRMED/IN_PROGRESS-only rules caused failures when status lagged
     * after payment.)
     */
    private void assertProviderCanComplete(Booking booking, String providerId) {
        if (!booking.getProviderId().equals(providerId)) {
            throw new RuntimeException("Not authorized for this booking");
        }
        String st = booking.getStatus();
        if ("COMPLETED".equals(st) || "CANCELLED".equals(st)) {
            throw new RuntimeException("Booking cannot be completed in current status: " + st);
        }
        if (!"PAID".equals(booking.getPaymentStatus())) {
            throw new RuntimeException("Payment must be completed before marking service done");
        }
    }

    /**
     * Provider action: generate a fresh 4-digit code and persist it so the customer
     * sees it on their dashboard.
     *
     * @param customerUserId optional — if sent, must match booking (catches wrong
     *                       booking in UI)
     * @param serviceId      optional — if sent, must match booking when present
     */
    public Booking sendCompletionOtpToCustomer(String bookingId, String providerId, String customerUserId,
            String serviceId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (customerUserId != null && !customerUserId.isBlank()
                && !customerUserId.equals(booking.getUserId())) {
            throw new RuntimeException("Customer does not match this booking");
        }
        if (serviceId != null && !serviceId.isBlank() && booking.getServiceId() != null
                && !serviceId.equals(booking.getServiceId())) {
            throw new RuntimeException("Service does not match this booking");
        }
        assertProviderCanComplete(booking, providerId);
        String pin = String.format("%04d", random.nextInt(10000));
        booking.setServiceCompletionPin(pin);
        booking.setCompletionOtpSentAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        log.info("Completion OTP refreshed for booking {} by provider {}", bookingId, providerId);
        return bookingRepository.save(booking);
    }

    /**
     * Verifies the DB-stored {@link Booking#getServiceCompletionPin()}, stores
     * completion photos,
     * and marks the booking completed (with stats updates).
     */
    public Booking completeWithVerification(String bookingId, String providerId, String otp, List<MultipartFile> files)
            throws IOException {
        if (otp == null || otp.trim().isEmpty()) {
            throw new RuntimeException("Completion PIN is required");
        }
        String normalized = otp.trim().replaceAll("\\D", "");
        if (normalized.length() != 4) {
            throw new RuntimeException("Enter the 4-digit completion code from the customer");
        }
        if (files == null || files.isEmpty()) {
            throw new RuntimeException("At least one completion photo is required");
        }
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        assertProviderCanComplete(booking, providerId);

        String storedPin = booking.getServiceCompletionPin();
        if (storedPin == null || storedPin.isEmpty()) {
            throw new RuntimeException(
                    "This booking has no completion code. It may be an old booking — contact support.");
        }
        if (!storedPin.equals(normalized)) {
            throw new RuntimeException(
                    "Invalid completion code. Ask the customer for the code shown on their booking.");
        }

        List<String> paths = new ArrayList<>();
        String sub = "booking-completion/" + bookingId;
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                paths.add(fileUploadService.uploadFile(file, sub));
            }
        }
        if (paths.isEmpty()) {
            throw new RuntimeException("At least one completion photo is required");
        }

        booking.setCompletionPhotoPaths(paths);
        booking.setUpdatedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        return updateBookingStatus(bookingId, "COMPLETED");
    }

    public Booking cancelBooking(String id, String reason, String cancelledBy) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus("CANCELLED");
        booking.setCancellationReason(reason);
        booking.setCancelledBy(cancelledBy);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        log.info("Booking {} cancelled by: {}", id, cancelledBy);
        return bookingRepository.save(booking);
    }

    public Booking addRating(String id, int customerRating, String customerFeedback) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"COMPLETED".equals(booking.getStatus())) {
            throw new RuntimeException("Can only rate completed bookings");
        }

        booking.setCustomerRating(customerRating);
        booking.setCustomerFeedback(customerFeedback);
        booking.setUpdatedAt(LocalDateTime.now());

        log.info("Rating added to booking: {}, rating: {}", id, customerRating);
        Booking saved = bookingRepository.save(booking);
        syncProviderAggregateRating(booking.getProviderId());
        return saved;
    }

    private void syncProviderAggregateRating(String providerId) {
        List<Booking> completed = bookingRepository.findByProviderIdAndStatus(providerId, "COMPLETED");
        List<Booking> rated = completed.stream()
                .filter(b -> b.getCustomerRating() > 0)
                .collect(Collectors.toList());
        if (rated.isEmpty()) {
            return;
        }
        double avg = rated.stream().mapToInt(Booking::getCustomerRating).average().orElse(0);
        final double roundedAvg = Math.round(avg * 10.0) / 10.0;
        userRepository.findById(providerId).ifPresent(p -> {
            if ("PROVIDER".equals(p.getRole())) {
                p.setRating(roundedAvg);
                p.setUpdatedAt(LocalDateTime.now());
                userRepository.save(p);
            }
        });
    }
}