package com.bihar.seva.service;

import com.bihar.seva.model.AadhaarDocument;
import com.bihar.seva.model.PANDocument;
import com.bihar.seva.model.SelfieDocument;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.AadhaarDocumentRepository;
import com.bihar.seva.repositories.PANDocumentRepository;
import com.bihar.seva.repositories.SelfieDocumentRepository;
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
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.io.ByteArrayOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class KYCService {
    
    private static final Logger logger = LoggerFactory.getLogger(KYCService.class);
    
    @Autowired
    private AadhaarDocumentRepository aadhaarDocumentRepository;
    
    @Autowired
    private PANDocumentRepository panDocumentRepository;
    
    @Autowired
    private SelfieDocumentRepository selfieDocumentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private static final String UPLOAD_DIR = "uploads/kyc/";
    
    // Old submitKYC method removed - use submitAadhaar, submitPAN, submitSelfie instead
    
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
    
    // Old getKYCByUserId and getPendingKYCs methods removed - use getPendingKYCRequests() instead
    
    /**
     * Get all pending KYC requests from separate collections (Aadhaar, PAN, Selfie)
     * Groups documents by userId and returns combined KYC requests
     * Uses database-level queries to fetch only PENDING, UNDER_REVIEW, or NULL status documents
     */
    public List<com.bihar.seva.dto.PendingKYCRequest> getPendingKYCRequests() {
        logger.info("Fetching pending KYC requests from separate collections");
        
        List<AadhaarDocument> pendingAadhaarDocs;
        List<PANDocument> pendingPANDocs;
        List<SelfieDocument> pendingSelfieDocs;
        
        try {
            List<AadhaarDocument> allAadhaar = aadhaarDocumentRepository.findAll();
            List<PANDocument> allPAN = panDocumentRepository.findAll();
            List<SelfieDocument> allSelfie = selfieDocumentRepository.findAll();
            
            logger.debug("Total documents in database - Aadhaar: {}, PAN: {}, Selfie: {}", 
                allAadhaar.size(), allPAN.size(), allSelfie.size());
            
            // Filter documents in Java (excluding VERIFIED and REJECTED)
            pendingAadhaarDocs = allAadhaar.stream()
                .filter(doc -> {
                    if (doc.getStatus() == null) {
                        logger.debug("Including Aadhaar with NULL status - userId: {}", doc.getUserId());
                        return true;
                    }
                    if (doc.getStatus() == AadhaarDocument.VerificationStatus.VERIFIED ||
                        doc.getStatus() == AadhaarDocument.VerificationStatus.REJECTED) {
                        return false;
                    }
                    logger.debug("Including Aadhaar with status: {} - userId: {}", doc.getStatus(), doc.getUserId());
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
            
            pendingPANDocs = allPAN.stream()
                .filter(doc -> {
                    if (doc.getStatus() == null) {
                        logger.debug("Including PAN with NULL status - userId: {}", doc.getUserId());
                        return true;
                    }
                    if (doc.getStatus() == PANDocument.VerificationStatus.VERIFIED ||
                        doc.getStatus() == PANDocument.VerificationStatus.REJECTED) {
                        return false;
                    }
                    logger.debug("Including PAN with status: {} - userId: {}", doc.getStatus(), doc.getUserId());
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
            
            pendingSelfieDocs = allSelfie.stream()
                .filter(doc -> {
                    if (doc.getStatus() == null) {
                        logger.debug("Including Selfie with NULL status - userId: {}", doc.getUserId());
                        return true;
                    }
                    if (doc.getStatus() == SelfieDocument.VerificationStatus.VERIFIED ||
                        doc.getStatus() == SelfieDocument.VerificationStatus.REJECTED) {
                        return false;
                    }
                    logger.debug("Including Selfie with status: {} - userId: {}", doc.getStatus(), doc.getUserId());
                    return true;
                })
                .collect(java.util.stream.Collectors.toList());
            
            logger.info("Filtered documents - Aadhaar: {}, PAN: {}, Selfie: {}", 
                pendingAadhaarDocs.size(), pendingPANDocs.size(), pendingSelfieDocs.size());
            
        } catch (Exception e) {
            logger.error("Error querying KYC collections", e);
            return new java.util.ArrayList<>();
        }
        
        // Check if all collections are empty
        if (pendingAadhaarDocs.isEmpty() && pendingPANDocs.isEmpty() && pendingSelfieDocs.isEmpty()) {
            logger.warn("No pending/under-review documents found in any collection. All documents may be verified or rejected.");
            return new java.util.ArrayList<>();
        }
        
        logger.info("Total pending/under-review documents found: {} (Aadhaar: {}, PAN: {}, Selfie: {})", 
                   pendingAadhaarDocs.size() + pendingPANDocs.size() + pendingSelfieDocs.size(),
                   pendingAadhaarDocs.size(), pendingPANDocs.size(), pendingSelfieDocs.size());
        
        // Get all unique userIds
        java.util.Set<String> userIds = new java.util.HashSet<>();
        for (AadhaarDocument doc : pendingAadhaarDocs) {
            if (doc.getUserId() != null && !doc.getUserId().isEmpty()) {
                userIds.add(doc.getUserId());
                logger.debug("Added userId from Aadhaar: {}", doc.getUserId());
            } else {
                logger.warn("Aadhaar document has NULL or empty userId - id: {}", doc.getId());
            }
        }
        for (PANDocument doc : pendingPANDocs) {
            if (doc.getUserId() != null && !doc.getUserId().isEmpty()) {
                userIds.add(doc.getUserId());
                logger.debug("Added userId from PAN: {}", doc.getUserId());
            } else {
                logger.warn("PAN document has NULL or empty userId - id: {}", doc.getId());
            }
        }
        for (SelfieDocument doc : pendingSelfieDocs) {
            if (doc.getUserId() != null && !doc.getUserId().isEmpty()) {
                userIds.add(doc.getUserId());
                logger.debug("Added userId from Selfie: {}", doc.getUserId());
            } else {
                logger.warn("Selfie document has NULL or empty userId - id: {}", doc.getId());
            }
        }
        
        logger.info("Found {} unique users with pending/under review KYC documents", userIds.size());
        
        if (userIds.isEmpty()) {
            logger.warn("No user IDs found. No documents matched the filter criteria.");
            return new java.util.ArrayList<>();
        }
        
        // Build PendingKYCRequest for each userId
        List<com.bihar.seva.dto.PendingKYCRequest> requests = new java.util.ArrayList<>();
        
        for (String userId : userIds) {
            com.bihar.seva.dto.PendingKYCRequest request = new com.bihar.seva.dto.PendingKYCRequest();
            request.setUserId(userId);
            
            // Get user details
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                request.setUserName(user.getName());
                request.setUserEmail(user.getEmail());
                request.setUserPhone(user.getPhone());
                request.setUserRole(user.getRole());
            }
            
            // Find Aadhaar document
            Optional<AadhaarDocument> aadhaarOpt = pendingAadhaarDocs.stream()
                .filter(doc -> doc.getUserId() != null && doc.getUserId().equals(userId))
                .findFirst();
            if (aadhaarOpt.isPresent()) {
                AadhaarDocument aadhaar = aadhaarOpt.get();
                request.setHasAadhaar(true);
                request.setAadhaarId(aadhaar.getId());
                request.setAadhaarStatus(aadhaar.getStatus() != null ? aadhaar.getStatus().name() : "PENDING");
                request.setAadhaarFrontUrl(aadhaar.getFrontImageUrl());
                request.setAadhaarBackUrl(aadhaar.getBackImageUrl());
                request.setAadhaarSubmittedAt(aadhaar.getSubmittedAt());
            }
            
            // Find PAN document
            Optional<PANDocument> panOpt = pendingPANDocs.stream()
                .filter(doc -> doc.getUserId() != null && doc.getUserId().equals(userId))
                .findFirst();
            if (panOpt.isPresent()) {
                PANDocument pan = panOpt.get();
                request.setHasPAN(true);
                request.setPanId(pan.getId());
                request.setPanStatus(pan.getStatus() != null ? pan.getStatus().name() : "PENDING");
                request.setPanImageUrl(pan.getPanImageUrl());
                request.setPanSubmittedAt(pan.getSubmittedAt());
            }
            
            // Find Selfie document
            Optional<SelfieDocument> selfieOpt = pendingSelfieDocs.stream()
                .filter(doc -> doc.getUserId() != null && doc.getUserId().equals(userId))
                .findFirst();
            if (selfieOpt.isPresent()) {
                SelfieDocument selfie = selfieOpt.get();
                request.setHasSelfie(true);
                request.setSelfieId(selfie.getId());
                request.setSelfieStatus(selfie.getStatus() != null ? selfie.getStatus().name() : "PENDING");
                request.setSelfieImageUrl(selfie.getSelfieImageUrl());
                request.setSelfieSubmittedAt(selfie.getSubmittedAt());
            }
            
            // Determine overall status
            boolean hasPending = false;
            boolean hasUnderReview = false;
            LocalDateTime earliestSubmitted = null;
            java.util.List<String> documentIds = new java.util.ArrayList<>();
            
            if (request.isHasAadhaar()) {
                if ("PENDING".equals(request.getAadhaarStatus())) {
                    hasPending = true;
                } else if ("UNDER_REVIEW".equals(request.getAadhaarStatus())) {
                    hasUnderReview = true;
                }
                if (request.getAadhaarSubmittedAt() != null) {
                    if (earliestSubmitted == null || request.getAadhaarSubmittedAt().isBefore(earliestSubmitted)) {
                        earliestSubmitted = request.getAadhaarSubmittedAt();
                    }
                }
                documentIds.add(request.getAadhaarId());
            }
            
            if (request.isHasPAN()) {
                if ("PENDING".equals(request.getPanStatus())) {
                    hasPending = true;
                } else if ("UNDER_REVIEW".equals(request.getPanStatus())) {
                    hasUnderReview = true;
                }
                if (request.getPanSubmittedAt() != null) {
                    if (earliestSubmitted == null || request.getPanSubmittedAt().isBefore(earliestSubmitted)) {
                        earliestSubmitted = request.getPanSubmittedAt();
                    }
                }
                documentIds.add(request.getPanId());
            }
            
            if (request.isHasSelfie()) {
                if ("PENDING".equals(request.getSelfieStatus())) {
                    hasPending = true;
                } else if ("UNDER_REVIEW".equals(request.getSelfieStatus())) {
                    hasUnderReview = true;
                }
                if (request.getSelfieSubmittedAt() != null) {
                    if (earliestSubmitted == null || request.getSelfieSubmittedAt().isBefore(earliestSubmitted)) {
                        earliestSubmitted = request.getSelfieSubmittedAt();
                    }
                }
                documentIds.add(request.getSelfieId());
            }
            
            if (hasUnderReview) {
                request.setOverallStatus("UNDER_REVIEW");
            } else if (hasPending) {
                request.setOverallStatus("PENDING");
            } else {
                request.setOverallStatus("PARTIAL");
            }
            
            request.setEarliestSubmittedAt(earliestSubmitted);
            request.setDocumentIds(documentIds);
            
            requests.add(request);
        }
        
        // Sort by earliest submitted date (most recent first)
        requests.sort((a, b) -> {
            if (a.getEarliestSubmittedAt() == null && b.getEarliestSubmittedAt() == null) return 0;
            if (a.getEarliestSubmittedAt() == null) return 1;
            if (b.getEarliestSubmittedAt() == null) return -1;
            return b.getEarliestSubmittedAt().compareTo(a.getEarliestSubmittedAt());
        });
        
        logger.info("Returning {} pending KYC requests", requests.size());
        if (requests.isEmpty()) {
            logger.warn("No KYC requests to return");
        } else {
            logger.debug("Successfully built {} KYC requests", requests.size());
            for (com.bihar.seva.dto.PendingKYCRequest req : requests) {
                logger.debug("User: {} ({}), Role: {}, Aadhaar: {}, PAN: {}, Selfie: {}", 
                    req.getUserName(), req.getUserEmail(), req.getUserRole(),
                    req.isHasAadhaar(), req.isHasPAN(), req.isHasSelfie());
            }
        }
        return requests;
    }
    
    // Old KYCDocument methods removed - KYC is now handled via separate collections (Aadhaar, PAN, Selfie)
    // Use approve/reject methods for individual document types
    
    /**
     * Get aggregated KYC status from separate collections (Aadhaar, PAN, Selfie)
     */
    public com.bihar.seva.dto.KYCStatusResponse getAggregatedKYCStatus(String userId) {
        logger.info("=== Fetching aggregated KYC status for userId: {} ===", userId);
        
        com.bihar.seva.dto.KYCStatusResponse response = new com.bihar.seva.dto.KYCStatusResponse();
        
        // Check Aadhaar
        Optional<AadhaarDocument> aadhaar = aadhaarDocumentRepository.findByUserId(userId);
        response.setAadhaarSubmitted(aadhaar.isPresent());
        if (aadhaar.isPresent()) {
            response.setAadhaarStatus(aadhaar.get().getStatus().name());
            response.setAadhaarFrontUrl(aadhaar.get().getFrontImageUrl());
            response.setAadhaarBackUrl(aadhaar.get().getBackImageUrl());
            logger.info("Aadhaar document found - Status: {}, ID: {}", aadhaar.get().getStatus(), aadhaar.get().getId());
        } else {
            logger.info("No Aadhaar document found for userId: {}", userId);
        }
        
        // Check PAN
        Optional<PANDocument> pan = panDocumentRepository.findByUserId(userId);
        response.setPanSubmitted(pan.isPresent());
        if (pan.isPresent()) {
            response.setPanStatus(pan.get().getStatus().name());
            response.setPanImageUrl(pan.get().getPanImageUrl());
            logger.info("PAN document found - Status: {}, ID: {}", pan.get().getStatus(), pan.get().getId());
        } else {
            logger.info("No PAN document found for userId: {}", userId);
        }
        
        // Check Selfie
        Optional<SelfieDocument> selfie = selfieDocumentRepository.findByUserId(userId);
        response.setSelfieSubmitted(selfie.isPresent());
        if (selfie.isPresent()) {
            response.setSelfieStatus(selfie.get().getStatus().name());
            response.setSelfieImageUrl(selfie.get().getSelfieImageUrl());
            logger.info("Selfie document found - Status: {}, ID: {}", selfie.get().getStatus(), selfie.get().getId());
        } else {
            logger.info("No Selfie document found for userId: {}", userId);
        }
        
        // Determine overall status
        boolean hasAnyDocument = response.isAadhaarSubmitted() || response.isPanSubmitted() || response.isSelfieSubmitted();
        
        logger.info("KYC Status Check - Aadhaar: {}, PAN: {}, Selfie: {}", 
                   response.isAadhaarSubmitted(), response.isPanSubmitted(), response.isSelfieSubmitted());
        
        if (!hasAnyDocument) {
            // No documents submitted
            logger.info("No documents submitted for userId: {}", userId);
            response.setStatus(null);
        } else {
            logger.info("Documents found for userId: {}, checking status...", userId);
            // Check if any document is rejected
            boolean hasRejected = false;
            String rejectionReason = null;
            
            if (aadhaar.isPresent() && aadhaar.get().getStatus() == AadhaarDocument.VerificationStatus.REJECTED) {
                hasRejected = true;
                rejectionReason = aadhaar.get().getRejectionReason();
            }
            if (pan.isPresent() && pan.get().getStatus() == PANDocument.VerificationStatus.REJECTED) {
                hasRejected = true;
                if (rejectionReason == null) {
                    rejectionReason = pan.get().getRejectionReason();
                }
            }
            if (selfie.isPresent() && selfie.get().getStatus() == SelfieDocument.VerificationStatus.REJECTED) {
                hasRejected = true;
                if (rejectionReason == null) {
                    rejectionReason = selfie.get().getRejectionReason();
                }
            }
            
            if (hasRejected) {
                response.setStatus("REJECTED");
                response.setRejectionReason(rejectionReason);
            } else {
                // Check if all documents are verified
                boolean allVerified = true;
                boolean anyUnderReview = false;
                
                if (aadhaar.isPresent()) {
                    if (aadhaar.get().getStatus() != AadhaarDocument.VerificationStatus.VERIFIED) {
                        allVerified = false;
                        if (aadhaar.get().getStatus() == AadhaarDocument.VerificationStatus.UNDER_REVIEW) {
                            anyUnderReview = true;
                        }
                    }
                } else {
                    allVerified = false;
                }
                
                if (pan.isPresent()) {
                    if (pan.get().getStatus() != PANDocument.VerificationStatus.VERIFIED) {
                        allVerified = false;
                        if (pan.get().getStatus() == PANDocument.VerificationStatus.UNDER_REVIEW) {
                            anyUnderReview = true;
                        }
                    }
                } else {
                    allVerified = false;
                }
                
                if (selfie.isPresent()) {
                    if (selfie.get().getStatus() != SelfieDocument.VerificationStatus.VERIFIED) {
                        allVerified = false;
                        if (selfie.get().getStatus() == SelfieDocument.VerificationStatus.UNDER_REVIEW) {
                            anyUnderReview = true;
                        }
                    }
                } else {
                    allVerified = false;
                }
                
                if (allVerified) {
                    response.setStatus("VERIFIED");
                    // Get the latest verifiedAt
                    LocalDateTime latestVerifiedAt = null;
                    if (aadhaar.isPresent() && aadhaar.get().getVerifiedAt() != null) {
                        latestVerifiedAt = aadhaar.get().getVerifiedAt();
                    }
                    if (pan.isPresent() && pan.get().getVerifiedAt() != null) {
                        if (latestVerifiedAt == null || pan.get().getVerifiedAt().isAfter(latestVerifiedAt)) {
                            latestVerifiedAt = pan.get().getVerifiedAt();
                        }
                    }
                    if (selfie.isPresent() && selfie.get().getVerifiedAt() != null) {
                        if (latestVerifiedAt == null || selfie.get().getVerifiedAt().isAfter(latestVerifiedAt)) {
                            latestVerifiedAt = selfie.get().getVerifiedAt();
                        }
                    }
                    if (latestVerifiedAt != null) {
                        response.setVerifiedAt(latestVerifiedAt.toString());
                    }
                } else if (anyUnderReview) {
                    response.setStatus("UNDER_REVIEW");
                    logger.info("Status set to UNDER_REVIEW for userId: {}", userId);
                } else {
                    response.setStatus("PENDING");
                    logger.info("Status set to PENDING for userId: {}", userId);
                }
            }
        }
        
        // Set submittedAt (earliest submission)
        LocalDateTime earliestSubmitted = null;
        if (aadhaar.isPresent() && aadhaar.get().getSubmittedAt() != null) {
            earliestSubmitted = aadhaar.get().getSubmittedAt();
        }
        if (pan.isPresent() && pan.get().getSubmittedAt() != null) {
            if (earliestSubmitted == null || pan.get().getSubmittedAt().isBefore(earliestSubmitted)) {
                earliestSubmitted = pan.get().getSubmittedAt();
            }
        }
        if (selfie.isPresent() && selfie.get().getSubmittedAt() != null) {
            if (earliestSubmitted == null || selfie.get().getSubmittedAt().isBefore(earliestSubmitted)) {
                earliestSubmitted = selfie.get().getSubmittedAt();
            }
        }
        if (earliestSubmitted != null) {
            response.setSubmittedAt(earliestSubmitted.toString());
        }
        
        logger.info("Aggregated KYC status for userId {}: {}", userId, response.getStatus());
        return response;
    }
    
    // Old getPendingKYC, getKYCById, approveKYC, rejectKYC methods removed
    // Use approve/reject methods for separate collections (Aadhaar, PAN, Selfie) instead
    
    /**
     * Submit Aadhaar documents to separate collection
     */
    public AadhaarDocument submitAadhaar(String userId, String userRole, 
                                         MultipartFile frontImage, 
                                         MultipartFile backImage,
                                         String aadhaarNumber,
                                         boolean isOtpVerified) throws IOException {
        logger.info("Aadhaar document submission started for userId: {}", userId);
        
        Optional<AadhaarDocument> existing = aadhaarDocumentRepository.findByUserId(userId);
        AadhaarDocument aadhaar;
        
        if (existing.isPresent()) {
            logger.info("Updating existing Aadhaar for userId: {}", userId);
            aadhaar = existing.get();
            aadhaar.setStatus(AadhaarDocument.VerificationStatus.PENDING);
        } else {
            logger.info("New Aadhaar submission for userId: {}", userId);
            aadhaar = new AadhaarDocument();
            aadhaar.setStatus(AadhaarDocument.VerificationStatus.PENDING);
            aadhaar.setSubmittedAt(LocalDateTime.now());
        }
        
        aadhaar.setUserId(userId);
        aadhaar.setUserRole(userRole);
        aadhaar.setAadhaarNumber(aadhaarNumber);
        aadhaar.setOtpVerified(isOtpVerified);
        
        if (frontImage != null && !frontImage.isEmpty()) {
            String frontUrl = saveFile(frontImage, userId, "aadhaar_front");
            aadhaar.setFrontImageUrl(frontUrl);
        }
        
        if (backImage != null && !backImage.isEmpty()) {
            String backUrl = saveFile(backImage, userId, "aadhaar_back");
            aadhaar.setBackImageUrl(backUrl);
        }
        
        aadhaar.setUpdatedAt(LocalDateTime.now());
        
        AadhaarDocument saved = aadhaarDocumentRepository.save(aadhaar);
        logger.info("Aadhaar document saved successfully for userId: {}", userId);
        
        return saved;
    }
    
    /**
     * Submit PAN document to separate collection
     */
    public PANDocument submitPAN(String userId, String userRole, 
                                  MultipartFile panImage, 
                                  String panNumber) throws IOException {
        logger.info("PAN document submission started for userId: {}", userId);
        
        Optional<PANDocument> existing = panDocumentRepository.findByUserId(userId);
        PANDocument pan;
        
        if (existing.isPresent()) {
            logger.info("Updating existing PAN for userId: {}", userId);
            pan = existing.get();
            pan.setStatus(PANDocument.VerificationStatus.PENDING);
        } else {
            logger.info("New PAN submission for userId: {}", userId);
            pan = new PANDocument();
            pan.setStatus(PANDocument.VerificationStatus.PENDING);
            pan.setSubmittedAt(LocalDateTime.now());
        }
        
        pan.setUserId(userId);
        pan.setUserRole(userRole);
        pan.setPanNumber(panNumber);
        
        if (panImage != null && !panImage.isEmpty()) {
            String panUrl = saveFile(panImage, userId, "pan");
            pan.setPanImageUrl(panUrl);
        }
        
        pan.setUpdatedAt(LocalDateTime.now());
        
        PANDocument saved = panDocumentRepository.save(pan);
        logger.info("PAN document saved successfully for userId: {}", userId);
        
        return saved;
    }
    
    /**
     * Submit Selfie document to separate collection
     */
    public SelfieDocument submitSelfie(String userId, String userRole, 
                                       MultipartFile selfieImage, 
                                       String captureMethod) throws IOException {
        logger.info("Selfie document submission started for userId: {}", userId);
        
        Optional<SelfieDocument> existing = selfieDocumentRepository.findByUserId(userId);
        SelfieDocument selfie;
        
        if (existing.isPresent()) {
            logger.info("Updating existing Selfie for userId: {}", userId);
            selfie = existing.get();
            selfie.setStatus(SelfieDocument.VerificationStatus.PENDING);
        } else {
            logger.info("New Selfie submission for userId: {}", userId);
            selfie = new SelfieDocument();
            selfie.setStatus(SelfieDocument.VerificationStatus.PENDING);
            selfie.setSubmittedAt(LocalDateTime.now());
        }
        
        selfie.setUserId(userId);
        selfie.setUserRole(userRole);
        selfie.setCaptureMethod(captureMethod);
        
        if (selfieImage != null && !selfieImage.isEmpty()) {
            String selfieUrl = saveFile(selfieImage, userId, "selfie");
            selfie.setSelfieImageUrl(selfieUrl);
        }
        
        selfie.setUpdatedAt(LocalDateTime.now());
        
        SelfieDocument saved = selfieDocumentRepository.save(selfie);
        logger.info("Selfie document saved successfully for userId: {}", userId);
        
        return saved;
    }
    
    /**
     * Get Aadhaar document by userId
     */
    public Optional<AadhaarDocument> getAadhaarByUserId(String userId) {
        return aadhaarDocumentRepository.findByUserId(userId);
    }
    
    /**
     * Get PAN document by userId
     */
    public Optional<PANDocument> getPANByUserId(String userId) {
        return panDocumentRepository.findByUserId(userId);
    }
    
    /**
     * Get Selfie document by userId
     */
    public Optional<SelfieDocument> getSelfieByUserId(String userId) {
        return selfieDocumentRepository.findByUserId(userId);
    }
    
    /**
     * Approve Aadhaar document
     */
    public AadhaarDocument approveAadhaar(String documentId, String adminUserId) {
        logger.info("Approving Aadhaar document: {} by admin: {}", documentId, adminUserId);
        
        AadhaarDocument document = aadhaarDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Aadhaar document not found: " + documentId));
        
        document.setStatus(AadhaarDocument.VerificationStatus.VERIFIED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(null);
        document.setUpdatedAt(LocalDateTime.now());
        
        AadhaarDocument saved = aadhaarDocumentRepository.save(document);
        
        // Update user verification status if all documents are verified
        updateUserVerificationStatus(document.getUserId());
        
        logger.info("Aadhaar document approved successfully: {}", documentId);
        return saved;
    }
    
    /**
     * Reject Aadhaar document
     */
    public AadhaarDocument rejectAadhaar(String documentId, String adminUserId, String rejectionReason) {
        logger.info("Rejecting Aadhaar document: {} by admin: {}", documentId, adminUserId);
        
        AadhaarDocument document = aadhaarDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Aadhaar document not found: " + documentId));
        
        document.setStatus(AadhaarDocument.VerificationStatus.REJECTED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(rejectionReason);
        document.setUpdatedAt(LocalDateTime.now());
        
        AadhaarDocument saved = aadhaarDocumentRepository.save(document);
        
        logger.info("Aadhaar document rejected: {}", documentId);
        return saved;
    }
    
    /**
     * Approve PAN document
     */
    public PANDocument approvePAN(String documentId, String adminUserId) {
        logger.info("Approving PAN document: {} by admin: {}", documentId, adminUserId);
        
        PANDocument document = panDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("PAN document not found: " + documentId));
        
        document.setStatus(PANDocument.VerificationStatus.VERIFIED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(null);
        document.setUpdatedAt(LocalDateTime.now());
        
        PANDocument saved = panDocumentRepository.save(document);
        
        // Update user verification status if all documents are verified
        updateUserVerificationStatus(document.getUserId());
        
        logger.info("PAN document approved successfully: {}", documentId);
        return saved;
    }
    
    /**
     * Reject PAN document
     */
    public PANDocument rejectPAN(String documentId, String adminUserId, String rejectionReason) {
        logger.info("Rejecting PAN document: {} by admin: {}", documentId, adminUserId);
        
        PANDocument document = panDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("PAN document not found: " + documentId));
        
        document.setStatus(PANDocument.VerificationStatus.REJECTED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(rejectionReason);
        document.setUpdatedAt(LocalDateTime.now());
        
        PANDocument saved = panDocumentRepository.save(document);
        
        logger.info("PAN document rejected: {}", documentId);
        return saved;
    }
    
    /**
     * Approve Selfie document
     */
    public SelfieDocument approveSelfie(String documentId, String adminUserId) {
        logger.info("Approving Selfie document: {} by admin: {}", documentId, adminUserId);
        
        SelfieDocument document = selfieDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Selfie document not found: " + documentId));
        
        document.setStatus(SelfieDocument.VerificationStatus.VERIFIED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(null);
        document.setUpdatedAt(LocalDateTime.now());
        
        SelfieDocument saved = selfieDocumentRepository.save(document);
        
        // Update user verification status if all documents are verified
        updateUserVerificationStatus(document.getUserId());
        
        logger.info("Selfie document approved successfully: {}", documentId);
        return saved;
    }
    
    /**
     * Reject Selfie document
     */
    public SelfieDocument rejectSelfie(String documentId, String adminUserId, String rejectionReason) {
        logger.info("Rejecting Selfie document: {} by admin: {}", documentId, adminUserId);
        
        SelfieDocument document = selfieDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Selfie document not found: " + documentId));
        
        document.setStatus(SelfieDocument.VerificationStatus.REJECTED);
        document.setVerifiedBy(adminUserId);
        document.setVerifiedAt(LocalDateTime.now());
        document.setRejectionReason(rejectionReason);
        document.setUpdatedAt(LocalDateTime.now());
        
        SelfieDocument saved = selfieDocumentRepository.save(document);
        
        logger.info("Selfie document rejected: {}", documentId);
        return saved;
    }
    
    /**
     * Update user verification status if all documents are verified
     */
    private void updateUserVerificationStatus(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            logger.warn("User not found for verification status update: {}", userId);
            return;
        }
        
        User user = userOpt.get();
        
        // Check if all submitted documents are verified
        Optional<AadhaarDocument> aadhaar = aadhaarDocumentRepository.findByUserId(userId);
        Optional<PANDocument> pan = panDocumentRepository.findByUserId(userId);
        Optional<SelfieDocument> selfie = selfieDocumentRepository.findByUserId(userId);
        
        boolean allVerified = true;
        
        if (aadhaar.isPresent() && aadhaar.get().getStatus() != AadhaarDocument.VerificationStatus.VERIFIED) {
            allVerified = false;
        }
        if (pan.isPresent() && pan.get().getStatus() != PANDocument.VerificationStatus.VERIFIED) {
            allVerified = false;
        }
        if (selfie.isPresent() && selfie.get().getStatus() != SelfieDocument.VerificationStatus.VERIFIED) {
            allVerified = false;
        }
        
        // If all submitted documents are verified, mark user as verified
        if (allVerified && (aadhaar.isPresent() || pan.isPresent() || selfie.isPresent())) {
            user.setVerified(true);
            userRepository.save(user);
            logger.info("User {} marked as verified - all documents approved", userId);
        } else {
            user.setVerified(false);
            userRepository.save(user);
            logger.debug("User {} verification status updated - not all documents verified", userId);
        }
    }
    
    /**
     * Generate PDF or ZIP file with all KYC documents
     */
    public ResponseEntity<?> generateKYCPDF(String userId, 
                                           Optional<AadhaarDocument> aadhaar,
                                           Optional<PANDocument> pan,
                                           Optional<SelfieDocument> selfie) {
        try {
            logger.info("Generating KYC document package for userId: {}", userId);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);
            
            // Add Aadhaar documents
            if (aadhaar.isPresent()) {
                AadhaarDocument aadhaarDoc = aadhaar.get();
                if (aadhaarDoc.getFrontImageUrl() != null) {
                    addFileToZip(zos, aadhaarDoc.getFrontImageUrl(), "Aadhaar_Front.jpg");
                }
                if (aadhaarDoc.getBackImageUrl() != null) {
                    addFileToZip(zos, aadhaarDoc.getBackImageUrl(), "Aadhaar_Back.jpg");
                }
            }
            
            // Add PAN document
            if (pan.isPresent()) {
                PANDocument panDoc = pan.get();
                if (panDoc.getPanImageUrl() != null) {
                    addFileToZip(zos, panDoc.getPanImageUrl(), "PAN.jpg");
                }
            }
            
            // Add Selfie document
            if (selfie.isPresent()) {
                SelfieDocument selfieDoc = selfie.get();
                if (selfieDoc.getSelfieImageUrl() != null) {
                    addFileToZip(zos, selfieDoc.getSelfieImageUrl(), "Selfie.jpg");
                }
            }
            
            zos.close();
            baos.close();
            
            byte[] zipBytes = baos.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "KYC_Documents_" + userId + ".zip");
            headers.setContentLength(zipBytes.length);
            
            logger.info("KYC document package generated successfully for userId: {}", userId);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(zipBytes);
                    
        } catch (Exception e) {
            logger.error("Error generating KYC document package for userId: {}", userId, e);
            throw new RuntimeException("Error generating KYC package: " + e.getMessage(), e);
        }
    }
    
    /**
     * Add file to ZIP archive
     */
    private void addFileToZip(ZipOutputStream zos, String filePath, String entryName) throws IOException {
        try {
            // Remove leading slash if present
            String cleanPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
            File file = new File(cleanPath);
            
            if (file.exists() && file.isFile()) {
                ZipEntry entry = new ZipEntry(entryName);
                zos.putNextEntry(entry);
                Files.copy(file.toPath(), zos);
                zos.closeEntry();
                logger.debug("Added file to ZIP: {}", entryName);
            } else {
                logger.warn("File not found: {}", cleanPath);
            }
        } catch (Exception e) {
            logger.error("Error adding file to ZIP: {}", filePath, e);
        }
    }
    
    /**
     * Download individual image file
     */
    public ResponseEntity<?> downloadImage(String imagePath) {
        try {
            logger.info("Attempting to serve image: {}", imagePath);
            
            // Handle different path formats
            String cleanPath = imagePath;
            if (cleanPath.startsWith("/")) {
                cleanPath = cleanPath.substring(1);
            }
            
            // Try multiple path locations
            File file = new File(cleanPath);
            
            // If not found, try with uploads/kyc prefix
            if (!file.exists()) {
                String altPath = "uploads/kyc/" + cleanPath.replace("uploads/kyc/", "");
                file = new File(altPath);
                logger.debug("Trying alternative path: {}", altPath);
            }
            
            // If still not found, try absolute path from project root
            if (!file.exists()) {
                String projectRoot = System.getProperty("user.dir");
                String fullPath = projectRoot + "/" + cleanPath;
                file = new File(fullPath);
                logger.debug("Trying full path: {}", fullPath);
            }
            
            // If still not found, try with just the filename from the path
            if (!file.exists() && cleanPath.contains("/")) {
                String filename = cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
                file = new File("uploads/kyc/" + filename);
                logger.debug("Trying filename only: {}", "uploads/kyc/" + filename);
            }
            
            if (!file.exists() || !file.isFile()) {
                logger.warn("Image file not found after all attempts. Original path: {}", imagePath);
                logger.warn("Tried paths: {}, {}, {}", cleanPath, "uploads/kyc/" + cleanPath.replace("uploads/kyc/", ""), "uploads/kyc/" + (cleanPath.contains("/") ? cleanPath.substring(cleanPath.lastIndexOf("/") + 1) : cleanPath));
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(file);
            
            String contentType = "application/octet-stream";
            String fileName = file.getName().toLowerCase();
            if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (fileName.endsWith(".png")) {
                contentType = "image/png";
            } else if (fileName.endsWith(".pdf")) {
                contentType = "application/pdf";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            // For inline display, use inline instead of attachment
            headers.setContentDispositionFormData("inline", file.getName());
            headers.setContentLength(file.length());
            headers.setCacheControl("public, max-age=3600");
            
            logger.info("Successfully serving image file: {}", file.getAbsolutePath());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error serving image file: {}", imagePath, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Serve image file (for inline display or download)
     */
    public ResponseEntity<?> serveImage(String imagePath, boolean inline) {
        try {
            logger.info("Attempting to serve image (inline={}): {}", inline, imagePath);
            
            // Handle different path formats - remove leading slash
            String cleanPath = imagePath;
            if (cleanPath.startsWith("/")) {
                cleanPath = cleanPath.substring(1);
            }
            
            logger.debug("Cleaned path: {}", cleanPath);
            
            // Try the path as-is first (relative to project root)
            File file = new File(cleanPath);
            logger.debug("Trying path: {} - exists: {}", file.getAbsolutePath(), file.exists());
            
            // If not found, try with project root
            if (!file.exists()) {
                String projectRoot = System.getProperty("user.dir");
                String fullPath = projectRoot + File.separator + cleanPath.replace("/", File.separator);
                file = new File(fullPath);
                logger.debug("Trying full path: {} - exists: {}", fullPath, file.exists());
            }
            
            // If still not found, try just the filename in uploads/kyc
            if (!file.exists() && cleanPath.contains("/")) {
                String filename = cleanPath.substring(cleanPath.lastIndexOf("/") + 1);
                String altPath = "uploads/kyc" + File.separator + filename;
                file = new File(altPath);
                logger.debug("Trying filename in uploads/kyc: {} - exists: {}", altPath, file.exists());
            }
            
            // If still not found, try absolute path with uploads/kyc
            if (!file.exists()) {
                String projectRoot = System.getProperty("user.dir");
                String filename = cleanPath.contains("/") ? cleanPath.substring(cleanPath.lastIndexOf("/") + 1) : cleanPath;
                String fullPath = projectRoot + File.separator + "uploads" + File.separator + "kyc" + File.separator + filename;
                file = new File(fullPath);
                logger.debug("Trying absolute uploads/kyc path: {} - exists: {}", fullPath, file.exists());
            }
            
            if (!file.exists() || !file.isFile()) {
                logger.error("Image file not found after all attempts. Original path: {}", imagePath);
                logger.error("Current working directory: {}", System.getProperty("user.dir"));
                logger.error("Tried paths:");
                logger.error("  1. {}", cleanPath);
                logger.error("  2. {}", System.getProperty("user.dir") + File.separator + cleanPath.replace("/", File.separator));
                if (cleanPath.contains("/")) {
                    logger.error("  3. uploads/kyc/{}", cleanPath.substring(cleanPath.lastIndexOf("/") + 1));
                }
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(file);
            
            String contentType = "application/octet-stream";
            String fileName = file.getName().toLowerCase();
            if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (fileName.endsWith(".png")) {
                contentType = "image/png";
            } else if (fileName.endsWith(".pdf")) {
                contentType = "application/pdf";
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            // Use inline for display, attachment for download
            if (inline) {
                headers.setContentDispositionFormData("inline", file.getName());
            } else {
                headers.setContentDispositionFormData("attachment", file.getName());
            }
            headers.setContentLength(file.length());
            headers.setCacheControl("public, max-age=3600");
            
            logger.info("Successfully serving image file (inline={}): {}", inline, file.getAbsolutePath());
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error serving image file: {}", imagePath, e);
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
