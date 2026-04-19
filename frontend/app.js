const API_BASE_URL = "http://127.0.0.1:8000";

const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");
const handoverForm = document.getElementById("handoverForm");
const handoverList = document.getElementById("handoverList");
const formMessage = document.getElementById("formMessage");
const sortSelect = document.getElementById("sortSelect");
let currentHandovers = [];

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    clearFormMessage();
    const targetView = button.dataset.view;

    navButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    views.forEach((view) => {
      view.classList.toggle("active", view.id === targetView);
    });

    if (targetView === "listView") {
      fetchHandovers();
    }
  });
});

sortSelect.addEventListener("change", () => {
  renderHandovers(currentHandovers);
});

handoverForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormMessage();

  const formData = new FormData(handoverForm);

  const newHandover = {
    onCallPerson: formData.get("onCallPerson").trim(),
    shiftDate: formData.get("shiftDate"),
    summary: formData.get("summary").trim(),
    whatHappened: formData.get("whatHappened").trim(),
    nextSteps: formData.get("nextSteps").trim(),
    priority: formData.get("priority"),
  };

  try {
    const response = await fetch(`${API_BASE_URL}/handovers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newHandover),
    });

    if (!response.ok) {
      throw new Error("Failed to save handover.");
    }

    handoverForm.reset();
    document.getElementById("priority").value = "Medium";
    showFormMessage("Handover saved successfully.", "success");

    await fetchHandovers();

  } catch (error) {
    showFormMessage("Could not save handover. Make sure the backend is running.", "error");
    console.error(error);
  }
});

async function fetchHandovers() {
  handoverList.innerHTML = `<p class="loading-state">Loading handovers...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/handovers`);

    if (!response.ok) {
      throw new Error("Failed to fetch handovers.");
    }

    const handovers = await response.json();
    currentHandovers = handovers;
    renderHandovers(currentHandovers);
  } catch (error) {
    handoverList.innerHTML = `
      <p class="empty-state">Could not load handovers. Make sure the backend is running.</p>
    `;
    console.error(error);
  }
}

function renderHandovers(handovers) {
  const sortedHandovers = [...handovers];

  switch (sortSelect.value) {
    case "oldest":
      sortedHandovers.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      break;

    case "priority-high":
      sortedHandovers.sort(
        (a, b) => getPriorityRank(b.priority) - getPriorityRank(a.priority)
      );
      break;

    case "priority-low":
      sortedHandovers.sort(
        (a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority)
      );
      break;

    case "latest":
    default:
      sortedHandovers.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      break;
  }
  if (!sortedHandovers.length) {
    handoverList.innerHTML = `<p class="empty-state">No handovers yet.</p>`;
    return;
  }

  handoverList.innerHTML = sortedHandovers
    .map(
      (item) => `
      <article class="handover-item">
        <div class="handover-top">
          <div>
            <h3>${escapeHtml(item.summary)}</h3>
            <div class="meta">
                ${escapeHtml(item.onCallPerson)} • On-call: ${escapeHtml(item.shiftDate)}
                <span class="timestamp">
                    Submitted: ${formatDate(item.createdAt)}
                </span>
            </div>
          </div>
          <span class="priority-badge ${getPriorityClass(item.priority)}">
            ${escapeHtml(item.priority)}
          </span>
        </div>

        <div class="handover-section">
          <strong>Details:</strong>
          <div>${escapeHtml(item.whatHappened)}</div>
        </div>

        <div class="handover-section">
          <strong>Next steps:</strong>
          <div>${escapeHtml(item.nextSteps)}</div>
        </div>

      </article>
    `
    )
    .join("");
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "priority-high";
    case "Medium":
      return "priority-medium";
    default:
      return "priority-low";
  }
}

function showFormMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

function clearFormMessage() {
  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPriorityRank(priority) {
  switch (priority) {
    case "High":
      return 3;
    case "Medium":
      return 2;
    case "Low":
      return 1;
    default:
      return 0;
  }
}

fetchHandovers();