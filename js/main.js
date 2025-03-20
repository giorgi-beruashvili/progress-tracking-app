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
  return tasks;
}

function renderTasks(tasks) {
  const dashboard = document.getElementById("dashboard");
  dashboard.innerHTML = statusCategories
    .map(category => `
      <div class="status-column" id="${category.key}">
        <div class="status-header-container ${category.class}">
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

document.querySelectorAll(".task-header-left > span").forEach(span => {
  let words = span.textContent.trim().split(" ");
  if (words.length > 1) {
    span.textContent = `${words[0]}...`;
  }
});

function formatDate(dateString) {
  const monthNames = {
    "01": "იან",
    "02": "თებ",
    "03": "მარ",
    "04": "აპრ",
    "05": "მაი",
    "06": "ივნ",
    "07": "ივლ",
    "08": "აგვ",
    "09": "სექ",
    "10": "ოქტ",
    "11": "ნოე",
    "12": "დეკ"
  };

  const date = new Date(dateString);
  const day = date.getUTCDate();
  const month = monthNames[String(date.getUTCMonth() + 1).padStart(2, "0")];
  const year = date.getUTCFullYear();

  return `${day} ${month}, ${year}`;
}

function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function createTaskCard(task) {
  let truncatedDepartmentName = task.department.name.split(" ")[0] + "...";
  const formattedDate = formatDate(task.due_date);
  const formattedTaskName = capitalizeFirstLetter(task.name);

  const statusColors = {
    "დასაწყები": "var(--color-mainyellow)",
    "პროგრესში": "var(--color-mainorange)",
    "მზად ტესტირებისთვის": "var(--pure-or-mostly-pure-pink)",
    "დასრულებული": "var(--color-mainblue)"
  };

  const borderColor = statusColors[task.status.name] || "var(--color-grey)";

  return `
    <div class="task" style="border: 1px solid ${borderColor}">
      <div class="task-header">
        <div class="task-header-left">
          <button class="task-priority" style="border: 1px solid ${borderColor}">
            <img class="task-priority-img" style="color: ${borderColor}" src="${task.priority.icon}" width="12" height="9">
            <span style="color: ${borderColor}">${task.priority.name}</span>
          </button>
          <span>${truncatedDepartmentName}</span>
        </div>
        <div class="task-header-right">
          <span>${formattedDate}</span>
        </div>
      </div>
      <div class="task-main">
        <h3 class="task-title">${formattedTaskName}</h3>
        <p>${truncateText(task.description, 100)}</p>
      </div>
      <div class="task-footer">
        <div class="task-footer-left">
          <img src="${task.employee.avatar}">
        </div>
        <div class="task-footer-right">
          <img src="assets/images/Comments.svg">
          <span>${task.total_comments}</span>
        </div>
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
      <div class="filter-options ${gridClass}">
        ${items.map(item => createFilterOption(type, item)).join("")}
      </div>
      <div class="filter-apply-button">
        <button id="applyFilter">არჩევა</button>
      </div>
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
    const typeMap = {
      "დეპარტამენტი": "department",
      "პრიორიტეტი": "priority",
      "თანამშრომელი": "employee"
    };

    const mappedType = typeMap[input.dataset.type];

    if (mappedType === "employee") {
      selectedFilters.employee = input.value;
    } else if (mappedType) {
      selectedFilters[mappedType].push(input.value);
    }
  });

  fetchAndRenderTasks().then(allTasks => {
    let filteredTasks = allTasks;

    if (selectedFilters.employee) {
      filteredTasks = filteredTasks.filter(task => task.employee.id == selectedFilters.employee);
    }

    if (selectedFilters.department.length > 0) {
      filteredTasks = filteredTasks.filter(task => selectedFilters.department.includes(task.department.id.toString()));
    }

    if (selectedFilters.priority.length > 0) {
      filteredTasks = filteredTasks.filter(task => selectedFilters.priority.includes(task.priority.id.toString()));
    }

    renderTasks(filteredTasks);
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

fetchAndRenderTasks().then(renderTasks);
