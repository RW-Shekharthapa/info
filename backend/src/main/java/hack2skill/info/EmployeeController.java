package hack2skill.info;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Employee> list() {
        return repository.findAll(Sort.by("id"));
    }

    @GetMapping("/{id}")
    public Employee get(@PathVariable Long id) {
        return find(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee create(@RequestBody Employee input) {
        Employee employee = new Employee();
        apply(employee, input);
        if (repository.existsByEmployeeIdIgnoreCase(employee.getEmployeeId())) {
            throw duplicate("Employee ID");
        }
        if (repository.existsByEmailIgnoreCase(employee.getEmail())) {
            throw duplicate("Email");
        }
        return repository.save(employee);
    }

    @PutMapping("/{id}")
    public Employee update(@PathVariable Long id, @RequestBody Employee input) {
        Employee employee = find(id);
        apply(employee, input);
        if (repository.existsByEmployeeIdIgnoreCaseAndIdNot(employee.getEmployeeId(), id)) {
            throw duplicate("Employee ID");
        }
        if (repository.existsByEmailIgnoreCaseAndIdNot(employee.getEmail(), id)) {
            throw duplicate("Email");
        }
        return repository.save(employee);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        repository.delete(find(id));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", String.valueOf(e.getReason())));
    }

    private Employee find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
    }

    private void apply(Employee employee, Employee input) {
        employee.setEmployeeId(required(input.getEmployeeId(), "Employee ID", 30));
        employee.setName(required(input.getName(), "Name", 100));
        employee.setEmail(required(input.getEmail(), "Email", 150).toLowerCase());
        employee.setDesignation(required(input.getDesignation(), "Designation", 100));
        if (!EMAIL.matcher(employee.getEmail()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is not a valid email address");
        }
    }

    private static String required(String value, String field, int maxLength) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    field + " must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    private static ResponseStatusException duplicate(String field) {
        return new ResponseStatusException(HttpStatus.CONFLICT, field + " is already used by another employee");
    }
}
