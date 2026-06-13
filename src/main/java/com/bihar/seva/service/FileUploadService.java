package com.bihar.seva.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Service
public class FileUploadService {
    
    private static final String UPLOAD_DIR = "uploads/";
    private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"};
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    public String uploadFile(MultipartFile file, String subDirectory) throws IOException {
        // Validate file
        validateFile(file);
        
        // Create upload directory
        Path uploadPath = Paths.get(UPLOAD_DIR + subDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String filename = UUID.randomUUID().toString() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);
        
        // Normalize path to use forward slashes for URLs (works on all platforms)
        String normalizedPath = filePath.toString().replace("\\", "/");
        return normalizedPath;
    }
    
    public String uploadBase64Image(String base64Image, String subDirectory, String filename) throws IOException {
        // Remove data URL prefix if present
        if (base64Image.startsWith("data:image")) {
            base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
        }
        
        // Decode base64 image
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        
        // Create upload directory
        Path uploadPath = Paths.get(UPLOAD_DIR + subDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename if not provided
        if (filename == null || filename.isEmpty()) {
            filename = UUID.randomUUID().toString() + ".jpg";
        }
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.write(filePath, imageBytes);
        
        // Normalize path to use forward slashes for URLs (works on all platforms)
        String normalizedPath = filePath.toString().replace("\\", "/");
        return normalizedPath;
    }
    
    public byte[] getFile(String filePath) throws IOException {
        // Normalize path - handle both forward and backslashes
        // Paths.get() handles both, but we need to ensure consistency
        String normalizedPath = filePath.replace("\\", "/");
        Path path = Paths.get(normalizedPath);
        
        if (!Files.exists(path)) {
            // Try with original path format (Windows backslashes)
            Path altPath = Paths.get(filePath);
            if (Files.exists(altPath)) {
                return Files.readAllBytes(altPath);
            }
            throw new IOException("File not found: " + filePath);
        }
        return Files.readAllBytes(path);
    }
    
    public boolean deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            return false;
        }
    }
    
    private void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IOException("File size exceeds maximum allowed size of 10MB");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IOException("File name is null");
        }
        
        String extension = getFileExtension(originalFilename).toLowerCase();
        boolean isAllowed = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (extension.equals(allowedExt)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            throw new IOException("File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }
}
