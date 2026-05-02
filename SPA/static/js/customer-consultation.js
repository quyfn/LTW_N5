document.addEventListener("DOMContentLoaded", function () {

    // --- PHẦN 1: LOGIC CHO FAQ (ẨN HIỆN CÂU TRẢ LỜI) ---
    const faqToggles = document.querySelectorAll(".faq-toggle");

    faqToggles.forEach(toggle => {
        toggle.addEventListener("click", function () {
            const parent = this.parentElement;

            // Đóng các câu khác
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== parent) item.classList.remove('active');
            });

            // Toggle trạng thái của câu hiện tại
            parent.classList.toggle("active");
        });
    });

    // --- PHẦN 2: XỬ LÝ CHAT WIDGET (ẨN/HIỆN KHUNG CHAT) ---
    const toggleButton = document.querySelector("[data-chat-toggle]");
    const closeButtons = document.querySelectorAll("[data-chat-close]"); // Lấy cả 2 nút đóng và thu nhỏ
    const widget = document.querySelector("[data-chat-widget]");

    if (toggleButton && widget) {
        toggleButton.addEventListener("click", () => widget.classList.toggle("hidden"));
    }

    if (closeButtons.length > 0 && widget) {
        closeButtons.forEach(btn => {
            btn.addEventListener("click", () => widget.classList.add("hidden"));
        });
    }

    // --- PHẦN 3: WEBSOCKET VÀ AUTO-REPLY ---
    const roomId = typeof window.roomId !== 'undefined' ? window.roomId : 'default_room';
    const userId = typeof window.userId !== 'undefined' ? window.userId : 'guest';

    const chatSocket = new WebSocket(
        'ws://' + window.location.host + '/ws/chat/' + roomId + '/'
    );

    const form = document.querySelector("[data-chat-form]");

    // Xử lý khi nhận tin nhắn từ Server trả về (Giữ đồng bộ 2 bên)
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        const widget = document.querySelector("[data-chat-widget]");

        if (widget) {
            const body = widget.querySelector(".chat-body");
            const row = document.createElement("div");

            // Kiểm tra xem tin nhắn này của khách hay của Spa/Bot
            const isCustomer = (data.user_id == userId && data.user_id !== 'bot');
            row.className = "chat-row " + (isCustomer ? "right" : "left");

            if (isCustomer) {
                row.innerHTML = `
                    <p class="chat-bubble">${data.message}</p>
                    <div class="chat-row-avatar user-avatar"></div>
                `;
            } else {
                row.innerHTML = `
                    <div class="chat-row-avatar agent-avatar"></div>
                    <p class="chat-bubble">${data.message}</p>
                `;
            }

            // Nếu tin nhắn không phải do chính tab này vừa gửi thì mới in ra (tránh in trùng)
            // Tùy thuộc vào logic backend của bạn có echo lại tin nhắn không.
            // Nếu có echo, bạn nên xử lý ID tin nhắn để không in đúp.
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
        }
    };

    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
    };

    // Xử lý khi Khách hàng nhấn GỬI
    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            const input = form.querySelector("input[name='message']");
            if (!input || !input.value.trim()) return;

            const message = input.value.trim();
            const body = widget.querySelector(".chat-body");

            // 1. In ngay lập tức tin nhắn của khách lên UI (Bên phải)
            const row = document.createElement("div");
            row.className = "chat-row right";
            row.innerHTML = `
                <p class="chat-bubble">${message}</p>
                <div class="chat-row-avatar user-avatar"></div>
            `;
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;

            // Bắn tin nhắn khách qua WebSocket để lưu DB
            chatSocket.send(JSON.stringify({
                'message': message,
                'user_id': userId,
                'is_auto': false // Báo cho server đây là tin nhắn thật
            }));

            input.value = "";

            // 2. KÍCH HOẠT AUTO-REPLY SAU 1.5 GIÂY
            setTimeout(() => {
                const autoMessage = "Chào mừng bạn đến với dịch vụ Mai Trâm, bạn vui lòng đợi một chút sẽ có nhân viên tư vấn cho bạn ạ!";

                // In tin nhắn tự động lên UI của khách (Bên trái)
                const botRow = document.createElement("div");
                botRow.className = "chat-row left";
                botRow.innerHTML = `
                    <div class="chat-row-avatar agent-avatar"></div>
                    <p class="chat-bubble">${autoMessage}</p>
                `;
                body.appendChild(botRow);
                body.scrollTop = body.scrollHeight;

                // Bắn luôn tin nhắn tự động qua WebSocket để lưu vào DB và báo cho bên Manager
                chatSocket.send(JSON.stringify({
                    'message': autoMessage,
                    'user_id': 'bot', // Dấu hiệu để Backend biết đây là tin của Spa phản hồi
                    'is_auto': true
                }));

            }, 1500); // 1500 milliseconds = 1.5s
        });
    }
});