document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
        activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability"><strong>Availability:</strong> <span>${spotsLeft} spots left</span></p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            const participantName = document.createElement("span");
            participantName.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            removeButton.title = `Unregister ${participant}`;
            removeButton.innerHTML = `
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
            `;

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                const participantIndex = details.participants.indexOf(participant);
                if (participantIndex !== -1) {
                  details.participants.splice(participantIndex, 1);
                }
                participantItem.remove();

                const remainingSpots = details.max_participants - details.participants.length;
                activityCard.querySelector(".activity-availability span").textContent = `${remainingSpots} spots left`;

                if (details.participants.length === 0) {
                  participantsList.remove();
                  const emptyState = document.createElement("p");
                  emptyState.className = "participants-empty";
                  emptyState.textContent = "No participants yet";
                  participantsSection.appendChild(emptyState);
                }

                showMessage(result.message, "success");
              } catch (error) {
                showMessage(error.message || "Unable to unregister participant", "error");
                removeButton.disabled = false;
              }
            });

            participantItem.append(participantName, removeButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.appendChild(participantsList);
        } else {
          const emptyState = document.createElement("p");
          emptyState.className = "participants-empty";
          emptyState.textContent = "No participants yet";
          participantsSection.appendChild(emptyState);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
