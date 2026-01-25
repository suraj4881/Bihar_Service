package com.bihar.seva.service;

import com.bihar.seva.dto.AnalyticsEventRequest;
import com.bihar.seva.model.AnalyticsEvent;
import com.bihar.seva.repositories.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;

    public AnalyticsEvent trackEvent(AnalyticsEventRequest request, String ip, String userAgent) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEventType(normalize(request.getEventType(), "VIEW"));
        event.setPage(Optional.ofNullable(request.getPage()).orElse("unknown"));
        event.setTarget(request.getTarget());
        event.setUserId(request.getUserId());
        event.setUserRole(request.getUserRole());
        event.setIpAddress(ip);
        event.setUserAgent(userAgent);

        String deviceType = resolveDeviceType(userAgent);
        event.setDeviceType(deviceType);
        event.setOs(resolveOs(userAgent));
        event.setBrowser(resolveBrowser(userAgent));
        event.setCreatedAt(LocalDateTime.now());

        return analyticsEventRepository.save(event);
    }

    public Map<String, Object> getSummary(int days) {
        List<AnalyticsEvent> events = getRecentDays(days);
        long views = events.stream().filter(e -> "VIEW".equalsIgnoreCase(e.getEventType())).count();
        long clicks = events.stream().filter(e -> "CLICK".equalsIgnoreCase(e.getEventType())).count();
        long calls = events.stream().filter(e -> "CALL".equalsIgnoreCase(e.getEventType())).count();
        long uniqueVisitors = events.stream()
            .map(AnalyticsEvent::getIpAddress)
            .filter(Objects::nonNull)
            .distinct()
            .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("views", views);
        summary.put("clicks", clicks);
        summary.put("calls", calls);
        summary.put("uniqueVisitors", uniqueVisitors);
        summary.put("totalEvents", events.size());
        return summary;
    }

    public List<Map<String, Object>> getTraffic(int days) {
        List<AnalyticsEvent> events = getRecentDays(days);
        Map<LocalDate, Map<String, Long>> counts = new LinkedHashMap<>();
        LocalDate startDate = LocalDate.now().minusDays(days - 1L);
        for (int i = 0; i < days; i++) {
            LocalDate date = startDate.plusDays(i);
            Map<String, Long> dayCounts = new HashMap<>();
            dayCounts.put("VIEW", 0L);
            dayCounts.put("CLICK", 0L);
            dayCounts.put("CALL", 0L);
            counts.put(date, dayCounts);
        }

        for (AnalyticsEvent event : events) {
            LocalDate eventDate = event.getCreatedAt().toLocalDate();
            if (!counts.containsKey(eventDate)) {
                continue;
            }
            Map<String, Long> dayCounts = counts.get(eventDate);
            String type = normalize(event.getEventType(), "VIEW");
            dayCounts.put(type, dayCounts.getOrDefault(type, 0L) + 1L);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        counts.forEach((date, dayCounts) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("date", date.toString());
            row.put("views", dayCounts.getOrDefault("VIEW", 0L));
            row.put("clicks", dayCounts.getOrDefault("CLICK", 0L));
            row.put("calls", dayCounts.getOrDefault("CALL", 0L));
            result.add(row);
        });
        return result;
    }

    public Map<String, Object> getDevices(int days) {
        List<AnalyticsEvent> events = getRecentDays(days);
        Map<String, Long> deviceTypes = new HashMap<>();
        Map<String, Long> os = new HashMap<>();
        Map<String, Long> browsers = new HashMap<>();

        for (AnalyticsEvent event : events) {
            deviceTypes.merge(normalize(event.getDeviceType(), "UNKNOWN"), 1L, Long::sum);
            os.merge(normalize(event.getOs(), "UNKNOWN"), 1L, Long::sum);
            browsers.merge(normalize(event.getBrowser(), "UNKNOWN"), 1L, Long::sum);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("deviceTypes", deviceTypes);
        result.put("os", os);
        result.put("browsers", browsers);
        return result;
    }

    public List<AnalyticsEvent> getRecent(int limit) {
        List<AnalyticsEvent> events = analyticsEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        if (events.size() <= limit) {
            return events;
        }
        return events.subList(0, limit);
    }

    private List<AnalyticsEvent> getRecentDays(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return analyticsEventRepository.findByCreatedAtAfter(since);
    }

    private String resolveDeviceType(String userAgent) {
        if (userAgent == null) return "UNKNOWN";
        String ua = userAgent.toLowerCase();
        if (ua.contains("ipad") || ua.contains("tablet")) return "TABLET";
        if (ua.contains("android") || ua.contains("iphone") || ua.contains("mobile")) return "MOBILE";
        return "DESKTOP";
    }

    private String resolveOs(String userAgent) {
        if (userAgent == null) return "UNKNOWN";
        String ua = userAgent.toLowerCase();
        if (ua.contains("windows")) return "WINDOWS";
        if (ua.contains("android")) return "ANDROID";
        if (ua.contains("iphone") || ua.contains("ios")) return "IOS";
        if (ua.contains("mac")) return "MAC";
        if (ua.contains("linux")) return "LINUX";
        return "OTHER";
    }

    private String resolveBrowser(String userAgent) {
        if (userAgent == null) return "UNKNOWN";
        String ua = userAgent.toLowerCase();
        if (ua.contains("edg")) return "EDGE";
        if (ua.contains("chrome")) return "CHROME";
        if (ua.contains("firefox")) return "FIREFOX";
        if (ua.contains("safari")) return "SAFARI";
        return "OTHER";
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.toUpperCase(Locale.ROOT);
    }
}
