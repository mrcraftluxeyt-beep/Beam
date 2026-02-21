// Класс для управления пользователями и сообщениями
class BeamChat {
    constructor() {
        this.currentUser = null;
        this.contacts = [];
        this.messages = {};
        this.currentChatContact = null;
        
        this.loadData();
        this.initEventListeners();
        this.updateUI();
    }

    // Загрузка данных из localStorage
    loadData() {
        try {
            const savedUser = localStorage.getItem('beamchat_current_user');
            const savedContacts = localStorage.getItem('beamchat_contacts');
            const savedMessages = localStorage.getItem('beamchat_messages');

            if (savedUser) this.currentUser = JSON.parse(savedUser);
            if (savedContacts) this.contacts = JSON.parse(savedContacts);
            if (savedMessages) this.messages = JSON.parse(savedMessages);
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            this.resetData();
        }
    }

    // Сохранение данных
    saveData() {
        localStorage.setItem('beamchat_current_user', JSON.stringify(this.currentUser));
        localStorage.setItem('beamchat_contacts', JSON.stringify(this.contacts));
        localStorage.setItem('beamchat_messages', JSON.stringify(this.messages));
    }

    // Сброс данных
    resetData() {
        this.currentUser = null;
        this.contacts = [];
        this.messages = {};
        this.saveData();
    }

    // Регистрация пользователя
    register(nickname, phone) {
        // Валидация
        if (!nickname || nickname.length < 3) {
            return { success: false, error: 'Никнейм должен содержать минимум 3 символа' };
        }
        if (!phone || phone.length < 10) {
            return { success: false, error: 'Введите корректный номер телефона' };
        }

        // Проверка существующего пользователя
        const allUsers = this.getAllUsers();
        if (allUsers.some(u => u.phone === phone)) {
            return { success: false, error: 'Пользователь с таким номером уже существует' };
        }
        if (allUsers.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
            return { success: false, error: 'Пользователь с таким никнеймом уже существует' };
        }

        // Создание пользователя
        this.currentUser = {
            nickname: nickname.trim(),
            phone: phone.trim(),
            registeredAt: new Date().toISOString()
        };

        // Сохраняем пользователя в общий список
        this.saveUserToGlobalList(this.currentUser);
        this.saveData();
        
        return { success: true };
    }

    // Получение всех пользователей
    getAllUsers() {
        const users = localStorage.getItem('beamchat_all_users');
        return users ? JSON.parse(users) : [];
    }

    // Сохранение пользователя в глобальный список
    saveUserToGlobalList(user) {
        const users = this.getAllUsers();
        if (!users.some(u => u.phone === user.phone)) {
            users.push(user);
            localStorage.setItem('beamchat_all_users', JSON.stringify(users));
        }
    }

    // Поиск пользователя по никнейму и номеру
    findUser(nickname, phone) {
        const users = this.getAllUsers();
        return users.find(u => 
            u.nickname.toLowerCase() === nickname.toLowerCase() && 
            u.phone === phone
        );
    }

    // Добавление контакта
    addContact(nickname, phone) {
        // Валидация
        if (!nickname || !phone) {
            return { success: false, error: 'Заполните все поля' };
        }

        // Поиск пользователя
        const user = this.findUser(nickname, phone);
        if (!user) {
            return { success: false, error: 'Пользователь не найден' };
        }

        // Проверка на самого себя
        if (this.currentUser && this.currentUser.phone === phone) {
            return { success: false, error: 'Нельзя добавить самого себя' };
        }

        // Проверка на существование контакта
        if (this.contacts.some(c => c.phone === phone)) {
            return { success: false, error: 'Контакт уже существует' };
        }

        // Добавление контакта
        this.contacts.push({
            nickname: user.nickname,
            phone: user.phone,
            addedAt: new Date().toISOString()
        });

        // Инициализация сообщений для этого контакта
        if (!this.messages[user.phone]) {
            this.messages[user.phone] = [];
        }

        this.saveData();
        this.updateContactsUI();
        
        return { success: true };
    }

    // Отправка сообщения
    sendMessage(contactPhone, text) {
        if (!text.trim() || !this.currentUser) return;

        const message = {
            id: Date.now() + Math.random(),
            from: this.currentUser.phone,
            to: contactPhone,
            text: text.trim(),
            timestamp: new Date().toISOString(),
            outgoing: true
        };

        if (!this.messages[contactPhone]) {
            this.messages[contactPhone] = [];
        }

        this.messages[contactPhone].push(message);
        
        // Имитация получения сообщения (для демонстрации)
        this.simulateIncomingMessage(contactPhone, text);
        
        this.saveData();
        this.updateChatUI(contactPhone);
    }

    // Имитация входящего сообщения (для демо)
    simulateIncomingMessage(contactPhone, sentText) {
        setTimeout(() => {
            const replyMessage = {
                id: Date.now() + Math.random(),
                from: contactPhone,
                to: this.currentUser.phone,
                text: `Ответ на: "${sentText.substring(0, 20)}${sentText.length > 20 ? '...' : ''}"`,
                timestamp: new Date().toISOString(),
                outgoing: false
            };

            this.messages[contactPhone].push(replyMessage);
            this.saveData();
            
            // Если открыт чат с этим контактом, обновляем UI
            if (this.currentChatContact && this.currentChatContact.phone === contactPhone) {
                this.updateChatUI(contactPhone);
            }
        }, 2000);
    }

    // Получение сообщений для чата
    getChatMessages(contactPhone) {
        return this.messages[contactPhone] || [];
    }

    // Выход из аккаунта
    logout() {
        this.currentUser = null;
        this.contacts = [];
        this.messages = {};
        this.currentChatContact = null;
        this.saveData();
        this.showScreen('registerScreen');
    }

    // Обновление UI в зависимости от состояния
    updateUI() {
        if (this.currentUser) {
            this.showScreen('mainScreen');
            this.updateContactsUI();
        } else {
            this.showScreen('registerScreen');
        }
    }

    // Показ определенного экрана
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        
        // Скрываем модальное окно при смене экрана
        document.getElementById('addContactModal').classList.remove('active');
    }

    // Обновление списка контактов
    updateContactsUI() {
        const contactsList = document.getElementById('contactsList');
        const noContacts = document.getElementById('noContacts');
        
        if (this.contacts.length === 0) {
            contactsList.innerHTML = '';
            noContacts.style.display = 'block';
            return;
        }

        noContacts.style.display = 'none';
        
        contactsList.innerHTML = this.contacts.map(contact => `
            <div class="contact-item" data-phone="${contact.phone}">
                <div class="contact-avatar">
                    ${contact.nickname.charAt(0).toUpperCase()}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contact.nickname}</div>
                    <div class="contact-details">
                        <span>@${contact.nickname}</span>
                        <span class="contact-phone">${contact.phone}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики для контактов
        document.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', () => {
                const phone = item.dataset.phone;
                const contact = this.contacts.find(c => c.phone === phone);
                if (contact) {
                    this.openChat(contact);
                }
            });
        });
    }

    // Открытие чата с контактом
    openChat(contact) {
        this.currentChatContact = contact;
        document.getElementById('chatContactName').textContent = contact.nickname;
        this.showScreen('chatScreen');
        this.updateChatUI(contact.phone);
    }

    // Обновление UI чата
    updateChatUI(contactPhone) {
        const messages = this.getChatMessages(contactPhone);
        const chatMessages = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="text-center" style="color: #999; margin-top: 50px;">Нет сообщений. Напишите что-нибудь!</div>';
            return;
        }

        chatMessages.innerHTML = messages.map(msg => {
            const isOutgoing = msg.from === this.currentUser.phone;
            const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="message ${isOutgoing ? 'outgoing' : 'incoming'}">
                    ${msg.text}
                    <div class="message-time">${time}</div>
                </div>
            `;
        }).join('');

        // Скролл к последнему сообщению
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Инициализация обработчиков событий
    initEventListeners() {
        // Регистрация
        document.getElementById('registerBtn').addEventListener('click', () => {
            const nickname = document.getElementById('registerNickname').value.trim();
            const phone = document.getElementById('registerPhone').value.trim();
            const errorDiv = document.getElementById('registerError');

            const result = this.register(nickname, phone);
            
            if (result.success) {
                errorDiv.style.display = 'none';
                this.updateUI();
                // Очищаем поля
                document.getElementById('registerNickname').value = '';
                document.getElementById('registerPhone').value = '';
            } else {
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
            }
        });

        // Добавление контакта (иконка)
        document.getElementById('addContactIcon').addEventListener('click', () => {
            document.getElementById('addContactModal').classList.add('active');
            // Очищаем сообщения
            document.getElementById('contactNickname').value = '';
            document.getElementById('contactPhone').value = '';
            document.getElementById('addContactError').style.display = 'none';
            document.getElementById('addContactSuccess').style.display = 'none';
        });

        // Закрытие модального окна
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('addContactModal').classList.remove('active');
        });

        // Добавление контакта (кнопка)
        document.getElementById('addContactBtn').addEventListener('click', () => {
            const nickname = document.getElementById('contactNickname').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            const errorDiv = document.getElementById('addContactError');
            const successDiv = document.getElementById('addContactSuccess');

            const result = this.addContact(nickname, phone);
            
            if (result.success) {
                errorDiv.style.display = 'none';
                successDiv.textContent = 'Контакт успешно добавлен!';
                successDiv.style.display = 'block';
                
                // Очищаем поля
                document.getElementById('contactNickname').value = '';
                document.getElementById('contactPhone').value = '';
                
                // Закрываем модальное окно через 1.5 секунды
                setTimeout(() => {
                    document.getElementById('addContactModal').classList.remove('active');
                }, 1500);
            } else {
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
                successDiv.style.display = 'none';
            }
        });

        // Отправка сообщения
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            
            if (text && this.currentChatContact) {
                this.sendMessage(this.currentChatContact.phone, text);
                input.value = '';
            }
        });

        // Отправка по Enter
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('sendMessageBtn').click();
            }
        });

        // Возврат из чата
        document.getElementById('backFromChat').addEventListener('click', () => {
            this.currentChatContact = null;
            this.showScreen('mainScreen');
        });

        // Выход из аккаунта (двойной клик на аватарку в чате)
        document.querySelector('#chatScreen .header i:last-child').addEventListener('dblclick', () => {
            if (confirm('Выйти из аккаунта?')) {
                this.logout();
            }
        });

        // Закрытие модального окна по клику на фон
        document.getElementById('addContactModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('addContactModal')) {
                document.getElementById('addContactModal').classList.remove('active');
            }
        });
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BeamChat();
});