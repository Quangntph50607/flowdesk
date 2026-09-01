package com.example.flowdesk_be.security;

import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    // Kiểm tra tài khoản bị khoá
    if (!user.getIsActive()) {
      throw new UsernameNotFoundException("Tài khoản đã bị vô hiệu hoá: " + email);
    }

    // Build authorities — Spring Security dùng prefix ROLE_ cho hasRole()
    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
    if (user.isSuperAdmin()) {
      authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
    }
    // Workspace roles không đưa vào Spring Security authorities
    // vì chúng được kiểm tra trong service layer theo workspace cụ thể

    return org.springframework.security.core.userdetails.User.builder()
        .username(user.getEmail())
        .password(user.getPasswordHash())
        .authorities(authorities)
        .build();
  }
}
