package com.bihar.seva;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootApplication
@EnableMongoAuditing
public class BiharSevaApplication implements CommandLineRunner {

	@Autowired
	private MongoTemplate mongoTemplate;

	public static void main(String[] args) {
		SpringApplication.run(BiharSevaApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		// Fix for duplicate OTP index issues
		try {
			if (mongoTemplate.collectionExists("otps")) {
				// Drop the entire collection to remove all problematic indexes
				mongoTemplate.dropCollection("otps");
				System.out.println("Dropped otps collection to fix index conflicts. It will be recreated on first OTP request.");
			}
		} catch (Exception e) {
			System.out.println("Could not fix OTP collection: " + e.getMessage());
		}
	}

}
