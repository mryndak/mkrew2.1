package pl.mkrew.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MkrewBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(MkrewBackendApplication.class, args);
    }
}
