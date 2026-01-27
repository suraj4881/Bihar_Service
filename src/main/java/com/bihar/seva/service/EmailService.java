package com.bihar.seva.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Send simple text email
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("❌ Error sending email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }
    
    /**
     * Send HTML email
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            log.info("✅ HTML email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("❌ Error sending HTML email to {}: {}", to, e.getMessage());
            log.error("❌ Full error stack: ", e);
            throw new RuntimeException("Failed to send HTML email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending HTML email to {}: {}", to, e.getMessage());
            log.error("❌ Full error stack: ", e);
            throw new RuntimeException("Failed to send HTML email: " + e.getMessage(), e);
        }
    }
    
    /**
     * Send OTP email with nice formatting for password reset
     */
    public void sendOTPEmail(String to, String otp) {
        String subject = "QuickSeva Bihar - Password Reset OTP";
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<style>");
        html.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        html.append(".container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }");
        html.append(".content { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }");
        html.append(".header { text-align: center; color: #FF6B35; margin-bottom: 30px; }");
        html.append(".otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0; }");
        html.append(".info { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }");
        html.append(".footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class='container'>");
        html.append("<div class='content'>");
        html.append("<div class='header'>");
        html.append("<h1>🔐 QuickSeva Bihar</h1>");
        html.append("<p>Email Verification</p>");
        html.append("</div>");
        html.append("<p>Hello!</p>");
        html.append("<p>You have requested to reset your password for QuickSeva Bihar. Your One-Time Password (OTP) is:</p>");
        html.append("<div class='otp-box'>").append(otp).append("</div>");
        html.append("<div class='info'>");
        html.append("⚠️ <strong>Important:</strong>");
        html.append("<ul>");
        html.append("<li>This OTP is valid for <strong>5 minutes</strong></li>");
        html.append("<li>Do not share this OTP with anyone</li>");
        html.append("<li>If you didn't request a password reset, please ignore this email</li>");
        html.append("</ul>");
        html.append("</div>");
        html.append("<p>Enter this OTP on the password reset page to set your new password.</p>");
        html.append("<div class='footer'>");
        html.append("<p>© 2024 QuickSeva Bihar. All rights reserved.</p>");
        html.append("<p>This is an automated email. Please do not reply.</p>");
        html.append("</div>");
        html.append("</div>");
        html.append("</div>");
        html.append("</body>");
        html.append("</html>");
        
        sendHtmlEmail(to, subject, html.toString());
    }
}
