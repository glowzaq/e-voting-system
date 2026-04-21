class VotingSystem {
    constructor() {
        this.voters = new Set();
        this.aliceVotes = 0;
        this.bobVotes = 0;
    }

    vote(voterId, candidate) {
        if (!voterId) {
            return "Please enter a voter ID";
        }

        if (this.voters.has(voterId)) {
            return "You have already voted";
        }

        // if (voterId.length < 6) {
        //     return "Invalid ID, check and try again"
        // }

        if (candidate === "Ini") {
            this.aliceVotes++;
        } else if (candidate === "Tinubu") {
            this.bobVotes++;
        }

        this.voters.add(voterId);
        return "Vote successfully recorded";
    }
}

const system = new VotingSystem();

function vote(candidate) {
    const voterId = document.getElementById("voterId").value.trim();
    const messageBox = document.getElementById("message");

    const result = system.vote(voterId, candidate);

    messageBox.textContent = result;
    messageBox.classList.remove("d-none", "alert-danger", "alert-success");

    if (result.includes("success")) {
        messageBox.classList.add("alert-success");
    } else {
        messageBox.classList.add("alert-danger");
    }

    document.getElementById("aliceVotes").textContent = system.aliceVotes;
    document.getElementById("bobVotes").textContent = system.bobVotes;

    document.getElementById("voterId").value = "";
}