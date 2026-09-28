package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.CustomerTag;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerTagResponse {
  private Long id;
  private String name;
  private String color;

  public static CustomerTagResponse from(CustomerTag tag) {
    CustomerTagResponse r = new CustomerTagResponse();
    r.id = tag.getId();
    r.name = tag.getName();
    r.color = tag.getColor();
    return r;
  }
}
