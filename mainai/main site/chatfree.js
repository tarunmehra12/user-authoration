// DOM Elements
const chatContent = document.getElementById("chat-content");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Question limit configuration
const QUESTION_LIMIT = 5;
let questionCount = 0;

// Create login popup
const loginPopup = document.createElement('div');
loginPopup.className = 'auth-popup';
loginPopup.innerHTML = `
    <div class="popup-content">
        <h3>🌟 Unlock Full Access</h3>
        <p>You've used ${QUESTION_LIMIT} free questions! Create an account to:</p>
        <ul>
            <li>✨ Get unlimited questions</li>
            <li>💾 Save your chat history</li>
            <li>🚀 Access advanced features</li>
            <li>📚 Personalized learning path</li>
        </ul>
        <div class="popup-buttons">
            <button onclick="window.location.href='../register.html'" class="popup-button register">Register Now</button>
            <button onclick="window.location.href='../login.html'" class="popup-button login">Login</button>
        </div>
    </div>
`;

// Configuration
const API_CONFIG = {
    URL: "https://backend.buildpicoapps.com/aero/run/llm-api",
    API_KEY: "v1-Z0FBQUFBQm5IZkJDMlNyYUVUTjIyZVN3UWFNX3BFTU85SWpCM2NUMUk3T2dxejhLSzBhNWNMMXNzZlp3c09BSTR6YW1Sc1BmdGNTVk1GY0liT1RoWDZZX1lNZlZ0Z1dqd3c9PQ=="
};

// Assistant configuration
const ASSISTANT_PROMPT = `[Your existing prompt]`;

// Event Listeners
chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Check question limit
    questionCount++;
    
    // Show login popup at limit
    if (questionCount >= QUESTION_LIMIT) {
        document.body.appendChild(loginPopup);
        return;
    }

    // Display user message
    appendMessage(userMessage, "user");
    
    // Clear input field
    userInput.value = "";

    // Show loading state
    const loadingMessage = "Thinking...";
    const loadingElement = appendMessage(loadingMessage, "bot");

    try {
        // Get AI response
        const botResponse = await fetchResponse(userMessage);
        
        // Remove loading message
        chatContent.removeChild(chatContent.lastChild);
        
        // Display bot response
        appendMessage(botResponse, "bot");

        // Show login suggestion at 4th question
        if (questionCount === 4) {
            appendMessage("💡 You have 1 question remaining. Login now to get unlimited access!", "system");
        }
    } catch (error) {
        console.error("Error getting response:", error);
        chatContent.removeChild(chatContent.lastChild);
        appendMessage("Sorry, I encountered an error. Please try again.", "bot");
    }
});

// Fetch response from API
async function fetchResponse(userMessage) {
    try {
        const response = await fetch(`${API_CONFIG.URL}?pk=${API_CONFIG.API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: `${ASSISTANT_PROMPT}\nUser: ${userMessage}\nAI Teacher:`
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.status === "success" ? data.text : "I apologize, but I'm having trouble processing your request. Please try again.";
    } catch (error) {
        console.error("Error in fetchResponse:", error);
        return "I apologize, but I'm experiencing technical difficulties. Please try again later.";
    }
}

// Append message to chat
function appendMessage(message, type) {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.classList.add(`${type}-message`);
    chatContent.appendChild(messageElement);
    chatContent.scrollTop = chatContent.scrollHeight;
}

// Initialize
window.addEventListener("load", () => {
    const welcomeMessage = `🎓 Welcome to TechTeach AI!

📚 Your Personal Computer Science & Programming Teacher

⭐ You have ${QUESTION_LIMIT} free questions to try out our service!

🌟 How I Can Help You:
• Explain programming concepts clearly
• Debug your code and fix issues
• Guide you through algorithms
• Help with project architecture
• Teach best coding practices

💻 I'm Specialized In:
• Python, Java, JavaScript, C++
• Web Development (Frontend & Backend)
• Data Structures & Algorithms
• Database Design & SQL
• System Architecture

💡 Ready to start learning? Just type your question below!`;

    appendMessage(welcomeMessage, "bot");
});

// Add this function
window.handleLogout = async function() {
    try {
        const auth = getAuth();
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Update the auth state listener to show/hide appropriate buttons
onAuthStateChanged(auth, (user) => {
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    
    if (user) {
        // User is signed in
        loginButton.style.display = 'none';
        logoutButton.style.display = 'flex';
    } else {
        // User is signed out
        loginButton.style.display = 'flex';
        logoutButton.style.display = 'none';
    }
}); 