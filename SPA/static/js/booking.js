document.addEventListener("DOMContentLoaded", function () {
    const steps = Array.from(document.querySelectorAll(".booking-step"));
    const indicators = Array.from(document.querySelectorAll("[data-step-indicator]"));
    const prevBtn = document.getElementById("prev-step-btn");
    const nextBtn = document.getElementById("next-step-btn");
    const serviceGrid = document.getElementById("serviceGrid");
    const packageGrid = document.getElementById("package-grid");
    const timeslotGrid = document.getElementById("timeslot-grid");
    const noteInput = document.getElementById("customer-note");

    if (!steps.length || !serviceGrid || !packageGrid || !timeslotGrid) return;

    const packageData = JSON.parse(document.getElementById("booking-packages-data").textContent || "{}");
    const slotData = JSON.parse(document.getElementById("booking-slots-data").textContent || "{}");
    const slots = JSON.parse(document.getElementById("booking-time-slots-data").textContent || "[]");

    const state = {
        step: 1,
        service: null,
        serviceName: "",
        package: null,
        packageName: "",
        packageSessions: "",
        packagePrice: "",
        packagePriceValue: "",
        packageResult: "",
        date: "",
        time: "",
    };

    function resetAfterServiceChange() {
        state.package = null;
        state.packageName = "";
        state.packageSessions = "";
        state.packagePrice = "";
        state.packagePriceValue = "";
        state.packageResult = "";
        state.date = "";
        state.time = "";
        timeslotGrid.innerHTML = "";
        document.querySelectorAll("[data-calendar-day]").forEach((btn) => btn.classList.remove("is-selected"));
    }

    function updateSummary() {
        const values = {
            "summary-service": state.serviceName || "Chưa chọn",
            "summary-package": state.packageName || "Chưa chọn",
            "summary-sessions": state.packageSessions || "Chưa chọn",
            "summary-date": state.date ? formatDate(state.date) : "Chưa chọn",
            "summary-time": state.time || "Chưa chọn",
            "summary-price": state.packagePrice || "Chưa chọn",
            "summary-result": state.packageResult || "Chưa chọn",
        };
        Object.entries(values).forEach(([id, text]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        });
    }

    function renderStep() {
        steps.forEach((stepEl) => {
            stepEl.classList.toggle("is-active", Number(stepEl.dataset.step) === state.step);
        });
        indicators.forEach((item) => {
            item.classList.toggle("is-active", Number(item.dataset.stepIndicator) === state.step);
        });
        prevBtn.disabled = state.step === 1;
        nextBtn.textContent = state.step === 4 ? "Xác nhận đặt lịch" : "Tiếp theo →";
        updateSummary();
    }

    function formatDate(iso) {
        const [year, month, day] = iso.split("-");
        return `${day}/${month}/${year}`;
    }

    function renderPackages(serviceId) {
        packageGrid.innerHTML = "";
        const items = packageData[String(serviceId)] || [];
        if (!items.length) {
            packageGrid.innerHTML = '<p class="empty-inline">Chưa có gói cho dịch vụ này.</p>';
            return;
        }

        items.forEach((item) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "package-card";
            const benefits = (item.benefits || []).map((text) => `<li>✓ ${text}</li>`).join("");
            btn.innerHTML = `
                <h3>${item.name}</h3>
                <p class="package-sessions">${item.sessions} buổi điều trị</p>
                <ul class="package-benefits">${benefits}</ul>
                <p class="package-price">${item.price}</p>
                <p class="package-note">${item.result || ""}</p>
            `;
            btn.addEventListener("click", function () {
                packageGrid.querySelectorAll(".package-card").forEach((card) => card.classList.remove("is-selected"));
                btn.classList.add("is-selected");
                state.package = item.id;
                state.packageName = item.name;
                state.packageSessions = `${item.sessions} buổi`;
                state.packagePrice = item.price;
                state.packagePriceValue = item.price_value || item.price;
                state.packageResult = item.result || "";
                updateSummary();
            });
            packageGrid.appendChild(btn);
        });
    }

    function renderSlots(dayIso) {
        timeslotGrid.innerHTML = "";
        if (!dayIso) return;
        const booked = new Set((slotData[dayIso] || []).map((slot) => String(slot).slice(0, 5)));
        slots.forEach((slot) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = slot;
            const isBooked = booked.has(slot);
            btn.classList.add(isBooked ? "is-booked" : "is-available");
            btn.setAttribute("aria-label", isBooked ? `${slot} đã bận` : `${slot} còn trống`);
            btn.title = isBooked ? "Khung giờ đã bận" : "Khung giờ còn trống";
            if (isBooked) {
                btn.disabled = true;
                btn.setAttribute("aria-disabled", "true");
            }
            btn.addEventListener("click", function () {
                if (btn.disabled) return;
                timeslotGrid.querySelectorAll("button").forEach((item) => item.classList.remove("is-selected"));
                btn.classList.add("is-selected");
                state.time = slot;
                updateSummary();
            });
            timeslotGrid.appendChild(btn);
        });
    }

    async function refreshSlots(dayIso) {
        if (!dayIso) return;
        try {
            const response = await fetch(`/dat-lich/khung-gio/?date=${encodeURIComponent(dayIso)}`, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });
            if (!response.ok) return;
            const data = await response.json();
            slotData[dayIso] = data.booked_slots || data.slots || [];
            if (state.date === dayIso) {
                const selectedTime = state.time;
                renderSlots(dayIso);
                if (selectedTime && !slotData[dayIso].includes(selectedTime)) {
                    const selectedBtn = Array.from(timeslotGrid.querySelectorAll("button"))
                        .find((btn) => btn.textContent === selectedTime);
                    if (selectedBtn) selectedBtn.classList.add("is-selected");
                } else if (selectedTime) {
                    state.time = "";
                    updateSummary();
                }
            }
        } catch (error) {
            // Giữ nguyên dữ liệu đang có nếu mạng tạm thời lỗi.
        }
    }

    function connectBookingSlotsSocket() {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(`${protocol}://${window.location.host}/ws/booking-slots/`);

        socket.addEventListener("open", function () {
            if (state.date) socket.send(JSON.stringify({ date: state.date }));
        });

        socket.addEventListener("message", function (event) {
            const data = JSON.parse(event.data || "{}");
            if (data.type !== "slots_update" || !data.date) return;
            slotData[data.date] = data.slots || [];
            if (state.date === data.date) {
                const selectedTime = state.time;
                renderSlots(state.date);
                if (selectedTime && !slotData[state.date].includes(selectedTime)) {
                    const selectedBtn = Array.from(timeslotGrid.querySelectorAll("button"))
                        .find((btn) => btn.textContent === selectedTime);
                    if (selectedBtn) selectedBtn.classList.add("is-selected");
                } else if (selectedTime) {
                    state.time = "";
                    updateSummary();
                }
            }
        });

        socket.addEventListener("close", function () {
            window.setTimeout(connectBookingSlotsSocket, 3000);
        });

        window.bookingSlotsSocket = socket;
    }

    function applyServiceFilters() {
        const searchInput = document.getElementById("search-service");
        const priceSort = document.getElementById("priceSort-service");
        const emptyState = document.getElementById("emptyStateService");
        const activeChip = document.querySelector(".filter-chip.active");
        const keyword = (searchInput?.value || "").trim().toLowerCase();
        const category = activeChip?.dataset.category || "all";
        const cards = Array.from(serviceGrid.querySelectorAll(".service-card"));

        const visibleCards = cards.filter((card) => {
            const name = (card.dataset.serviceName || "").toLowerCase();
            const description = (card.dataset.serviceDescription || "").toLowerCase();
            const matchesKeyword = !keyword || name.includes(keyword) || description.includes(keyword);
            const matchesCategory = category === "all" || card.dataset.category === category;
            const isVisible = matchesKeyword && matchesCategory;
            card.classList.toggle("hidden", !isVisible);
            return isVisible;
        });

        visibleCards
            .sort((a, b) => {
                const priceA = Number(a.dataset.servicePrice || 0);
                const priceB = Number(b.dataset.servicePrice || 0);
                if (priceSort?.value === "asc") return priceA - priceB;
                if (priceSort?.value === "desc") return priceB - priceA;
                return cards.indexOf(a) - cards.indexOf(b);
            })
            .forEach((card) => serviceGrid.appendChild(card));

        if (emptyState) {
            emptyState.classList.toggle("hidden", visibleCards.length > 0);
        }
    }

    document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".filter-chip").forEach((item) => item.classList.remove("active"));
            chip.classList.add("active");
            applyServiceFilters();
        });
    });
    document.getElementById("search-service")?.addEventListener("input", applyServiceFilters);
    document.getElementById("priceSort-service")?.addEventListener("change", applyServiceFilters);

    serviceGrid.querySelectorAll("[data-service-card]").forEach((card) => {
        card.addEventListener("click", function () {
            serviceGrid.querySelectorAll("[data-service-card]").forEach((item) => item.classList.remove("is-selected"));
            card.classList.add("is-selected");
            resetAfterServiceChange();
            state.service = card.dataset.serviceId;
            state.serviceName = card.dataset.serviceName || "";
            renderPackages(state.service);
            updateSummary();
        });
    });

    document.querySelectorAll("[data-calendar-day]").forEach((dayBtn) => {
        dayBtn.addEventListener("click", function () {
            document.querySelectorAll("[data-calendar-day]").forEach((item) => item.classList.remove("is-selected"));
            dayBtn.classList.add("is-selected");
            state.date = dayBtn.dataset.date || "";
            state.time = "";
            renderSlots(state.date);
            refreshSlots(state.date);
            if (window.bookingSlotsSocket?.readyState === WebSocket.OPEN) {
                window.bookingSlotsSocket.send(JSON.stringify({ date: state.date }));
            }
            updateSummary();
        });
    });

    function canMoveForward() {
        if (state.step === 1) return Boolean(state.service);
        if (state.step === 2) return Boolean(state.package);
        if (state.step === 3) return Boolean(state.date && state.time);
        return true;
    }

    prevBtn.addEventListener("click", function () {
        if (state.step > 1) {
            state.step -= 1;
            renderStep();
        }
    });

    nextBtn.addEventListener("click", function () {
        if (state.step < 4) {
            if (!canMoveForward()) {
                alert("Vui lòng chọn đầy đủ thông tin trước khi tiếp tục.");
                return;
            }
            state.step += 1;
            renderStep();
            return;
        }

        document.getElementById("booking-service-id").value = state.service || "";
        document.getElementById("booking-package-name").value = state.packageName || "";
        document.getElementById("booking-sessions").value = state.packageSessions || "";
        document.getElementById("booking-package-desc").value = state.packageResult || "";
        document.getElementById("booking-appointment-date").value = state.date || "";
        document.getElementById("booking-appointment-time").value = state.time || "";
        document.getElementById("booking-total-price").value = state.packagePriceValue || state.packagePrice || "";
        document.getElementById("booking-notes").value = noteInput?.value || "";
        document.getElementById("booking-submit-form").submit();
    });

    applyServiceFilters();
    renderStep();
    connectBookingSlotsSocket();
    window.setInterval(function () {
        if (state.step === 3 && state.date) {
            refreshSlots(state.date);
        }
    }, 3000);
});
