(function () {
    'use strict';

    const WataBubble = {
        config: {
            botId: null,
            color: '#8B5CF6',
            position: 'right',
            apiUrl: 'https://api.wataomi.com'
        },

        init: function (options) {
            this.config = { ...this.config, ...options };
            if (!this.config.botId) {
                console.error('WataBubble: botId is required');
                return;
            }
            this.injectStyles();
            this.createBubble();
            this.createChatWindow();
        },

        injectStyles: function () {
            const styles = `
        .watabubble-container { position: fixed; bottom: 20px; ${this.config.position}: 20px; z-index: 999999; }
        .watabubble-button { width: 60px; height: 60px; border-radius: 50%; background: ${this.config.color}; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-center; transition: transform 0.2s; }
        .watabubble-button:hover { transform: scale(1.1); }
        .watabubble-button svg { width: 28px; height: 28px; fill: white; }
        .watabubble-chat { position: fixed; bottom: 100px; ${this.config.position}: 20px; width: 380px; height: 600px; background: #1a1a1a; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); display: none; flex-direction: column; z-index: 999998; }
        .watabubble-chat.open { display: flex; }
        .watabubble-header { background: ${this.config.color}; color: white; padding: 16px; border-radius: 16px 16px 0 0; font-family: system-ui, -apple-system, sans-serif; font-weight: 600; }
        .watabubble-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .watabubble-message { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; font-family: system-ui, -apple-system, sans-serif; }
        .watabubble-message.bot { background: #2a2a2a; color: #fff; align-self: flex-start; }
        .watabubble-message.user { background: ${this.config.color}; color: white; align-self: flex-end; }
        .watabubble-input-container { padding: 16px; border-top: 1px solid #333; display: flex; gap: 8px; }
        .watabubble-input { flex: 1; padding: 10px; border-radius: 20px; border: 1px solid #333; background: #2a2a2a; color: white; font-size: 14px; font-family: system-ui, -apple-system, sans-serif; outline: none; }
        .watabubble-send { background: ${this.config.color}; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-center; }
      `;
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        },

        createBubble: function () {
            const container = document.createElement('div');
            container.className = 'watabubble-container';
            container.innerHTML = `
        <button class="watabubble-button" id="watabubble-toggle">
          <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
      `;
            document.body.appendChild(container);

            document.getElementById('watabubble-toggle').addEventListener('click', () => {
                this.toggleChat();
            });
        },

        createChatWindow: function () {
            const chatWindow = document.createElement('div');
            chatWindow.className = 'watabubble-chat';
            chatWindow.id = 'watabubble-chat';
            chatWindow.innerHTML = `
        <div class="watabubble-header">WataOmi Assistant</div>
        <div class="watabubble-messages" id="watabubble-messages">
          <div class="watabubble-message bot">Hi! How can I help you today?</div>
        </div>
        <div class="watabubble-input-container">
          <input type="text" class="watabubble-input" id="watabubble-input" placeholder="Type a message..." />
          <button class="watabubble-send" id="watabubble-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      `;
            document.body.appendChild(chatWindow);

            const input = document.getElementById('watabubble-input');
            const sendBtn = document.getElementById('watabubble-send');

            const sendMessage = () => {
                const message = input.value.trim();
                if (!message) return;

                this.addMessage(message, 'user');
                input.value = '';

                // Simulate bot response (replace with actual API call)
                setTimeout(() => {
                    this.addMessage('Thanks for your message! Our team will respond shortly.', 'bot');
                }, 1000);
            };

            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        },

        toggleChat: function () {
            const chat = document.getElementById('watabubble-chat');
            chat.classList.toggle('open');
        },

        addMessage: function (text, sender) {
            const messagesContainer = document.getElementById('watabubble-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `watabubble-message ${sender}`;
            messageDiv.textContent = text;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    window.WataBubble = WataBubble;
})();
