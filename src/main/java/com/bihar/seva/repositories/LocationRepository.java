package com.bihar.seva.repositories;

import com.bihar.seva.model.Location;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface LocationRepository extends MongoRepository<Location, String> {
    List<Location> findByUserId(String userId);
    Optional<Location> findByUserIdAndLocationType(String userId, String locationType);
    List<Location> findByCity(String city);
    List<Location> findByState(String state);
}
