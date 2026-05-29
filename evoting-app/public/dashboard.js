const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
const userNameElement = document.getElementById("loggedInUserName");

if (loggedInUser && userNameElement) {
    const displayName = loggedInUser.fullName || `${loggedInUser.firstName || ''} ${loggedInUser.lastName || ''}`.trim();
    userNameElement.textContent = `${displayName} • ${loggedInUser.voterId}`;
}

if (!loggedInUser) {
    window.location.href = "/login.html";
}

// ── POLLING CONTROL ──
let pollingInterval = null;

function startPolling() {
    if (pollingInterval) return; // already running, don't double up
    pollingInterval = setInterval(loadResults, 5000); // every 5s is enough
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// ── VOTING SYSTEM ──
class VotingSystem {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
    }

    async vote(voterId, candidate) {
        const response = await fetch(`${this.apiUrl}/vote`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ voterId, candidate }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: data.error || "Vote failed",
            };
        }

        return {
            success: true,
            message: data.message,
        };
    }

    async getResults() {
        const response = await fetch(`${this.apiUrl}/api/results`);
        return response.json();
    }

    async hasVoted(voterId) {
        try {
            const response = await fetch(`${this.apiUrl}/has-voted/${voterId}`);
            const data = await response.json();
            return data.hasVoted === true;
        } catch {
            return false;
        }
    }
}

const system = new VotingSystem("http://localhost:3000");

// ── VOTE ACTION ──
async function vote(candidate) {
    const voterId = document.getElementById("voterId").value.trim();

    const result = await system.vote(voterId, candidate);

    if (result.success) {
        await alerts.success(result.message || "Vote submitted successfully.");
        stopPolling();
        await loadResults();
        disableVotingUI("You have successfully cast your vote.");
    } else {
        await alerts.error(result.message || "Vote failed.");

        if (result.message?.toLowerCase().includes("already")) {
            stopPolling();
            await loadResults();
            disableVotingUI("You have already cast your vote.");
        }
    }

    document.getElementById("voterId").value = "";
}

// ── LOAD RESULTS ──
async function loadResults() {
    try {
        const results = await system.getResults();
        const iniVotes = Number(results.Ini || 0);
        const tinubuVotes = Number(results.Tinubu || 0);
        const totalVotes = iniVotes + tinubuVotes;

        document.getElementById("aliceVotes").textContent = iniVotes;
        document.getElementById("bobVotes").textContent = tinubuVotes;
        document.getElementById("votesCounted").textContent = totalVotes;
        document.getElementById("registeredVoters").textContent = Number(results.registeredVoters || 0);

        const iniPercent = totalVotes ? Math.round((iniVotes / totalVotes) * 100) : 50;
        const tinubuPercent = totalVotes ? Math.round((tinubuVotes / totalVotes) * 100) : 50;

        document.getElementById("progressIni").style.width = `${iniPercent}%`;
        document.getElementById("progressTinubu").style.width = `${tinubuPercent}%`;
    } catch (err) {
        console.error("Failed to load results:", err);
    }
}

// ── DISABLE VOTING UI AFTER VOTE ──
function disableVotingUI(reason) {
    // disable voter ID input
    const voterIdInput = document.getElementById("voterId");
    if (voterIdInput) {
        voterIdInput.disabled = true;
        voterIdInput.placeholder = "Vote already submitted";
    }

    // disable all vote buttons
    document.querySelectorAll(".btn-vote-blue, .btn-vote-green").forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = "0.45";
        btn.style.cursor = "not-allowed";
        btn.textContent = "Vote Submitted";
    });
}

// ── LOGOUT ──
function logout() {
    stopPolling();
    localStorage.removeItem("loggedInUser");
    window.location.href = "/login.html";
}

// ── INIT ──
document.addEventListener("DOMContentLoaded", async () => {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // load results once immediately on page load
    await loadResults();

    // check if this voter has already voted
    const voterId = loggedInUser?.voterId;
    if (voterId) {
        const alreadyVoted = await system.hasVoted(voterId);
        if (alreadyVoted) {
            disableVotingUI("You have already cast your vote.");
            const messageBox = document.getElementById("message");
            if (messageBox) {
                messageBox.textContent = "You have already cast your vote. Results are shown below.";
                messageBox.classList.remove("d-none", "alert-danger");
                messageBox.classList.add("alert-success");
            }
        } else {
            startPolling();
        }
    } else {
        startPolling();
    }
});