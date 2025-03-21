const API_URL = "https://momentum.redberryinternship.ge/api";
const TOKEN = "9e73de3d-3ad4-4b01-85f8-f2d717145333";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
};

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const prioritySelect = document.getElementById("priority");
const statusSelect = document.getElementById("status");
const departmentSelect = document.getElementById("department");
const userSelect = document.getElementById("assigned-user");
const deadlineInput = document.getElementById("date");
const submitBtn = document.querySelector(".submit-btn");

let formData = {
  title: "",
  description: "",
  priority_id: null,
  status_id: null,
  department_id: null,
  assignee_id: null,
  due_date: "",
};

function saveToLocalStorage() {
  localStorage.setItem("taskFormData", JSON.stringify(formData));
}

function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("taskFormData"));
  if (saved) {
    formData = saved;
    titleInput.value = saved.title || "";
    descriptionInput.value = saved.description || "";
    deadlineInput.value = saved.due_date || "";
  }
}

function validateTitle(title) {
  return title.length >= 3 && title.length <= 255;
}

function validateDescription(description) {
  if (!description) return true;
  const wordCount = description.trim().split(/\s+/).length;
  return wordCount >= 4 && description.length <= 255;
}

function validateForm() {
  return (
    validateTitle(formData.title) &&
    validateDescription(formData.description) &&
    formData.priority_id &&
    formData.status_id &&
    formData.department_id &&
    formData.assignee_id &&
    formData.due_date
  );
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function fetchData(endpoint) {
  try {
    const res = await axios.get(`${API_URL}/${endpoint}`, { headers });
    const raw = res.data;

    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object" && raw !== null) return Object.values(raw);

    return [];
  } catch (error) {
    return [];
  }
}

function populateSelect(select, list, labelKey, valueKey, selectedId, formatter) {
  if (!Array.isArray(list)) return;

  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.textContent = "აირჩიეთ...";
  placeholderOption.disabled = true;
  placeholderOption.selected = !selectedId;
  select.appendChild(placeholderOption);

  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = formatter ? formatter(item) : item[labelKey];
    if (selectedId && item[valueKey] === selectedId) {
      option.selected = true;
      placeholderOption.selected = false;
    }
    select.appendChild(option);
  });
}

async function handleDepartmentChange(deptId) {
  userSelect.parentElement.style.display = "none";
  formData.department_id = +deptId;
  formData.assignee_id = null;
  saveToLocalStorage();

  try {
    const employees = await fetchData(`employees?department_id=${deptId}`);
    populateSelect(userSelect, employees, "name", "id", null, (emp) => `${emp.name} ${emp.surname}`);
    userSelect.parentElement.style.display = "block";
  } catch (err) {}
}

function setupEventListeners() {
  titleInput.addEventListener("input", debounce((e) => {
    formData.title = e.target.value;
    saveToLocalStorage();
  }, 300));

  descriptionInput.addEventListener("input", debounce((e) => {
    formData.description = e.target.value;
    saveToLocalStorage();
  }, 300));

  prioritySelect.addEventListener("change", (e) => {
    formData.priority_id = +e.target.value;
    saveToLocalStorage();
  });

  statusSelect.addEventListener("change", (e) => {
    formData.status_id = +e.target.value;
    saveToLocalStorage();
  });

  departmentSelect.addEventListener("change", (e) => {
    handleDepartmentChange(e.target.value);
  });

  userSelect.addEventListener("change", (e) => {
    formData.assignee_id = +e.target.value;
    saveToLocalStorage();
  });

  deadlineInput.addEventListener("change", (e) => {
    formData.due_date = e.target.value;
    saveToLocalStorage();
  });

  submitBtn.addEventListener("click", async () => {
    if (!validateForm()) {
      alert("გთხოვთ შეავსოთ ყველა საჭირო ველი სწორად");
      return;
    }

    try {
      await axios.post(`${API_URL}/tasks`, formData, { headers });
      localStorage.removeItem("taskFormData");
      window.location.href = "index.html";
    } catch (error) {
      alert("დავალების შექმნისას მოხდა შეცდომა");
    }
  });
}

async function initializeForm() {
  loadFromLocalStorage();

  const priorities = await fetchData("priorities");
  populateSelect(prioritySelect, priorities, "name", "id", formData.priority_id);

  const statuses = await fetchData("statuses");
  populateSelect(statusSelect, statuses, "name", "id", formData.status_id);

  const departments = await fetchData("departments");
  populateSelect(departmentSelect, departments, "name", "id", formData.department_id);

  const users = await fetchData("employees");
  populateSelect(userSelect, users, "name", "id", formData.employee_id);

  if (formData.department_id) {
    await handleDepartmentChange(formData.department_id);
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formatted = tomorrow.toISOString().split("T")[0];
  deadlineInput.min = formatted;

  if (!formData.due_date) {
    formData.due_date = formatted;
    deadlineInput.value = formatted;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializeForm();
  setupEventListeners();
});

