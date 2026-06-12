package Salon.SalonManagementSystem.service;

import Salon.SalonManagementSystem.model.Branch;
import Salon.SalonManagementSystem.repository.BranchRepository;
import Salon.SalonManagementSystem.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private UsersRepository userRepository;

    public Branch saveBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public void deleteBranch(Integer id) {

        // 🔒 Check if users exist for this branch
        long usersCount = userRepository.countByBranchId(id);

        if (usersCount > 0) {
            throw new RuntimeException(
                    "Cannot delete branch. Users are assigned to this branch.");
        }

        branchRepository.deleteById(id);
    }

    public Branch updateBranch(Integer id, Branch branchDetails) {
        Branch branch = branchRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Branch not found with id: " + id));

        branch.setBranchName(branchDetails.getBranchName());
        branch.setAddress(branchDetails.getAddress());
        branch.setPhone(branchDetails.getPhone());

        return branchRepository.save(branch);
    }
}
