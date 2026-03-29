package com.pa.weeklycommit.service;

import com.pa.weeklycommit.dto.RcdoHierarchyResponse;
import com.pa.weeklycommit.entity.RallyCry;
import com.pa.weeklycommit.repository.RallyCryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RcdoService {

    private final RallyCryRepository rallyCryRepository;

    public RcdoService(RallyCryRepository rallyCryRepository) {
        this.rallyCryRepository = rallyCryRepository;
    }

    @Transactional(readOnly = true)
    public RcdoHierarchyResponse getHierarchy(UUID orgId) {
        List<RallyCry> rallyCries = rallyCryRepository.findByOrgIdAndActiveTrue(orgId);

        List<RcdoHierarchyResponse.RallyCryNode> nodes = rallyCries.stream()
                .map(rc -> new RcdoHierarchyResponse.RallyCryNode(
                        rc.getId(),
                        rc.getTitle(),
                        rc.getDescription(),
                        rc.getDefiningObjectives().stream()
                                .filter(d -> d.isActive())
                                .map(d -> new RcdoHierarchyResponse.DefiningObjectiveNode(
                                        d.getId(),
                                        d.getTitle(),
                                        d.getDescription(),
                                        d.getOutcomes().stream()
                                                .filter(o -> o.isActive())
                                                .map(o -> new RcdoHierarchyResponse.OutcomeNode(
                                                        o.getId(),
                                                        o.getTitle(),
                                                        o.getDescription(),
                                                        o.getMeasurableTarget()
                                                ))
                                                .toList()
                                ))
                                .toList()
                ))
                .toList();

        return new RcdoHierarchyResponse(nodes);
    }
}
