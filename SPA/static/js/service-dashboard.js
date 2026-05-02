document.addEventListener("DOMContentLoaded", function () {
    const body = document.body;
    const backdrop = document.querySelector("[data-backdrop]");
    const modals = document.querySelectorAll(".modal");
    let currentSelectedServiceId = null;

    function openModal(modalId) {
        modals.forEach(m => m.classList.add("hidden"));
        const target = document.getElementById(modalId);
        if (target) {
            target.classList.remove("hidden");
            if (backdrop) backdrop.classList.remove("hidden");
            body.classList.add("modal-open");
        }
    }

    function closeAllModals() {
        modals.forEach(m => m.classList.add("hidden"));
        if (backdrop) backdrop.classList.add("hidden");
        body.classList.remove("modal-open");
    }

    document.querySelectorAll("[data-modal-target]").forEach(btn => {
        btn.addEventListener("click", () => openModal(btn.dataset.modalTarget));
    });
    document.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", closeAllModals));
    if (backdrop) backdrop.addEventListener("click", closeAllModals);

    // Lấy ID khi bấm nút sửa
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-trigger');
        if (editBtn) {
            currentSelectedServiceId = editBtn.dataset.id;
            const row = document.querySelector(`tr[data-service-id="${currentSelectedServiceId}"]`);
            if (row) {
                const editForm = document.getElementById('edit-service-form');
                if(editForm) {
                    editForm.querySelector('input[name="service_id"]').value = currentSelectedServiceId;
                    editForm.querySelector('input[name="name"]').value = row.querySelector('.js-service-name').textContent.trim();
                    editForm.querySelector('textarea[name="description"]').value = row.querySelector('.js-service-desc').textContent.trim();
                    editForm.querySelector('input[name="price"]').value = row.querySelector('.js-service-price').textContent.trim();
                }
                
                const updatePriceForm = document.getElementById('update-price-form');
                if(updatePriceForm) {
                    updatePriceForm.querySelector('input[name="service_id"]').value = currentSelectedServiceId;
                    updatePriceForm.querySelector('input[name="current_price"]').value = row.querySelector('.js-service-price').textContent.trim();
                }
            }
        }
    });

    function getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || "";
    }

    // CALL API THẬT
    document.querySelectorAll("form[data-form-type]").forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            // BỌC THÉP TRÁNH SUBMIT RỖNG
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formType = form.dataset.formType;
            if (formType === "consultation-send") return; // Bỏ qua form chat

            const formData = new FormData(form);
            let endpoint = "";
            if (formType === "add-service") endpoint = "/api/services/create/";
            else if (formType === "edit-service") endpoint = "/api/services/update/";
            else if (formType === "update-price") endpoint = "/api/services/update-price/";

            try {
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "X-CSRFToken": getCsrfToken() },
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    if (formType === "add-service") {
                        window.location.reload(); 
                    } else {
                        // UPDATE UI realtime
                        const row = document.querySelector(`tr[data-service-id="${currentSelectedServiceId}"]`);
                        if (row) {
                            if (data.new_price_formatted) row.querySelector('.js-service-price').textContent = `${data.new_price_formatted}đ`;
                            if (data.new_name) row.querySelector('.js-service-name').textContent = data.new_name;
                            if (data.new_desc) row.querySelector('.js-service-desc').textContent = data.new_desc;
                        }
                        closeAllModals();
                        alert("Lưu thành công!");
                    }
                } else {
                    const errData = await res.json();
                    console.error("LỖI TỪ SERVER:", errData);
                    alert("Lỗi: " + (errData.message || "Không thể thực hiện"));
                }
            } catch (err) {
                console.error("LỖI JS:", err);
                alert("Thao tác thất bại!");
            }
        });
    });

    // WEBSOCKET CHAT MANAGER
    const chatManagerForm = document.querySelector('form[data-form-type="consultation-send"]');
    if (chatManagerForm && typeof roomId !== 'undefined') {
        const chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + roomId + '/');
        const userId = document.body.dataset.userId || 'manager';

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const chatThread = document.querySelector(".chat-thread");
            if (!chatThread) return;

            const emptyWarning = document.querySelector("[data-chat-empty-warning]");
            if (emptyWarning) emptyWarning.classList.add("hidden");

            const isManager = data.user_id == userId || data.user_id === 'bot';
            const row = document.createElement("div");
            row.className = `chat-row ${isManager ? "right" : "left"}`;
            
            if (isManager) {
                row.innerHTML = `<div class="chat-time">${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                 <div class="chat-bubble solid">${data.message}</div>
                                 <div class="manager-avatar mini"></div>`;
            } else {
                row.innerHTML = `<div class="conversation-avatar tiny"></div>
                                 <div class="chat-bubble outline">${data.message}</div>`;
            }

            chatThread.appendChild(row);
            chatThread.scrollTop = chatThread.scrollHeight;
        };

        chatManagerForm.addEventListener("submit", e => {
            e.preventDefault();
            const input = chatManagerForm.querySelector('[name="message"]');
            const msg = input.value.trim();
            if (!msg) return;
            chatSocket.send(JSON.stringify({ message: msg, user_id: userId, is_auto: false }));
            input.value = "";
        });
    }
});