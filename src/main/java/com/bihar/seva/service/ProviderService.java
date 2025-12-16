package com.bihar.seva.service;

import com.bihar.seva.dto.ProviderRegistrationDTO;
import com.bihar.seva.model.Provider;
import com.bihar.seva.repositories.ProviderRepository;
import com.bihar.seva.repositories.BookingRepository;
import com.bihar.seva.repositories.EarningsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderService {
    
    private final ProviderRepository providerRepository;
    private final BookingRepository bookingRepository;
    private final EarningsRepository earningsRepository;
    private final PasswordEncoder passwordEncoder;
    
    public Provider registerProvider(ProviderRegistrationDTO registrationDTO) {
        // Check if provider already exists
        if (providerRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            throw new RuntimeException("Provider with this email already exists");
        }
        
        if (providerRepository.findByPhone(registrationDTO.getPhone()).isPresent()) {
            throw new RuntimeException("Provider with this phone number already exists");
        }
        
        Provider provider = new Provider();
        provider.setName(registrationDTO.getName());
        provider.setEmail(registrationDTO.getEmail());
        provider.setPhone(registrationDTO.getPhone());
        provider.setPassword(passwordEncoder.encode(registrationDTO.getPassword()));
        provider.setSkill(registrationDTO.getSkill());
        provider.setCity(registrationDTO.getCity());
        provider.setAddress(registrationDTO.getAddress());
        provider.setPincode(registrationDTO.getPincode());
        provider.setPrice(registrationDTO.getPrice());
        provider.setDescription(registrationDTO.getDescription());
        provider.setExperience(registrationDTO.getExperience());
        provider.setWorkingHours(registrationDTO.getWorkingHours());
        provider.setServiceAreas(registrationDTO.getServiceAreas());
        provider.setBankAccount(registrationDTO.getBankAccount());
        provider.setIfscCode(registrationDTO.getIfscCode());
        provider.setUpiId(registrationDTO.getUpiId());
        provider.setLanguages(registrationDTO.getLanguages());
        provider.setEmergencyContact(registrationDTO.getEmergencyContact());
        provider.setEmergencyPhone(registrationDTO.getEmergencyPhone());
        provider.setVerificationCode(UUID.randomUUID().toString());
        
        return providerRepository.save(provider);
    }
    
    public Optional<Provider> findByEmail(String email) {
        return providerRepository.findByEmail(email);
    }
    
    public Optional<Provider> findById(String id) {
        return providerRepository.findById(id);
    }
    
    public List<Provider> getAllProviders() {
        return providerRepository.findAll();
    }
    
    public List<Provider> getProvidersByCity(String city) {
        return providerRepository.findByCity(city);
    }
    
    public List<Provider> getProvidersBySkill(String skill) {
        return providerRepository.findBySkillContainingIgnoreCase(skill);
    }
    
    public List<Provider> getVerifiedProviders() {
        return providerRepository.findByIsVerifiedTrue();
    }
    
    public Provider updateProvider(String id, Provider provider) {
        provider.setId(id);
        provider.setUpdatedAt(java.time.LocalDateTime.now());
        return providerRepository.save(provider);
    }
    
    public void deleteProvider(String id) {
        providerRepository.deleteById(id);
    }
    
    public Provider verifyProvider(String verificationCode) {
        Provider provider = providerRepository.findByVerificationCode(verificationCode)
            .orElseThrow(() -> new RuntimeException("Invalid verification code"));
        
        provider.setVerified(true);
        provider.setVerificationCode(null);
        return providerRepository.save(provider);
    }
    
    // Find provider by phone number
    public Optional<Provider> findByPhone(String phone) {
        return providerRepository.findByPhone(phone);
    }
    
    public Map<String, Object> getProviderDashboard(String providerId) {
        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        
        Map<String, Object> dashboard = new HashMap<>();
        
        // Today's bookings
        long todayBookings = bookingRepository.findByProviderIdAndStatus(providerId, "PENDING").stream()
            .filter(b -> b.getScheduledDate() != null && 
                b.getScheduledDate().isAfter(LocalDateTime.now().truncatedTo(ChronoUnit.DAYS)) &&
                b.getScheduledDate().isBefore(LocalDateTime.now().plusDays(1).truncatedTo(ChronoUnit.DAYS)))
            .count();
        
        // Pending requests
        long pendingRequests = bookingRepository.countByProviderIdAndStatus(providerId, "PENDING");
        
        // Completed bookings
        long completedBookings = provider.getCompletedBookings();
        
        // Earnings summary
        double totalEarnings = earningsRepository.findByProviderId(providerId).stream()
            .mapToDouble(e -> e.getNetAmount())
            .sum();
        
        double pendingEarnings = earningsRepository.findByProviderIdAndStatus(providerId, "PENDING").stream()
            .mapToDouble(e -> e.getNetAmount())
            .sum();
        
        dashboard.put("todayBookings", todayBookings);
        dashboard.put("pendingRequests", pendingRequests);
        dashboard.put("completedBookings", completedBookings);
        dashboard.put("totalEarnings", totalEarnings);
        dashboard.put("pendingEarnings", pendingEarnings);
        dashboard.put("rating", provider.getRating());
        dashboard.put("totalBookings", provider.getTotalBookings());
        dashboard.put("isVerified", provider.isVerified());
        
        return dashboard;
    }
}
