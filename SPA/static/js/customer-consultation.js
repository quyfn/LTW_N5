document.addEventListener("DOMContentLoaded", function () {
    // --- PHẦN 1: FAQ ACCORDION ---
    const faqToggles = document.querySelectorAll(".faq-toggle");
    faqToggles.forEach(toggle => {
        toggle.addEventListener("click", function () {
            const parent = this.parentElement;
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== parent) item.classList.remove('active');
            });
            parent.classList.toggle("active");
        });
    });

    // --- PHẦN 2: CHAT WIDGET TOGGLE ---
    const toggleButton = document.querySelector("[data-chat-toggle]");
    const widget = document.querySelector("[data-chat-widget]");
    const closeButtons = document.querySelectorAll("[data-chat-close]");

    if (toggleButton && widget) {
        toggleButton.addEventListener("click", () => widget.classList.toggle("hidden"));
    }
    if (closeButtons.length > 0 && widget) {
        closeButtons.forEach(btn => btn.addEventListener("click", () => widget.classList.add("hidden")));
    }

    // --- PHẦN 3: CUSTOMER CHAT WEBSOCKET ---
    const form = document.querySelector("[data-chat-form]");
    if (form && typeof roomId !== 'undefined') {
        const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + roomId + '/');
        const body = widget.querySelector(".chat-body");

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            if (!body) return;

            const isCustomer = data.user_id == userId && data.user_id !== 'bot';
            const row = document.createElement("div");
            row.className = `chat-row ${isCustomer ? "right" : "left"}`;

            if (isCustomer) {
                row.innerHTML = `<p class="chat-bubble">${data.message}</p><div class="chat-row-avatar user-avatar"></div>`;
            } else {
                row.innerHTML = `<div class="chat-row-avatar agent-avatar"></div><p class="chat-bubble">${data.message}</p>`;
            }

            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
        };

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const input = form.querySelector("input[name='message']");
            if (!input || !input.value.trim()) return;

            const message = input.value.trim();

            // Bắn lên server (Server sẽ echo lại cho cả Khách và Quản lý qua onmessage)
            chatSocket.send(JSON.stringify({
                'message': message,
                'user_id': userId,
                'is_auto': false
            }));

            input.value = "";
        });
    }
});