package com.bihar.seva.controller;

import com.bihar.seva.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class FileController {
    
    private final FileUploadService fileUploadService;
    
    /**
     * Serve uploaded files (images, documents, etc.)
     */
    @GetMapping("/**")
    public ResponseEntity<byte[]> getFile(@RequestParam String path) {
        try {
            byte[] fileData = fileUploadService.getFile(path);
            
            // Determine content type based on file extension
            String contentType = determineContentType(path);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileData.length);
            headers.setCacheControl("public, max-age=31536000"); // Cache for 1 year
            
            return new ResponseEntity<>(fileData, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error serving file: {}", path, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Serve file by path (alternative endpoint)
     */
    @GetMapping("/serve")
    public ResponseEntity<byte[]> serveFile(@RequestParam String filePath) {
        try {
            // URL decode the file path in case it's encoded
            String decodedPath = java.net.URLDecoder.decode(filePath, "UTF-8");
            
            // Normalize path separators (handle both / and \)
            String normalizedPath = decodedPath.replace("\\", "/");
            
            log.debug("Serving file - Original: {}, Decoded: {}, Normalized: {}", filePath, decodedPath, normalizedPath);
            
            byte[] fileData = fileUploadService.getFile(normalizedPath);
            
            String contentType = determineContentType(normalizedPath);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileData.length);
            headers.setCacheControl("public, max-age=31536000");
            
            return new ResponseEntity<>(fileData, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error serving file: {}", filePath, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * Determine content type based on file extension
     */
    private String determineContentType(String filePath) {
        if (filePath == null) {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
        
        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG_VALUE;
        } else if (lowerPath.endsWith(".png")) {
            return MediaType.IMAGE_PNG_VALUE;
        } else if (lowerPath.endsWith(".gif")) {
            return MediaType.IMAGE_GIF_VALUE;
        } else if (lowerPath.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF_VALUE;
        } else {
            return MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }
    }
}

