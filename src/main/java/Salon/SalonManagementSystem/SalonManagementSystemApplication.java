package Salon.SalonManagementSystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SalonManagementSystemApplication {

	public static void main(String[] args) {
		// The salon runs on Sri Lankan time wherever the server is hosted, so stored times read the same
		// on a laptop and on a UTC cloud host. Override with the APP_TIMEZONE environment variable.
		String zone = System.getenv().getOrDefault("APP_TIMEZONE", "Asia/Colombo");
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone(zone));
		SpringApplication.run(SalonManagementSystemApplication.class, args);
	}

}
