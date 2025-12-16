package com.bihar.seva.service;

import com.bihar.seva.model.KYCDocument;
import com.bihar.seva.model.Provider;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.KYCDocumentRepository;
import com.bihar.seva.repositories.ProviderRepository;
import com.bihar.seva.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class KYCService {
    
    private static final Logger logger = LoggerFactory.getLogger(KYCService.class);
    
    @Autowired
    private KYCDocumentRepository kycDocumentRepository;
    
    @Autowired
    private ProviderRepository providerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private static final String UPLOAD_DIR = "uploads/kyc/";
    
    /**
     * Submit KYC documents
     */
    public KYCDocument submitKYC(KYCDocument kycData, 
                                   MultipartFile documentFront,
                                   MultipartFile documentBack,
                                   MultipartFile selfie,
                                   MultipartFile certificate,
                                   MultipartFile experienceProof) throws IOException {
        
        logger.info("KYC document submission started for userId: {}, role: {}", 
                   kycData.getUserId(), kycData.getUserRole());
        
        Optional<KYCDocument> existingKYC = kycDocumentRepository.findByUserId(kycData.getUserId());
        
        KYCDocument kyc;
        if (existingKYC.isPresent()) {
            logger.info("Resubmitting existing KYC for userId: {}", kycData.getUserId());
            kyc = existingKYC.get();
            kyc.setStatus(KYCDocument.VerificationStatus.PENDING); // Reset status on resubmit
        } else {
            logger.info("New KYC submission for userId: {}", kycData.getUserId());
            kyc = new KYCDocument();
            kyc.setSubmittedAt(LocalDateTime.now());
        }
        
        // Update basic fields
        kyc.setUserId(kycData.getUserId());
        kyc.setUserRole(kycData.getUserRole());
        kyc.setDocumentType(kycData.getDocumentType());
        kyc.setDocumentNumber(kycData.getDocumentNumber());
        
        // Save files and update URLs
        if (documentFront != null && !documentFront.isEmpty()) {
            String frontUrl = saveFile(documentFront, kycData.getUserId(), "front");
            kyc.setDocumentFrontUrl(frontUrl);
        }
        
        if (documentBack != null && !documentBack.isEmpty()) {
            String backUrl = saveFile(documentBack, kycData.getUserId(), "back");
            kyc.setDocumentBackUrl(backUrl);
        }
        
        if (selfie != null && !selfie.isEmpty()) {
            String selfieUrl = saveFile(selfie, kycData.getUserId(), "selfie");
            kyc.setSelfieUrl(selfieUrl);
        }
        
        // Provider-specific documents
        if ("PROVIDER".equals(kycData.getUserRole())) {
            if (certificate != null && !certificate.isEmpty()) {
                String certUrl = saveFile(certificate, kycData.getUserId(), "certificate");
                kyc.setCertificateUrl(certUrl);
            }
            
            if (experienceProof != null && !experienceProof.isEmpty()) {
                String expUrl = saveFile(experienceProof, kycData.getUserId(), "experience");
                kyc.setExperienceProofUrl(expUrl);
            }
        }
        
        kyc.setUpdatedAt(LocalDateTime.now());
        
        KYCDocument savedKYC = kycDocumentRepository.save(kyc);
        logger.info("KYC documents saved successfully for userId: {}", kycData.getUserId());
        
        return savedKYC;
    }
    
    /**
     * Save uploaded file to local storage
     */
    private String saveFile(MultipartFile file, String userId, String fileType) throws IOException {
        logger.debug("Saving file for userId: {}, fileType: {}", userId, fileType);
        
        // Create upload directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
            logger.info("Created upload directory: {}", UPLOAD_DIR);
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = userId + "_" + fileType + "_" + UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = Paths.get(UPLOAD_DIR + filename);
        Files.write(filePath, file.getBytes());
        
        logger.debug("File saved successfully: {}", filename);
        return "/uploads/kyc/" + filename;
    }
    
    /**
     * Get KYC status for user
     */
    public Optional<KYCDocument> getKYCByUserId(String userId) {
        return kycDocumentRepository.findByUserId(userId);
    }
    
    /**
     * Get all pending KYC documents (for admin)
     */
    public List<KYCDocument> getPendingKYCs() {
        return kycDocumentRepository.findByStatus(KYCDocument.VerificationStatus.PENDING);
    }
    
    /**
     * Verify KYC document (admin action)
     */
    public KYCDocument verifyKYC(String kycId, String adminId, boolean approve, String rejectionReason) {
        logger.info("KYC verification process started - kycId: {}, approve: {}, adminId: {}", 
                   kycId, approve, adminId);
        
        Optional<KYCDocument> kycOpt = kycDocumentRepository.findById(kycId);
        
        if (kycOpt.isEmpty()) {
            logger.error("KYC document not found for kycId: {}", kycId);
            throw new RuntimeException("KYC document not found");
        }
        
        KYCDocument kyc = kycOpt.get();
        
        if (approve) {
            kyc.setStatus(KYCDocument.VerificationStatus.VERIFIED);
            logger.info("KYC approved for userId: {}", kyc.getUserId());
            
            // Update provider verification status if provider
            if ("PROVIDER".equals(kyc.getUserRole())) {
                updateProviderVerification(kyc.getUserId(), true);
            }
        } else {
            kyc.setStatus(KYCDocument.VerificationStatus.REJECTED);
            kyc.setRejectionReason(rejectionReason);
            logger.info("KYC rejected for userId: {}, reason: {}", kyc.getUserId(), rejectionReason);
        }
        
        kyc.setVerifiedBy(adminId);
        kyc.setVerifiedAt(LocalDateTime.now());
        kyc.setUpdatedAt(LocalDateTime.now());
        
        KYCDocument savedKYC = kycDocumentRepository.save(kyc);
        logger.info("KYC verification completed for kycId: {}, final status: {}", kycId, savedKYC.getStatus());
        
        return savedKYC;
    }
    
    /**
     * Update provider verification status
     */
    private void updateProviderVerification(String userId, boolean isVerified) {
        logger.info("Updating provider verification status for userId: {}, verified: {}", userId, isVerified);
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Get provider by user's email or phone
            Optional<Provider> providerOpt = providerRepository.findByEmail(user.getEmail());
            
            if (providerOpt.isEmpty() && user.getPhone() != null) {
                providerOpt = providerRepository.findByPhone(user.getPhone());
            }
            
            if (providerOpt.isPresent()) {
                Provider provider = providerOpt.get();
                provider.setIsVerified(isVerified);
                if (isVerified) {
                    provider.setIsActive(true); // Auto-activate on verification
                }
                providerRepository.save(provider);
                logger.info("Provider verification updated successfully - providerId: {}, verified: {}", 
                           provider.getId(), isVerified);
            } else {
                logger.warn("Provider not found for userId: {}", userId);
            }
        } else {
            logger.warn("User not found for userId: {}", userId);
        }
    }
    
    /**
     * Check if user is verified
     */
    public boolean isUserVerified(String userId) {
        Optional<KYCDocument> kyc = kycDocumentRepository.findByUserId(userId);
        return kyc.isPresent() && kyc.get().getStatus() == KYCDocument.VerificationStatus.VERIFIED;
    }
    
    /**
     * Get KYC statistics
     */
    public long getPendingKYCCount() {
        return kycDocumentRepository.countByStatus(KYCDocument.VerificationStatus.PENDING);
    }
    
    /**
     * Get KYC status by user ID (for controllers)
     */
    public Optional<KYCDocument> getKYCStatus(String userId) {
        logger.info("Fetching KYC status for userId: {}", userId);
        return getKYCByUserId(userId);
    }
    
    /**
     * Get pending KYC documents (for admin)
     */
    public List<KYCDocument> getPendingKYC() {
        logger.info("Fetching pending KYC documents");
        return getPendingKYCs();
    }
    
    /**
     * Get KYC by ID
     */
    public Optional<KYCDocument> getKYCById(String kycId) {
        logger.info("Fetching KYC by ID: {}", kycId);
        return kycDocumentRepository.findById(kycId);
    }
    
    /**
     * Approve KYC (simplified method for controllers)
     */
    public KYCDocument approveKYC(String kycId, String adminId) {
        logger.info("Approving KYC: {} by admin: {}", kycId, adminId);
        return verifyKYC(kycId, adminId, true, null);
    }
    
    /**
     * Reject KYC (simplified method for controllers)
     */
    public KYCDocument rejectKYC(String kycId, String adminId, String reason) {
        logger.info("Rejecting KYC: {} by admin: {}, reason: {}", kycId, adminId, reason);
        return verifyKYC(kycId, adminId, false, reason);
    }
}
