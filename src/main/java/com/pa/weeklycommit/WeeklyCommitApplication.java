package com.pa.weeklycommit;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(
        title = "Weekly Commit Module API",
        version = "0.1.0",
        description = "REST API for RCDO-linked weekly planning, commit lifecycle, and manager dashboards"
))
public class WeeklyCommitApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeeklyCommitApplication.class, args);
    }
}
