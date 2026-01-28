let logoutTimer;

export function startInactivityTimer() {
    resetInactivityTimer();

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);
}

function resetInactivityTimer() {
    clearTimeout(logoutTimer);

    // 15 minutos de inatividade (em ms)
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

    logoutTimer = setTimeout(() => {
        doLogout();
    }, INACTIVITY_LIMIT);
}

export function doLogout() {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
}
