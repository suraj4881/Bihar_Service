package com.bihar.seva.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/otp/**").permitAll()
                .antMatchers("/api/simple-otp/**").permitAll()
                .antMatchers("/api/services/**").permitAll()
                .antMatchers("/api/service-categories/**").permitAll()
                .antMatchers("/api/providers/search/**").permitAll()
                .antMatchers("/api/users/**").permitAll()
                .antMatchers("/api/providers/**").permitAll()
                .antMatchers("/api/bookings/**").permitAll()
                .antMatchers("/api/kyc/**").permitAll()
                .antMatchers("/uploads/**").permitAll()
                .anyRequest().permitAll()
            .and()
            .httpBasic().disable()
            .formLogin().disable();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins}") String allowedOrigins) {
    
        CorsConfiguration configuration = new CorsConfiguration();
    
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList());
    
        origins.add("https://www.biharbazzar.in");
    
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
    
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
    
        return source;
    }
}
