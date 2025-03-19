const API_URL = "https://momentum.redberryinternship.ge/api";
const TOKEN = "9e73de3d-3ad4-4b01-85f8-f2d717145333";

async function fetchData(endpoint, filters = {}) {
  try {
    const response = await axios.get(`${API_URL}/${endpoint}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

const statusCategories = [
  { key: "დასაწყები", class: "status-start", title: "დასაწყები" },
  { key: "პროგრესში", class: "status-progress", title: "პროგრესში" },
  { key: "მზად ტესტირებისთვის", class: "status-test-ready", title: "მზად ტესტირებისთვის" },
  { key: "დასრულებული", class: "status-complete", title: "დასრულებული" }
];

async function fetchAndRenderTasks(filters = {}) {
  const tasks = await fetchData("tasks", filters);
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = statusCategories
    .map(category => `
      <div class="status-column ${category.class}" id="${category.key}">
        <div class="status-header-container">
          <h2 class="status-header">${category.title}</h2>
        </div>
        <div class="tasks-container"></div>
      </div>
    `)
    .join("");

  tasks.forEach(task => {
    const column = document.getElementById(task.status.name);
    if (column) {
      column.querySelector(".tasks-container").innerHTML += createTaskCard(task);
    }
  });
}

function createTaskCard(task) {
  return `
    <div class="task">
      <div class="task-header">
        <button class="task-priority">
          <img src="${task.priority.icon}">
          ${task.priority.name}
        </button>
        <span>${task.department.name}</span>
        <span>${task.due_date}</span>
      </div>
      <h3 class="task-title">${task.name}</h3>
      <p>${task.description}</p>
      <div class="task-footer">
        <img src="${task.employee.avatar}">
        <span>${task.total_comments} </span>
      </div>
    </div>
  `;
}

async function openFilterModal(type, apiEndpoint) {
  let existingModal = document.querySelector(".modal");
  if (existingModal) {
    existingModal.remove();
    return;
  }

  const items = await fetchData(apiEndpoint);
  renderFilterModal(type, items);
}

function renderFilterModal(type, items) {
  const modal = document.createElement("div");
  modal.classList.add("modal");

  const gridClass = type === "დეპარტამენტი" ? "grid-two-columns" : "grid-one-column";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>აირჩიეთ ${type}</h2>
      <div class="filter-options ${gridClass}">
        ${items.map(item => createFilterOption(type, item)).join("")}
      </div>
      <button id="applyFilter">არჩევა</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
  document.getElementById("applyFilter").addEventListener("click", () => {
    applyFilters();
    modal.remove();
  });
}

function createFilterOption(type, item) {
  if (type === "თანამშრომელი") {
    return `
      <label class="employee-option">
        <input type="radio" name="employee" value="${item.id}" class="filter-option" data-type="${type}">
        <img src="${item.avatar}" alt="${item.name} ${item.surname}" class="employee-avatar">
        <span>${item.name} ${item.surname}</span>
      </label>
    `;
  } else {
    return `
      <label class="filter-label">
        <input type="checkbox" value="${item.id}" class="filter-option" data-type="${type}">
        ${item.name}
      </label>
    `;
  }
}

function applyFilters() {
  const selectedFilters = { department: [], priority: [], employee: null };

  document.querySelectorAll(".filter-option:checked").forEach(input => {
    if (input.dataset.type === "თანამშრომელი") {
      selectedFilters.employee = input.value;
    } else {
      selectedFilters[input.dataset.type].push(input.value);
    }
  });

  fetchAndRenderTasks({
    department_ids: selectedFilters.department.length ? selectedFilters.department.join(",") : null,
    priority_ids: selectedFilters.priority.length ? selectedFilters.priority.join(",") : null,
    employee_id: selectedFilters.employee || null,
  });
}

document.querySelector(".one").addEventListener("click", () =>
  openFilterModal("დეპარტამენტი", "departments")
);
document.querySelector(".two").addEventListener("click", () =>
  openFilterModal("პრიორიტეტი", "priorities")
);
document.querySelector(".three").addEventListener("click", () =>
  openFilterModal("თანამშრომელი", "employees")
);

fetchAndRenderTasks();
