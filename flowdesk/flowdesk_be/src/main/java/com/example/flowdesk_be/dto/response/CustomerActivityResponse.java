package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.CustomerActivity;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CustomerActivityResponse {
  private Long id;
  private String action;
  private String description;
  private Long actorId;
  private String actorName;
  private LocalDateTime createdAt;

  public static CustomerActivityResponse from(CustomerActivity activity) {
    CustomerActivityResponse r = new CustomerActivityResponse();
    r.id = activity.getId();
    r.action = activity.getAction();
    r.description = activity.getDescription();
    r.actorId = activity.getActor().getId();
    r.actorName = activity.getActor().getFullName();
    r.createdAt = activity.getCreatedAt();
    return r;
  }
}
