const BASE_URL = 'https://momentum.redberryinternship.ge/api';
const TOKEN = "9e73de3d-3ad4-4b01-85f8-f2d717145333";

document.addEventListener('DOMContentLoaded', () => {
    fetch(`${BASE_URL}/tasks/1235`, {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            document.getElementById('task-name').innerText = data.name;
            document.getElementById('task-desc').innerText = data.description;
            document.getElementById('task-status').innerText = `სტატუსი: ${data.status.name}`;
            document.getElementById('task-priority').innerText = `პრიორიტეტი: ${data.priority.name}`;
            document.getElementById('task-dept').innerText = `დეპარტამენტი: ${data.department.name}`;
            document.getElementById('employee-avatar').src = data.employee.avatar || 'default-avatar.png';
            document.getElementById('employee-name').innerText = `${data.employee.name} ${data.employee.surname}`;
            document.getElementById('due-date').innerText = `თარიღი: ${data.due_date}`;
        })
        .catch(err => console.error('Error fetching task:', err));
});