package com.estoque.api.service;

import com.estoque.api.model.UserModel;
import com.estoque.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class Auth0UserService {

    private final UserRepository userRepository;
    private final String emailClaim;
    private final String emailVerifiedClaim;

    public Auth0UserService(
            UserRepository userRepository,
            @Value("${app.auth0.claims.email}") String emailClaim,
            @Value("${app.auth0.claims.email-verified}") String emailVerifiedClaim
    ) {
        this.userRepository = userRepository;
        this.emailClaim = emailClaim;
        this.emailVerifiedClaim = emailVerifiedClaim;
    }

    @Transactional
    public UserModel resolveLocalUser(Jwt jwt) {
        String subject = jwt.getSubject();
        String email = jwt.getClaimAsString(emailClaim);
        Boolean emailVerified = jwt.getClaimAsBoolean(emailVerifiedClaim);

        if (subject == null || subject.isBlank() || !Boolean.TRUE.equals(emailVerified)
                || email == null || email.isBlank()) {
            throw invalidIdentity();
        }

        return userRepository.findByAuth0Subject(subject)
                .orElseGet(() -> linkByVerifiedEmail(subject, email));
    }

    private UserModel linkByVerifiedEmail(String subject, String email) {
        UserModel localUser = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(Auth0UserService::invalidIdentity);

        if (localUser.getAuth0Subject() != null && !localUser.getAuth0Subject().equals(subject)) {
            throw invalidIdentity();
        }

        localUser.setAuth0Subject(subject);
        return userRepository.save(localUser);
    }

    private static OAuth2AuthenticationException invalidIdentity() {
        return new OAuth2AuthenticationException(
                new OAuth2Error("invalid_token"),
                "A identidade Auth0 não está verificada ou vinculada a um usuário do Estoque."
        );
    }
}
