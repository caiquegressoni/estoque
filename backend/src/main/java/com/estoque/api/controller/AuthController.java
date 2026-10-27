package com.estoque.api.controller;

import com.estoque.api.dto.LoginRequestDTO;
import com.estoque.api.dto.LoginResponseDTO;
import com.estoque.api.dto.RegisterRequestDTO;
import com.estoque.api.model.UserModel;
import com.estoque.api.repository.TenantRepository;
import com.estoque.api.repository.UserRepository;
import com.estoque.api.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TenantRepository tenantRepository;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private PasswordEncoder passwordEncoder;

    //Rota para login
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO data) {
        //Validação do username e senha
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.username(), data.password());
        var authentication = this.authenticationManager.authenticate(usernamePassword);

        //Gera o token para o usuario
        var token = tokenService.generateToken((UserModel) authentication.getPrincipal());

        return ResponseEntity.ok(new LoginResponseDTO(token));
    }

    //Rota para cadastro
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequestDTO data){
        //Validação de email || garantia contra duplicidade de usuarios com mesmo nome
        if(this.userRepository.findByEmail(data.email()).isPresent()){
            return ResponseEntity.badRequest().body("email already exists");
        }

        //Validação de empresa pelo ID
        var tenant = tenantRepository.findById(data.tenantId()).orElse(null);
        if(tenant == null){ return
                ResponseEntity.badRequest().body("tenant not found");
        }

        String encyptedPasseord = passwordEncoder.encode(data.password());

        UserModel newUser = new UserModel(data.fullName(), data.email(), encyptedPasseord, data.role(), tenant);
        this.userRepository.save(newUser);

        return ResponseEntity.ok("User " + newUser.getUsername() + " registered successfully");
    }
}
