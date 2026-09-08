package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.AddMemberRequest;
import com.example.flowdesk_be.dto.response.MemberGroupResponse;
import com.example.flowdesk_be.dto.response.MemberResponse;

import java.util.List;

public interface MemberService {

  MemberResponse addMember(Long workspaceId, AddMemberRequest request, String requesterEmail);

  List<MemberResponse> getMembers(Long workspaceId, String requesterEmail);

  List<MemberResponse> getMembers(Long workspaceId, String requesterEmail, String search);

  /** Flat list — workspace tổng + chi nhánh, mỗi membership 1 row. */
  List<MemberResponse> getAllMembersFlat(Long workspaceId, String requesterEmail);

  /**
   * Grouped — mỗi user 1 object kèm mảng memberships + branchLabels tính sẵn.
   * Dùng cho bảng thành viên ở trang workspace tổng.
   */
  List<MemberGroupResponse> getAllMembersGrouped(Long workspaceId, String requesterEmail);

  MemberResponse toggleMemberActive(Long workspaceId, Long memberId, String requesterEmail);

  void removeMember(Long workspaceId, Long memberId, String requesterEmail);
}
