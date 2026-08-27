package com.example.flowdesk_be.security;

import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException(
            "Không tìm thấy user với email: " + email));

    // SUPER_ADMIN → authority ROLE_SUPER_ADMIN
    // ADMIN/AGENT → authority ROLE_ADMIN hoặc ROLE_AGENT (lấy từ workspace_members
    // nếu cần)
    // Tạm thời load system_role, workspace role sẽ check riêng trong từng use case
    String roleCode = user.getSystemRole() != null ? user.getSystemRole() : "USER";

    return org.springframework.security.core.userdetails.User.builder()
        .username(user.getEmail())
        .password(user.getPasswordHash())
        .disabled(!user.getIsActive())
        .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + roleCode)))
        .build();
  }
}
