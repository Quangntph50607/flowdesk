package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.AddMemberRequest;
import com.example.flowdesk_be.dto.response.MemberResponse;

import java.util.List;

public interface MemberService {

  MemberResponse addMember(Long workspaceId, AddMemberRequest request, String requesterEmail);

  List<MemberResponse> getMembers(Long workspaceId, String requesterEmail);

  MemberResponse toggleMemberActive(Long workspaceId, Long memberId, String requesterEmail);

  void removeMember(Long workspaceId, Long memberId, String requesterEmail);
}
