package com.estoque.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.net.URI;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class Auth0ManagementClient {

    private static final Logger log = LoggerFactory.getLogger(Auth0ManagementClient.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final RestClient restClient = RestClient.create();
    private final String domain;
    private final String managementClientId;
    private final String managementClientSecret;
    private final String publicClientId;
    private final String databaseConnection;
    private volatile CachedToken cachedToken;

    public Auth0ManagementClient(
            @Value("${app.auth0.management.domain}") String domain,
            @Value("${app.auth0.management.client-id}") String managementClientId,
            @Value("${app.auth0.management.client-secret}") String managementClientSecret,
            @Value("${app.auth0.management.public-client-id}") String publicClientId,
            @Value("${app.auth0.management.database-connection}") String databaseConnection
    ) {
        this.domain = domain;
        this.managementClientId = managementClientId;
        this.managementClientSecret = managementClientSecret;
        this.publicClientId = publicClientId;
        this.databaseConnection = databaseConnection;
    }

    public Auth0Identity createOrFindUser(String fullName, String email) {
        ensureConfigured();

        String temporaryPassword = generateTemporaryPassword();
        Map<String, Object> payload = Map.of(
                "connection", databaseConnection,
                "email", email,
                "name", fullName,
                "password", temporaryPassword,
                "email_verified", false,
                "verify_email", false
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl("/api/v2/users"))
                    .headers(headers -> headers.setBearerAuth(getManagementToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(MAP_TYPE);

            Object userId = response != null ? response.get("user_id") : null;
            if (!(userId instanceof String subject) || subject.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Auth0 criou a conta, mas não retornou o identificador do usuário."
                );
            }
            return new Auth0Identity(subject, false);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 409) {
                return findUserByEmail(email).orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Este e-mail já possui uma conta no Auth0 que não pôde ser associada automaticamente."
                ));
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível criar a conta no Auth0. Verifique as credenciais, permissões e conexão configuradas."
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível comunicar com o Auth0 para criar a conta."
            );
        }
    }

    private Optional<Auth0Identity> findUserByEmail(String email) {
        URI uri = UriComponentsBuilder.fromUriString(apiUrl("/api/v2/users-by-email"))
                .queryParam("email", email)
                .build()
                .encode()
                .toUri();

        try {
            List<Map<String, Object>> users = restClient.get()
                    .uri(uri)
                    .headers(headers -> headers.setBearerAuth(getManagementToken()))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (users == null) return Optional.empty();

            List<Auth0Identity> matchingUsers = users.stream()
                    .filter(this::belongsToConfiguredConnection)
                    .map(user -> new Auth0Identity(
                            (String) user.get("user_id"),
                            Boolean.TRUE.equals(user.get("email_verified"))
                    ))
                    .filter(identity -> identity.subject() != null && !identity.subject().isBlank())
                    .toList();

            if (matchingUsers.size() > 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Há mais de uma conta Auth0 correspondente; a associação automática foi interrompida."
                );
            }
            return matchingUsers.stream().findFirst();
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível verificar se a conta já existe no Auth0."
            );
        }
    }

    @SuppressWarnings("unchecked")
    private boolean belongsToConfiguredConnection(Map<String, Object> user) {
        Object identities = user.get("identities");
        if (!(identities instanceof List<?> identityList)) return false;

        return identityList.stream()
                .filter(Map.class::isInstance)
                .map(identity -> (Map<String, Object>) identity)
                .anyMatch(identity -> databaseConnection.equals(identity.get("connection")));
    }

    public boolean sendPasswordSetupEmail(String email) {
        try {
            restClient.post()
                    .uri(apiUrl("/dbconnections/change_password"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "client_id", publicClientId,
                            "email", email,
                            "connection", databaseConnection
                    ))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException exception) {
            // A conta local e a identidade Auth0 já existem. O usuário ainda pode
            // iniciar a recuperação de senha pela tela hospedada do Auth0.
            log.warn("Não foi possível solicitar o e-mail de definição de senha do Auth0.");
            return false;
        }
    }

    private synchronized String getManagementToken() {
        CachedToken current = cachedToken;
        if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return current.value();
        }

        try {
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl("/oauth/token"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "grant_type", "client_credentials",
                            "client_id", managementClientId,
                            "client_secret", managementClientSecret,
                            "audience", apiUrl("/api/v2/")
                    ))
                    .retrieve()
                    .body(MAP_TYPE);

            Object tokenValue = response != null ? response.get("access_token") : null;
            Object expiresInValue = response != null ? response.get("expires_in") : null;
            if (!(tokenValue instanceof String token) || token.isBlank()
                    || !(expiresInValue instanceof Number expiresIn)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Auth0 não retornou um token válido para a Management API."
                );
            }

            CachedToken newToken = new CachedToken(token, Instant.now().plusSeconds(expiresIn.longValue()));
            cachedToken = newToken;
            return newToken.value();
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível autenticar o backend na Management API do Auth0."
            );
        }
    }

    private void ensureConfigured() {
        if (isBlank(domain) || isBlank(managementClientId) || isBlank(managementClientSecret)
                || isBlank(publicClientId) || isBlank(databaseConnection)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "A integração de provisionamento do Auth0 ainda não está configurada no backend."
            );
        }
    }

    private String apiUrl(String path) {
        String host = domain.trim()
                .replaceFirst("^https?://", "")
                .replaceAll("/+$", "");
        return "https://" + host + path;
    }

    private static String generateTemporaryPassword() {
        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes) + "!aA9";
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record CachedToken(String value, Instant expiresAt) {
    }

    public record Auth0Identity(String subject, boolean emailVerified) {
    }
}
