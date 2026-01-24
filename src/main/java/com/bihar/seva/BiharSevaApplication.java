package com.bihar.seva;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootApplication
@EnableMongoAuditing
public class BiharSevaApplication implements CommandLineRunner {

	private static final Logger logger = LoggerFactory.getLogger(BiharSevaApplication.class);

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
				mongoTemplate.dropCollection("otps");
				logger.info("Dropped otps collection to fix index conflicts. It will be recreated on first OTP request.");
			}
		} catch (Exception e) {
			logger.error("Could not fix OTP collection", e);
		}
		
		// Note: Service text index fix is handled in MongoIndexFixer component
	}

}
