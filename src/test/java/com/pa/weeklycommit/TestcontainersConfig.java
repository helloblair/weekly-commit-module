package com.pa.weeklycommit;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for integration tests.
 *
 * Tries to start a Testcontainers PostgreSQL container. If Docker is not
 * available (e.g. Docker Desktop 4.63+ proxy incompatibility), falls back
 * to the local datasource configured in src/test/resources/application.yml
 * (localhost:5432/weekly_commit_test).
 */
public abstract class TestcontainersConfig {

    private static final PostgreSQLContainer<?> POSTGRES;
    private static final boolean DOCKER_AVAILABLE;

    static {
        PostgreSQLContainer<?> container = null;
        boolean available = false;
        try {
            container = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));
            container.start();
            available = true;
        } catch (Exception e) {
            // Docker not available — fall back to local Postgres via application.yml
        }
        POSTGRES = container;
        DOCKER_AVAILABLE = available;
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (DOCKER_AVAILABLE) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
        }
        // Otherwise: application.yml datasource is used as-is
    }
}
