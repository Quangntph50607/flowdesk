package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.isActive = true
        and (:workspaceId is null or c.workspace.id = :workspaceId)
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchAllCustomers(
      @Param("workspaceId") Long workspaceId,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.workspace.id in :workspaceIds
        and c.isActive = true
        and (:workspaceId is null or c.workspace.id = :workspaceId)
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchCustomersInWorkspaces(
      @Param("workspaceIds") Collection<Long> workspaceIds,
      @Param("workspaceId") Long workspaceId,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.branch.id in :branchIds
        and c.isActive = true
        and (:workspaceId is null or c.workspace.id = :workspaceId)
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchCustomersInBranches(
      @Param("branchIds") Collection<Long> branchIds,
      @Param("workspaceId") Long workspaceId,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where (c.workspace.id in :workspaceIds or c.branch.id in :branchIds)
        and c.isActive = true
        and (:workspaceId is null or c.workspace.id = :workspaceId)
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchCustomersInWorkspacesOrBranches(
      @Param("workspaceIds") Collection<Long> workspaceIds,
      @Param("branchIds") Collection<Long> branchIds,
      @Param("workspaceId") Long workspaceId,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.workspace.id = :workspaceId
        and c.isActive = true
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchWorkspaceCustomers(
      @Param("workspaceId") Long workspaceId,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select distinct c from Customer c
        left join fetch c.assignedUser
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.workspace.id = :workspaceId
        and c.branch.id in :branchIds
        and c.isActive = true
        and (:branchId is null or c.branch.id = :branchId)
        and (:status is null or c.status = :status)
        and (:search is null
          or lower(c.name) like lower(concat('%', :search, '%'))
          or lower(c.phone) like lower(concat('%', :search, '%'))
          or lower(c.email) like lower(concat('%', :search, '%')))
        and (:tagId is null or ta.tag.id = :tagId)
      order by c.updatedAt desc
      """)
  List<Customer> searchBranchCustomers(
      @Param("workspaceId") Long workspaceId,
      @Param("branchIds") Collection<Long> branchIds,
      @Param("branchId") Long branchId,
      @Param("status") String status,
      @Param("tagId") Long tagId,
      @Param("search") String search);

  @Query("""
      select c from Customer c
        left join fetch c.assignedUser
        left join fetch c.createdBy
        left join fetch c.branch
        left join fetch c.tagAssignments ta
        left join fetch ta.tag
      where c.id = :id and c.isActive = true
      """)
  java.util.Optional<Customer> findDetailById(@Param("id") Long id);
}
