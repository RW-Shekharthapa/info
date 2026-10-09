package hack2skill.info;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmployeeIdIgnoreCase(String employeeId);
    boolean existsByEmployeeIdIgnoreCaseAndIdNot(String employeeId, Long id);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
}
