package com.estoque.api.security;

import com.estoque.api.model.UserModel;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;

@Service
public class TokenService {
    @Value("${api.security.token.secret}")
    private String secret;

    private SecretKey getSecretKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(UserModel user){
        return Jwts.builder().issuer("saas-estoque-api")
                .subject(user.getUsername()).claim("role", user.getRole())
                .expiration(generateExpirationDate()).signWith(getSecretKey())
                .compact();
    }

    protected String validateToken(String token){
        try {
            return Jwts.parser().verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token).getPayload()
                    .getSubject();
        }catch (Exception e){
            return "";
        }
    }

    private Date generateExpirationDate(){
        Instant instant = LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-03:00"));
        return Date.from(instant);
    }
}
