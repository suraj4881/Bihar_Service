package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.SupportTicketRequest;
import com.bihar.seva.dto.SupportMessageRequest;
import com.bihar.seva.dto.SupportTicketStatusUpdateRequest;
import com.bihar.seva.model.SupportMessage;
import com.bihar.seva.model.SupportTicket;
import com.bihar.seva.repositories.SupportMessageRepository;
import com.bihar.seva.repositories.SupportTicketRepository;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class SupportController {

    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final SimpMessagingTemplate messagingTemplate;

    private List<SupportTicket> attachMessages(List<SupportTicket> tickets) {
        if (tickets == null || tickets.isEmpty()) {
            return tickets;
        }
        List<String> ticketIds = tickets.stream().map(SupportTicket::getId).collect(Collectors.toList());
        List<SupportMessage> allMessages = supportMessageRepository.findByTicketIdInOrderByCreatedAtAsc(ticketIds);
        Map<String, List<SupportMessage>> grouped = new HashMap<>();
        for (SupportMessage message : allMessages) {
            grouped.computeIfAbsent(message.getTicketId(), k -> new ArrayList<>()).add(message);
        }
        for (SupportTicket ticket : tickets) {
            ticket.setMessages(grouped.getOrDefault(ticket.getId(), new ArrayList<>()));
        }
        return tickets;
    }

    private SupportTicket attachMessages(SupportTicket ticket) {
        if (ticket == null || ticket.getId() == null) {
            return ticket;
        }
        List<SupportMessage> messages = supportMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        ticket.setMessages(messages);
        return ticket;
    }

    @PostMapping(value = "/tickets", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> createTicket(@RequestBody SupportTicketRequest request) {
        try {
            if (request.getUserId() == null || request.getUserId().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "User ID is required", null));
            }
            if (request.getCategory() == null || request.getCategory().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Category is required", null));
            }
            if (request.getSubject() == null || request.getSubject().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Subject is required", null));
            }
            if (request.getDescription() == null || request.getDescription().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Description is required", null));
            }

            List<SupportTicket> existingTickets = supportTicketRepository.findByUserIdOrderByCreatedAtDesc(request.getUserId());
            Optional<SupportTicket> openTicket = existingTickets.stream()
                .filter(ticket -> ticket.getStatus() != null && !"CLOSED".equals(ticket.getStatus()))
                .findFirst();
            if (openTicket.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "An active ticket already exists. Please wait until it is closed.", null));
            }

            SupportTicket ticket = new SupportTicket();
            ticket.setUserId(request.getUserId());
            ticket.setUserRole(request.getUserRole());
            ticket.setBookingId(request.getBookingId());
            ticket.setServiceId(request.getServiceId());
            ticket.setCategory(request.getCategory());
            ticket.setSubject(request.getSubject());
            ticket.setDescription(request.getDescription());
            ticket.setPriority(request.getPriority() != null ? request.getPriority() : "NORMAL");
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());

            SupportMessage initialMessage = new SupportMessage();
            initialMessage.setSenderRole(request.getUserRole());
            initialMessage.setSenderName(request.getUserName());
            initialMessage.setMessage(request.getDescription());
            initialMessage.setCreatedAt(LocalDateTime.now());
            List<SupportMessage> messages = new ArrayList<>();
            messages.add(initialMessage);
            ticket.setMessages(messages);

            userRepository.findById(request.getUserId()).ifPresent(user -> {
                ticket.setUserName(user.getName());
                ticket.setUserPhone(user.getPhone());
            });

            if (ticket.getUserName() == null) {
                ticket.setUserName(request.getUserName());
            }
            if (ticket.getUserPhone() == null) {
                ticket.setUserPhone(request.getUserPhone());
            }

            SupportTicket saved = supportTicketRepository.save(ticket);
            initialMessage.setTicketId(saved.getId());
            SupportMessage savedMessage = supportMessageRepository.save(initialMessage);
            messagingTemplate.convertAndSend("/topic/support/" + saved.getId(), savedMessage);
            return ResponseEntity.ok(new ApiResponse(true, "Support ticket created", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error creating support ticket: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PostMapping(value = "/tickets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse> createTicketMultipart(
            @RequestParam String userId,
            @RequestParam(required = false) String userRole,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String userPhone,
            @RequestParam(required = false) String bookingId,
            @RequestParam(required = false) String serviceId,
            @RequestParam String category,
            @RequestParam String subject,
            @RequestParam String description,
            @RequestParam(required = false) String priority,
            @RequestPart(required = false) MultipartFile[] attachments) {
        try {
            if (userId.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "User ID is required", null));
            }
            if (category.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Category is required", null));
            }
            if (subject.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Subject is required", null));
            }
            if (description.isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Description is required", null));
            }

            List<SupportTicket> existingTickets = supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
            Optional<SupportTicket> openTicket = existingTickets.stream()
                .filter(ticket -> ticket.getStatus() != null && !"CLOSED".equals(ticket.getStatus()))
                .findFirst();
            if (openTicket.isPresent()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "An active ticket already exists. Please wait until it is closed.", null));
            }

            SupportTicket ticket = new SupportTicket();
            ticket.setUserId(userId);
            ticket.setUserRole(userRole);
            ticket.setBookingId(bookingId);
            ticket.setServiceId(serviceId);
            ticket.setCategory(category);
            ticket.setSubject(subject);
            ticket.setDescription(description);
            ticket.setPriority(priority != null ? priority : "NORMAL");
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());

            SupportMessage initialMessage = new SupportMessage();
            initialMessage.setSenderRole(userRole);
            initialMessage.setSenderName(userName);
            initialMessage.setMessage(description);
            initialMessage.setCreatedAt(LocalDateTime.now());
            List<SupportMessage> messages = new ArrayList<>();
            messages.add(initialMessage);
            ticket.setMessages(messages);

            userRepository.findById(userId).ifPresent(user -> {
                ticket.setUserName(user.getName());
                ticket.setUserPhone(user.getPhone());
            });

            if (ticket.getUserName() == null) {
                ticket.setUserName(userName);
            }
            if (ticket.getUserPhone() == null) {
                ticket.setUserPhone(userPhone);
            }

            if (attachments != null && attachments.length > 0) {
                List<String> attachmentPaths = new ArrayList<>();
                for (MultipartFile file : attachments) {
                    if (file == null || file.isEmpty()) {
                        continue;
                    }
                    String storedPath = fileUploadService.uploadFile(file, "support");
                    attachmentPaths.add(storedPath);
                }
                ticket.setAttachments(attachmentPaths);
            }

            SupportTicket saved = supportTicketRepository.save(ticket);
            initialMessage.setTicketId(saved.getId());
            SupportMessage savedMessage = supportMessageRepository.save(initialMessage);
            messagingTemplate.convertAndSend("/topic/support/" + saved.getId(), savedMessage);
            return ResponseEntity.ok(new ApiResponse(true, "Support ticket created", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error creating support ticket: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/tickets")
    public ResponseEntity<ApiResponse> getAllTickets(@RequestParam(required = false) String status) {
        try {
            List<SupportTicket> tickets = status != null
                ? supportTicketRepository.findByStatusOrderByCreatedAtDesc(status)
                : supportTicketRepository.findAll();
            return ResponseEntity.ok(new ApiResponse(true, "Support tickets retrieved", attachMessages(tickets)));
        } catch (Exception e) {
            log.error("Error fetching support tickets: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @GetMapping("/tickets/user/{userId}")
    public ResponseEntity<ApiResponse> getTicketsByUser(@PathVariable String userId) {
        try {
            List<SupportTicket> tickets = supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(new ApiResponse(true, "User support tickets retrieved", attachMessages(tickets)));
        } catch (Exception e) {
            log.error("Error fetching user support tickets: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<ApiResponse> updateTicketStatus(
            @PathVariable String id,
            @RequestBody SupportTicketStatusUpdateRequest request) {
        try {
            SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
            if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                ticket.setStatus(request.getStatus());
            }
            if (request.getResolutionNote() != null) {
                ticket.setResolutionNote(request.getResolutionNote());
            }
            ticket.setUpdatedAt(LocalDateTime.now());
            SupportTicket saved = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(new ApiResponse(true, "Ticket updated", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error updating ticket status: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/tickets/{id}/assign")
    public ResponseEntity<ApiResponse> assignTicket(
            @PathVariable String id,
            @RequestParam String assignee) {
        try {
            SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
            ticket.setAssignedTo(assignee);
            ticket.setUpdatedAt(LocalDateTime.now());
            SupportTicket saved = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(new ApiResponse(true, "Ticket assigned", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error assigning ticket: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PostMapping("/tickets/{id}/messages")
    public ResponseEntity<ApiResponse> addMessage(
            @PathVariable String id,
            @RequestBody SupportMessageRequest request) {
        try {
            if (request.getMessage() == null || request.getMessage().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Message is required", null));
            }
            SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
            if ("CLOSED".equals(ticket.getStatus())) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Ticket is closed. Please open a new ticket.", null));
            }

            SupportMessage message = new SupportMessage();
            message.setSenderRole(request.getSenderRole());
            message.setSenderName(request.getSenderName());
            message.setMessage(request.getMessage());
            message.setCreatedAt(LocalDateTime.now());
            message.setTicketId(ticket.getId());
            SupportMessage savedMessage = supportMessageRepository.save(message);
            messagingTemplate.convertAndSend("/topic/support/" + ticket.getId(), savedMessage);
            if ("OPEN".equals(ticket.getStatus()) && "SUPPORT".equalsIgnoreCase(request.getSenderRole())) {
                ticket.setStatus("IN_PROGRESS");
            }
            ticket.setUpdatedAt(LocalDateTime.now());
            SupportTicket saved = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(new ApiResponse(true, "Message added", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error adding message: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }

    @PutMapping("/tickets/{id}/close")
    public ResponseEntity<ApiResponse> closeTicket(@PathVariable String id) {
        try {
            SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
            ticket.setStatus("CLOSED");
            ticket.setUpdatedAt(LocalDateTime.now());
            SupportTicket saved = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(new ApiResponse(true, "Ticket closed", attachMessages(saved)));
        } catch (Exception e) {
            log.error("Error closing ticket: ", e);
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage(), null));
        }
    }
}
