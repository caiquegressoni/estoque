package com.estoque.api.security;

import com.estoque.api.model.UserModel;
import com.estoque.api.service.Auth0UserService;
import org.jspecify.annotations.NonNull;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class Auth0JwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final Auth0UserService auth0UserService;

    public Auth0JwtAuthenticationConverter(Auth0UserService auth0UserService) {
        this.auth0UserService = auth0UserService;
    }

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        UserModel localUser = auth0UserService.resolveLocalUser(jwt);
        return UsernamePasswordAuthenticationToken.authenticated(
                localUser,
                null,
                localUser.getAuthorities()
        );
    }
}
