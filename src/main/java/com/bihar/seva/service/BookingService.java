package com.bihar.seva.service;

import com.bihar.seva.dto.BookingRequestDTO;
import com.bihar.seva.model.Booking;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.DynamicServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DynamicServiceRepository dynamicServiceRepository;
    
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
        
        booking.setStatus(status);
        booking.setUpdatedAt(LocalDateTime.now());
        
        if ("COMPLETED".equals(status)) {
            booking.setCompletedDate(LocalDateTime.now());
            
            // Update provider stats
            com.bihar.seva.model.User provider = userRepository.findById(booking.getProviderId()).orElse(null);
            if (provider != null && "PROVIDER".equals(provider.getRole())) {
                provider.setTotalBookings(provider.getTotalBookings() + 1);
                userRepository.save(provider);
            }
            
            // Update service completedJobs count
            if (booking.getServiceId() != null && !booking.getServiceId().isEmpty()) {
                com.bihar.seva.model.DynamicService service = dynamicServiceRepository.findById(booking.getServiceId()).orElse(null);
                if (service != null) {
                    int currentJobs = service.getCompletedJobs() != null ? service.getCompletedJobs() : 0;
                    service.setCompletedJobs(currentJobs + 1);
                    dynamicServiceRepository.save(service);
                    log.info("Updated completedJobs for service: {} to {}", service.getId(), currentJobs + 1);
                }
            }
        }
        
        log.info("Booking {} status updated to: {}", id, status);
        return bookingRepository.save(booking);
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
        return bookingRepository.save(booking);
    }
}
