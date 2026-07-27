// Interactive Phone Simulator Database (Comparative & Spec-Driven)
const responses = {
    1: "¡Listo! He analizado la grabación de audio de tu junta 'Planeación Trimestral' (1 hora con 45 minutos).\n\n• **Resumen Ejecutivo:** Se acordó priorizar el canal de WhatsApp e incrementar el presupuesto de anuncios en un 25%.\n• **Acción Realizada:** Redacté y envié la minuta con los acuerdos y tareas asignadas por correo a todo el equipo vía Gmail.\n\n⏱️ **Tiempo transcurrido:** 12 segundos (a un humano le habría tomado 2 horas).",
    2: "He revisado tus aplicaciones conectadas:\n\n• **Personas que te escribieron:** Tienes mensajes pendientes de Carlos M. y Sofía R. en Telegram.\n• **Datos de Excel:** Consulté la hoja de stock en OneDrive. Quedan 5 licencias del producto premium. Carlos solicitó cotización de esto.\n\n💬 ¿Quieres que le envíe a Carlos la cotización formal por WhatsApp y te agende un recordatorio?\n\n⏱️ **Tiempo transcurrido:** 8 segundos (a un humano le habría tomado 1.5 horas de revisar múltiples apps).",
    3: "Instrucciones ejecutadas con éxito:\n\n• **Google Calendar:** Agendé la llamada con Carlos M. para mañana a las 10:00 AM y le envié su enlace de invitación por correo.\n• **Búsqueda de Servicio:** Busqué programadores con experiencia en automatización de APIs. Encontré 3 candidatos calificados en Workana (promedio $35 USD/hr).\n\n⏱️ **Tiempo transcurrido:** 14 segundos (a un humano le habría tomado 3 horas buscar perfiles y coordinar agendas)."
};

// Chat Simulator Actions
function sendQuickMessage(text, responseId) {
    const chatBody = document.getElementById('chat-body');
    const optionsContainer = document.getElementById('chat-options');

    // Disable option buttons during response
    optionsContainer.style.pointerEvents = 'none';
    optionsContainer.style.opacity = '0.5';

    // 1. Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'message sent';
    userMsg.innerText = text;
    chatBody.appendChild(userMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Add typing indicator
    const typingInd = document.createElement('div');
    typingInd.className = 'typing-indicator';
    typingInd.id = 'typing-indicator-active';
    typingInd.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
    setTimeout(() => {
        chatBody.appendChild(typingInd);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 450);

    // 3. Remove typing indicator and show agent response
    setTimeout(() => {
        const ind = document.getElementById('typing-indicator-active');
        if (ind) ind.remove();

        const agentMsg = document.createElement('div');
        agentMsg.className = 'message received';
        agentMsg.innerHTML = responses[responseId].replace(/\n/g, '<br>');
        chatBody.appendChild(agentMsg);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Re-enable options
        optionsContainer.style.pointerEvents = 'auto';
        optionsContainer.style.opacity = '1';
    }, 1800);
}
