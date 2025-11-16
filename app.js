// app.js - Supercharged Main application logic
const LifeTrackerApp = {
    init() {
        this.currentDate = new Date();
        this.currentViewMonth = new Date();
        this.workoutViewMonth = new Date();
        this.hygieneViewMonth = new Date();
        this.selectedWorkoutTemplate = null;
        this.charts = {};
        
        this.setupEventListeners();
        this.updateCurrentDate();
        this.initializeApp();
        this.setupEmailAutomation();
    },

    async initializeApp() {
        try {
            await db.open();
            console.log('Database opened successfully');
            
            // Initialize default data
            await this.initializeDefaultData();
            
            // Check for daily email report
            await this.checkDailyEmailReport();
            
            this.renderAllPages();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    },

    async initializeDefaultData() {
        // Check if we have any workout templates
        const templates = await db.workoutTemplates.toArray();
        if (templates.length === 0) {
            const defaultTemplateId = await db.workoutTemplates.add({
                name: "Full Body Workout",
                createdAt: new Date(),
                category: "strength"
            });
            this.selectedWorkoutTemplate = defaultTemplateId;
            
            await db.workoutExercises.bulkAdd([
                { templateId: defaultTemplateId, name: "Squats", pr: "", order: 1, createdAt: new Date(), targetSets: 3, targetReps: 10 },
                { templateId: defaultTemplateId, name: "Push-ups", pr: "", order: 2, createdAt: new Date(), targetSets: 3, targetReps: 15 },
                { templateId: defaultTemplateId, name: "Pull-ups", pr: "", order: 3, createdAt: new Date(), targetSets: 3, targetReps: 8 }
            ]);
        } else {
            this.selectedWorkoutTemplate = templates[0].id;
        }

        // Initialize default goals
        const goals = await db.goals.toArray();
        if (goals.length === 0) {
            await db.goals.bulkAdd([
                {
                    title: "30-Day Dopamine Control",
                    description: "Complete 30 consecutive days of dopamine control",
                    type: "streak",
                    targetValue: 30,
                    currentValue: 0,
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    completed: false,
                    createdAt: new Date()
                },
                {
                    title: "Perfect Hygiene Week",
                    description: "Complete all hygiene habits for 7 consecutive days",
                    type: "completion",
                    targetValue: 7,
                    currentValue: 0,
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    completed: false,
                    createdAt: new Date()
                }
            ]);
        }
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Module cards on dashboard
        document.addEventListener('click', (e) => {
            if (e.target.closest('.module-card')) {
                const card = e.target.closest('.module-card');
                const targetPage = card.getAttribute('data-page');
                this.showPage(targetPage);
            }
        });

        // Settings button
        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showPage('database');
        });

        // Email report button
        document.getElementById('emailReportButton').addEventListener('click', () => {
            this.showEmailReportModal();
        });

        // Quick mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = parseInt(btn.getAttribute('data-mood'));
                const energy = parseInt(btn.getAttribute('data-energy'));
                const numb = parseInt(btn.getAttribute('data-numb'));
                this.quickLogMood(mood, energy, numb);
            });
        });

        // Modal handlers
        this.setupModalHandlers();
    },

    setupModalHandlers() {
        // Dopamine modal
        document.getElementById('closeDopamineModal').addEventListener('click', () => {
            this.hideModal('dopamineModal');
        });

        document.getElementById('cancelDopamineLog').addEventListener('click', () => {
            this.hideModal('dopamineModal');
        });

        document.getElementById('saveDopamineLog').addEventListener('click', () => {
            this.saveDopamineEntry();
        });

        // Habit modal
        document.getElementById('closeHabitModal').addEventListener('click', () => {
            this.hideModal('habitModal');
        });

        document.getElementById('cancelHabit').addEventListener('click', () => {
            this.hideModal('habitModal');
        });

        document.getElementById('saveHabit').addEventListener('click', () => {
            this.saveHabit();
        });

        // Workout modal
        document.getElementById('closeWorkoutModal').addEventListener('click', () => {
            this.hideModal('workoutModal');
        });

        document.getElementById('cancelWorkout').addEventListener('click', () => {
            this.hideModal('workoutModal');
        });

        document.getElementById('saveWorkout').addEventListener('click', () => {
            this.saveWorkoutTemplate();
        });

        // Exercise modal
        document.getElementById('closeExerciseModal').addEventListener('click', () => {
            this.hideModal('exerciseModal');
        });

        document.getElementById('cancelExercise').addEventListener('click', () => {
            this.hideModal('exerciseModal');
        });

        document.getElementById('saveExercise').addEventListener('click', () => {
            this.saveExercise();
        });

        // Mood modal
        document.getElementById('closeMoodModal').addEventListener('click', () => {
            this.hideModal('moodModal');
        });

        document.getElementById('cancelMoodLog').addEventListener('click', () => {
            this.hideModal('moodModal');
        });

        document.getElementById('saveMoodLog').addEventListener('click', () => {
            this.saveMoodEntry();
        });

        // Email modal
        document.getElementById('closeEmailModal').addEventListener('click', () => {
            this.hideModal('emailReportModal');
        });

        document.getElementById('cancelEmailReport').addEventListener('click', () => {
            this.hideModal('emailReportModal');
        });

        document.getElementById('sendEmailReport').addEventListener('click', () => {
            this.sendEmailReport();
        });
    },

    updateCurrentDate() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = 
            this.currentDate.toLocaleDateString('en-US', options);
    },

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });

        // Show selected page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        // Render page content
        switch(pageId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'dopamine':
                this.renderDopaminePage();
                break;
            case 'hygiene':
                this.renderHygienePage();
                break;
            case 'workout':
                this.renderWorkoutPage();
                break;
            case 'mood':
                this.renderMoodPage();
                break;
            case 'analytics':
                this.renderAnalyticsPage();
                break;
            case 'database':
                this.renderDatabasePage();
                break;
        }
    },

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    // Enhanced Dashboard
    async renderDashboard() {
        const today = this.formatDate(new Date());
        const currentStreak = await this.calculateCurrentStreak();
        const completionRate = await this.calculateTodayCompletion(today);
        const todayMood = await this.getTodayMood();
        const focusTime = await this.getTodayFocusTime();

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('todayCompletion').textContent = completionRate + '%';
        document.getElementById('moodScore').textContent = todayMood ? `${todayMood.mood}/5` : '-';
        document.getElementById('focusTime').textContent = focusTime + 'm';

        // Render enhanced dashboard
        const dashboardEl = document.getElementById('dashboard');
        dashboardEl.innerHTML = `
            <div class="welcome-card">
                <h2>Welcome to Life Tracker Pro!</h2>
                <p>Your supercharged productivity companion</p>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="currentStreak">${currentStreak}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="todayCompletion">${completionRate}%</div>
                        <div class="stat-label">Today's Progress</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="moodScore">${todayMood ? `${todayMood.mood}/5` : '-'}</div>
                        <div class="stat-label">Today's Mood</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="focusTime">${focusTime}m</div>
                        <div class="stat-label">Focus Time</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Actions</div>
                </div>
                <div class="module-card" data-page="dopamine">
                    <div class="module-icon" style="background: var(--ig-primary);">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Dopamine Control</div>
                        <div class="module-desc">Track your daily progress</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div class="module-card" data-page="hygiene">
                    <div class="module-icon" style="background: var(--ig-blue);">
                        <i class="fas fa-shower"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Personal Hygiene</div>
                        <div class="module-desc">Daily routine tracker</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div class="module-card" data-page="workout">
                    <div class="module-icon" style="background: var(--success);">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Workout</div>
                        <div class="module-desc">Exercise tracking & analytics</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="module-card" data-page="mood">
                    <div class="module-icon" style="background: var(--ig-purple);">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Mood & Energy</div>
                        <div class="module-desc">Track how you feel</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="module-card" data-page="analytics">
                    <div class="module-icon" style="background: var(--ig-orange);">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Analytics</div>
                        <div class="module-desc">Data visualization & insights</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>

            <!-- Quick Mood Log -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Mood Check</div>
                </div>
                <div class="mood-quick-actions">
                    <div class="mood-btn" data-mood="5" data-energy="5" data-numb="1">
                        <div class="mood-emoji">😊</div>
                        <div class="mood-label">Great</div>
                    </div>
                    <div class="mood-btn" data-mood="4" data-energy="4" data-numb="2">
                        <div class="mood-emoji">😄</div>
                        <div class="mood-label">Good</div>
                    </div>
                    <div class="mood-btn" data-mood="3" data-energy="3" data-numb="3">
                        <div class="mood-emoji">😐</div>
                        <div class="mood-label">Okay</div>
                    </div>
                    <div class="mood-btn" data-mood="2" data-energy="2" data-numb="4">
                        <div class="mood-emoji">😔</div>
                        <div class="mood-label">Low</div>
                    </div>
                    <div class="mood-btn" data-mood="1" data-energy="1" data-numb="5">
                        <div class="mood-emoji">😢</div>
                        <div class="mood-label">Poor</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">This Week</div>
                </div>
                <div class="calendar-container" id="dashboardCalendar">
                    <!-- Calendar will be populated by JavaScript -->
                </div>
            </div>
        `;

        // Add event listeners for dashboard modules
        dashboardEl.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const targetPage = card.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Add event listeners for quick mood buttons
        dashboardEl.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = parseInt(btn.getAttribute('data-mood'));
                const energy = parseInt(btn.getAttribute('data-energy'));
                const numb = parseInt(btn.getAttribute('data-numb'));
                this.quickLogMood(mood, energy, numb);
            });
        });

        this.renderDashboardCalendar();
    },

    async renderDashboardCalendar() {
        const calendarEl = document.getElementById('dashboardCalendar');
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let calendarHTML = `
            <div class="calendar-header">
                <div class="calendar-month">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div class="calendar-nav">
                    <div class="calendar-nav-btn" id="prevDashboardMonth">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="calendar-nav-btn" id="nextDashboardMonth">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            <div class="calendar">
        `;
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === now.getDate() && now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear()) {
                dayClass += ' current';
            }
            
            // Check dopamine status for this day
            const dopamineEntry = await db.dopamineEntries.where('date').equals(dateKey).first();
            if (dopamineEntry) {
                dayClass += dopamineEntry.status === 'passed' ? ' passed' : ' failed';
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        calendarEl.innerHTML = calendarHTML;

        // Add event listeners for dashboard calendar navigation
        const prevBtn = document.getElementById('prevDashboardMonth');
        const nextBtn = document.getElementById('nextDashboardMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() - 1);
                this.renderDashboardCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() + 1);
                this.renderDashboardCalendar();
            });
        }
    },

    // Dopamine Page
    async renderDopaminePage() {
        const dopamineEl = document.getElementById('dopamine');
        const currentStreak = await this.calculateCurrentStreak();
        const longestStreak = await this.calculateLongestStreak();
        const recentEntries = await this.getRecentDopamineEntries();

        dopamineEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Dopamine Control</div>
                    <div class="card-more" id="dopamineCalendarNav">
                        <i class="fas fa-calendar"></i>
                    </div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevDopamineMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextDopamineMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="dopamineCalendar">
                        ${await this.renderDopamineCalendar()}
                    </div>
                </div>
                
                <div class="streak-display">
                    <div class="streak-info">
                        <div class="streak-value">${currentStreak}</div>
                        <div class="streak-label">Current Streak</div>
                    </div>
                    <div class="streak-info">
                        <div class="streak-value">${longestStreak}</div>
                        <div class="streak-label">Longest Streak</div>
                    </div>
                </div>
                
                <button class="btn btn-primary" id="logDopamineStatus">
                    <i class="fas fa-plus"></i> Log Today's Status
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Entries</div>
                </div>
                <div id="dopamineEntries">
                    ${recentEntries.length > 0 ? recentEntries : `
                        <div class="empty-state">
                            <i class="fas fa-brain"></i>
                            <p>No entries yet</p>
                            <p>Start tracking your progress today!</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('prevDopamineMonth').addEventListener('click', () => {
            this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() - 1);
            this.renderDopaminePage();
        });

        document.getElementById('nextDopamineMonth').addEventListener('click', () => {
            this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() + 1);
            this.renderDopaminePage();
        });

        document.getElementById('logDopamineStatus').addEventListener('click', () => {
            this.showDopamineModal();
        });

        // Add click handlers for entries
        dopamineEl.querySelectorAll('.edit-dopamine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = parseInt(btn.getAttribute('data-id'));
                this.editDopamineEntry(entryId);
            });
        });
    },

    async renderDopamineCalendar() {
        const firstDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), 1);
        const lastDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.currentViewMonth.getMonth() === today.getMonth() && this.currentViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check dopamine status
            const dopamineEntry = await db.dopamineEntries.where('date').equals(dateKey).first();
            if (dopamineEntry) {
                dayClass += dopamineEntry.status === 'passed' ? ' passed' : ' failed';
                if (dopamineEntry.notes) {
                    dayClass += ' has-notes';
                }
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showDopamineModal(entry = null) {
        const today = this.formatDate(new Date());
        document.getElementById('dopamineDate').value = entry ? entry.date : today;
        document.getElementById('dopamineStatus').value = entry ? entry.status : 'passed';
        document.getElementById('dopamineNotes').value = entry ? entry.notes : '';
        
        if (entry) {
            document.querySelector('#dopamineModal .modal-title').textContent = 'Edit Dopamine Entry';
            document.getElementById('saveDopamineLog').setAttribute('data-edit-id', entry.id);
        } else {
            document.querySelector('#dopamineModal .modal-title').textContent = 'Log Dopamine Status';
            document.getElementById('saveDopamineLog').removeAttribute('data-edit-id');
        }
        
        this.showModal('dopamineModal');
    },

    async saveDopamineEntry() {
        const date = document.getElementById('dopamineDate').value;
        const status = document.getElementById('dopamineStatus').value;
        const notes = document.getElementById('dopamineNotes').value;
        const editId = document.getElementById('saveDopamineLog').getAttribute('data-edit-id');

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            if (editId) {
                // Update existing entry
                await db.dopamineEntries.update(parseInt(editId), {
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            } else {
                // Create new entry
                await db.dopamineEntries.add({
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('dopamineModal');
            this.renderDopaminePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error saving dopamine entry:', error);
            alert('Error saving entry. Please try again.');
        }
    },

    async getRecentDopamineEntries() {
        const entries = await db.dopamineEntries.orderBy('date').reverse().limit(5).toArray();
        
        return entries.map(entry => `
            <div class="log-entry">
                <div class="log-date">
                    ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <div class="log-actions">
                        <div class="log-action edit-dopamine" data-id="${entry.id}">
                            <i class="fas fa-edit"></i>
                        </div>
                    </div>
                </div>
                <div class="log-status ${entry.status === 'passed' ? 'status-passed' : 'status-failed'}">
                    ${entry.status === 'passed' ? 'Successful Day' : 'Challenging Day'}
                </div>
                <div class="log-notes">${entry.notes || 'No notes'}</div>
            </div>
        `).join('');
    },

    async editDopamineEntry(entryId) {
        const entry = await db.dopamineEntries.get(entryId);
        if (entry) {
            this.showDopamineModal(entry);
        }
    },

    // Hygiene Page
    async renderHygienePage() {
        const hygieneEl = document.getElementById('hygiene');
        const habits = await db.hygieneHabits.toArray();
        const today = this.formatDate(new Date());
        const completionRate = await this.calculateHygieneCompletion(today);

        let habitsHTML = '';
        for (const habit of habits) {
            const completed = await this.isHabitCompletedToday(habit.id);
            habitsHTML += `
                <div class="habit-item ${completed ? 'swipe-completed' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-icon">
                        <i class="fas fa-${this.getHabitIcon(habit.name)}"></i>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-desc">${habit.description}</div>
                    </div>
                    <div class="habit-check ${completed ? 'completed' : ''}">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        }

        hygieneEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Daily Hygiene</div>
                    <div class="card-more">
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
                
                ${habitsHTML || `
                    <div class="empty-state">
                        <i class="fas fa-shower"></i>
                        <p>No habits added yet</p>
                    </div>
                `}
                
                <div class="completion-card">
                    <div class="completion-value">${completionRate}%</div>
                    <div class="completion-label">Today's Completion</div>
                </div>
            </div>
            
            <button class="btn btn-primary" id="addHygieneHabit">
                <i class="fas fa-plus"></i> Add New Habit
            </button>

            <div class="card mt-20">
                <div class="card-header">
                    <div class="card-title">Hygiene Calendar</div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.hygieneViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevHygieneMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextHygieneMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="hygieneCalendar">
                        ${await this.renderHygieneCalendar()}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addHygieneHabit').addEventListener('click', () => {
            this.showHabitModal();
        });

        document.getElementById('prevHygieneMonth').addEventListener('click', () => {
            this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() - 1);
            this.renderHygienePage();
        });

        document.getElementById('nextHygieneMonth').addEventListener('click', () => {
            this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() + 1);
            this.renderHygienePage();
        });

        // Add click handlers for habits
        hygieneEl.querySelectorAll('.habit-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const habitId = parseInt(item.getAttribute('data-habit-id'));
                const completed = item.classList.contains('swipe-completed');
                this.toggleHabitCompletion(habitId, !completed);
            });
        });
    },

    getHabitIcon(habitName) {
        const icons = {
            'Brush Teeth': 'tooth',
            'Face Wash': 'water',
            'Bath / Shower': 'bath',
            'Hair Care': 'wind',
            'Perfume / Cologne': 'spray-can'
        };
        return icons[habitName] || 'check-circle';
    },

    async toggleHabitCompletion(habitId, completed) {
        const today = this.formatDate(new Date());
        
        try {
            // Check if completion record already exists for today
            const existingCompletion = await db.hygieneCompletions
                .where('habitId').equals(habitId)
                .and(item => item.date === today)
                .first();

            if (existingCompletion) {
                await db.hygieneCompletions.update(existingCompletion.id, { 
                    completed,
                    createdAt: new Date()
                });
            } else {
                await db.hygieneCompletions.add({
                    habitId,
                    date: today,
                    completed,
                    createdAt: new Date()
                });
            }

            await this.updateDailyCompletion();
            this.renderHygienePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error toggling habit completion:', error);
        }
    },

    async isHabitCompletedToday(habitId) {
        const today = this.formatDate(new Date());
        const completion = await db.hygieneCompletions
            .where('habitId').equals(habitId)
            .and(item => item.date === today)
            .first();
        
        return completion ? completion.completed : false;
    },

    async calculateHygieneCompletion(date) {
        const habits = await db.hygieneHabits.toArray();
        const completions = await db.hygieneCompletions.where('date').equals(date).toArray();
        
        let completedCount = 0;
        habits.forEach(habit => {
            const completion = completions.find(c => c.habitId === habit.id);
            if (completion && completion.completed) {
                completedCount++;
            }
        });
        
        return habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
    },

    async renderHygieneCalendar() {
        const firstDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), 1);
        const lastDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.hygieneViewMonth.getMonth() === today.getMonth() && this.hygieneViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check hygiene completion for this day
            const completionRate = await this.calculateHygieneCompletion(dateKey);
            if (completionRate >= 80) {
                dayClass += ' passed';
            } else if (completionRate > 0) {
                // Partial completion - could add a different style
                dayClass += ' future'; // Keep as future for now
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showHabitModal() {
        document.getElementById('habitName').value = '';
        document.getElementById('habitDescription').value = '';
        this.showModal('habitModal');
    },

    async saveHabit() {
        const name = document.getElementById('habitName').value;
        const description = document.getElementById('habitDescription').value;

        if (!name) {
            alert('Please enter a habit name');
            return;
        }

        try {
            // Get the next order value
            const habits = await db.hygieneHabits.toArray();
            const nextOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) + 1 : 1;

            await db.hygieneHabits.add({
                name,
                description,
                order: nextOrder,
                createdAt: new Date()
            });

            this.hideModal('habitModal');
            this.renderHygienePage();
        } catch (error) {
            console.error('Error saving habit:', error);
            alert('Error saving habit. Please try again.');
        }
    },

    // Enhanced Workout Analytics
    async renderWorkoutPage() {
        const workoutEl = document.getElementById('workout');
        const templates = await db.workoutTemplates.toArray();
        const workoutStats = await this.getWorkoutStats();
        
        let templatesHTML = '';
        templates.forEach(template => {
            templatesHTML += `
                <div class="workout-option ${template.id === this.selectedWorkoutTemplate ? 'active' : ''}" data-template-id="${template.id}">
                    ${template.name}
                </div>
            `;
        });

        workoutEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Workout Tracker</div>
                </div>
                
                <div class="workout-selector" id="workoutTemplates">
                    ${templatesHTML}
                    <div class="workout-option" id="addWorkoutTemplate">
                        <i class="fas fa-plus"></i> New
                    </div>
                </div>
                
                <div class="workout-actions">
                    <button class="workout-action-btn rest-day" id="logRestDay">
                        <i class="fas fa-bed"></i> Log Rest Day
                    </button>
                    
                    <button class="workout-action-btn missed" id="logMissedWorkout">
                        <i class="fas fa-times"></i> Missed Workout
                    </button>
                </div>
                
                <div class="workout-stats">
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.weeklyCompleted}</div>
                        <div class="workout-stat-label">Workouts This Week</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.consistency}%</div>
                        <div class="workout-stat-label">Monthly Consistency</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.totalCompleted}</div>
                        <div class="workout-stat-label">Total Workouts</div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-value">${workoutStats.currentStreak}</div>
                        <div class="workout-stat-label">Day Streak</div>
                    </div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.workoutViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevWorkoutMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextWorkoutMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="workoutCalendar">
                        ${await this.renderWorkoutCalendar()}
                    </div>
                </div>
            </div>
            
            <div id="workoutExercisesContent">
                ${await this.renderWorkoutExercises()}
            </div>

            <!-- Workout Analytics -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Workout Analytics</div>
                </div>
                <div class="chart-container">
                    <canvas id="workoutFrequencyChart"></canvas>
                </div>
            </div>
        `;

        this.setupWorkoutEventListeners();
        this.renderWorkoutFrequencyChart();
    },

    setupWorkoutEventListeners() {
        document.getElementById('addWorkoutTemplate').addEventListener('click', () => {
            this.showWorkoutModal();
        });

        document.getElementById('logRestDay').addEventListener('click', () => {
            this.logWorkoutDay('rest');
        });

        document.getElementById('logMissedWorkout').addEventListener('click', () => {
            this.logWorkoutDay('missed');
        });

        document.getElementById('prevWorkoutMonth').addEventListener('click', () => {
            this.workoutViewMonth.setMonth(this.workoutViewMonth.getMonth() - 1);
            this.renderWorkoutPage();
        });

        document.getElementById('nextWorkoutMonth').addEventListener('click', () => {
            this.workoutViewMonth.setMonth(this.workoutViewMonth.getMonth() + 1);
            this.renderWorkoutPage();
        });

        // Template selection
        document.querySelectorAll('.workout-option[data-template-id]').forEach(option => {
            option.addEventListener('click', () => {
                this.selectedWorkoutTemplate = parseInt(option.getAttribute('data-template-id'));
                this.renderWorkoutPage();
            });
        });
    },

    async renderWorkoutCalendar() {
        const firstDay = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth(), 1);
        const lastDay = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.workoutViewMonth.getFullYear(), this.workoutViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.workoutViewMonth.getMonth() === today.getMonth() && this.workoutViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check workout history
            const workoutEntry = await db.workoutHistory.where('date').equals(dateKey).first();
            if (workoutEntry) {
                if (workoutEntry.type === 'completed') {
                    dayClass += ' passed';
                } else if (workoutEntry.type === 'rest' || workoutEntry.type === 'missed') {
                    dayClass += ' failed';
                }
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    async renderWorkoutExercises() {
        if (!this.selectedWorkoutTemplate) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-dumbbell"></i>
                        <p>Select a workout template to view exercises</p>
                    </div>
                </div>
            `;
        }

        const exercises = await db.workoutExercises
            .where('templateId')
            .equals(this.selectedWorkoutTemplate)
            .toArray();

        if (exercises.length === 0) {
            return `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-dumbbell"></i>
                        <p>No exercises in this template</p>
                        <button class="btn btn-primary mt-20" id="addExerciseBtn">
                            <i class="fas fa-plus"></i> Add Exercise
                        </button>
                    </div>
                </div>
            `;
        }

        let exercisesHTML = '';
        for (const exercise of exercises) {
            exercisesHTML += `
                <div class="exercise-card">
                    <div class="exercise-header">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-pr">${exercise.pr ? 'PR: ' + exercise.pr : 'No PR set'}</div>
                    </div>
                    <div class="sets-container">
                        <div class="set-row">
                            <div class="set-number">1</div>
                            <div class="set-input">
                                <div class="input-group">
                                    <label>Weight</label>
                                    <input type="text" placeholder="e.g., 50 lbs">
                                </div>
                                <div class="input-group">
                                    <label>Reps</label>
                                    <input type="text" placeholder="e.g., 12">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const content = exercisesHTML + `
            <button class="btn btn-primary mt-20" id="completeWorkout">
                <i class="fas fa-check-circle"></i> Complete Workout
            </button>

            <button class="btn btn-secondary mt-10" id="addExerciseBtn">
                <i class="fas fa-plus"></i> Add Exercise
            </button>
        `;

        // Add event listeners after rendering
        setTimeout(() => {
            const addExerciseBtn = document.getElementById('addExerciseBtn');
            if (addExerciseBtn) {
                addExerciseBtn.addEventListener('click', () => {
                    this.showExerciseModal();
                });
            }

            const completeWorkoutBtn = document.getElementById('completeWorkout');
            if (completeWorkoutBtn) {
                completeWorkoutBtn.addEventListener('click', () => {
                    this.logWorkoutDay('completed');
                });
            }
        }, 100);

        return content;
    },

    showWorkoutModal() {
        document.getElementById('workoutName').value = '';
        this.showModal('workoutModal');
    },

    async saveWorkoutTemplate() {
        const name = document.getElementById('workoutName').value;

        if (!name) {
            alert('Please enter a workout name');
            return;
        }

        try {
            const templateId = await db.workoutTemplates.add({
                name,
                createdAt: new Date()
            });

            this.selectedWorkoutTemplate = templateId;
            this.hideModal('workoutModal');
            this.renderWorkoutPage();
        } catch (error) {
            console.error('Error saving workout template:', error);
            alert('Error saving workout template. Please try again.');
        }
    },

    showExerciseModal() {
        document.getElementById('exerciseName').value = '';
        document.getElementById('exercisePR').value = '';
        this.showModal('exerciseModal');
    },

    async saveExercise() {
        const name = document.getElementById('exerciseName').value;
        const pr = document.getElementById('exercisePR').value;

        if (!name) {
            alert('Please enter an exercise name');
            return;
        }

        try {
            // Get the next order value
            const exercises = await db.workoutExercises
                .where('templateId')
                .equals(this.selectedWorkoutTemplate)
                .toArray();
            
            const nextOrder = exercises.length > 0 ? Math.max(...exercises.map(e => e.order)) + 1 : 1;

            await db.workoutExercises.add({
                templateId: this.selectedWorkoutTemplate,
                name,
                pr,
                order: nextOrder,
                createdAt: new Date()
            });

            this.hideModal('exerciseModal');
            this.renderWorkoutPage();
        } catch (error) {
            console.error('Error saving exercise:', error);
            alert('Error saving exercise. Please try again.');
        }
    },

    async logWorkoutDay(type) {
        const today = this.formatDate(new Date());

        try {
            // Check if entry already exists for today
            const existingEntry = await db.workoutHistory
                .where('date')
                .equals(today)
                .first();

            if (existingEntry) {
                await db.workoutHistory.update(existingEntry.id, {
                    type,
                    createdAt: new Date()
                });
            } else {
                await db.workoutHistory.add({
                    date: today,
                    type,
                    createdAt: new Date()
                });
            }

            await this.updateDailyCompletion();
            this.renderWorkoutPage();
            this.renderDashboard();
            alert(`${type === 'rest' ? 'Rest day' : type === 'missed' ? 'Missed workout' : 'Workout'} logged successfully!`);
        } catch (error) {
            console.error('Error logging workout day:', error);
            alert('Error logging workout day. Please try again.');
        }
    },

    async getWorkoutStats() {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const allWorkouts = await db.workoutHistory.toArray();
        const completedWorkouts = allWorkouts.filter(w => w.type === 'completed');
        
        const weeklyCompleted = completedWorkouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= weekStart;
        }).length;
        
        const monthlyCompleted = completedWorkouts.filter(w => {
            const workoutDate = new Date(w.date);
            return workoutDate >= monthStart;
        }).length;
        
        const totalDays = Math.floor((today - monthStart) / (1000 * 60 * 60 * 24)) + 1;
        const consistency = totalDays > 0 ? Math.round((monthlyCompleted / totalDays) * 100) : 0;
        
        // Calculate current streak
        let currentStreak = 0;
        const sortedWorkouts = completedWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        let checkDate = new Date();
        
        for (let i = 0; i < 30; i++) {
            const dateStr = this.formatDate(checkDate);
            const hasWorkout = sortedWorkouts.some(w => w.date === dateStr);
            
            if (hasWorkout) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return {
            weeklyCompleted,
            monthlyCompleted,
            totalCompleted: completedWorkouts.length,
            consistency,
            currentStreak
        };
    },

    renderWorkoutFrequencyChart() {
        const ctx = document.getElementById('workoutFrequencyChart');
        if (!ctx) return;
        
        // Simple implementation - you can enhance this with real data
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Workouts This Week',
                    data: [1, 0, 1, 0, 1, 0, 0],
                    backgroundColor: 'rgba(0, 200, 81, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    // Mood Tracking
    async renderMoodPage() {
        const moodEl = document.getElementById('mood');
        const todayMood = await this.getTodayMood();
        const moodHistory = await this.getMoodHistory();

        moodEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">How are you feeling today?</div>
                </div>
                <div class="mood-current">
                    ${todayMood ? `
                        <div class="mood-summary">
                            <div class="mood-emoji-large">${this.getMoodEmoji(todayMood.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">Today's Mood</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${todayMood.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${todayMood.energy}/5</span></div>
                                    <div class="mood-metric">Numbness: <span>${todayMood.numb}/5</span></div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <p>No mood logged today</p>
                            <p>How are you feeling?</p>
                        </div>
                    `}
                </div>
                <button class="btn btn-primary" id="logMoodButton">
                    <i class="fas fa-plus"></i> ${todayMood ? 'Update' : 'Log'} Today's Mood
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Mood History</div>
                </div>
                <div class="mood-history">
                    ${moodHistory.length > 0 ? moodHistory.map(entry => `
                        <div class="mood-entry">
                            <div class="mood-emoji-large">${this.getMoodEmoji(entry.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${entry.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${entry.energy}/5</span></div>
                                    <div class="mood-metric">Numbness: <span>${entry.numb}/5</span></div>
                                </div>
                                ${entry.notes ? `<div class="mood-notes">${entry.notes}</div>` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <p>No mood history yet</p>
                        </div>
                    `}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Mood Trends</div>
                </div>
                <div class="chart-container">
                    <canvas id="moodTrendChart"></canvas>
                </div>
            </div>
        `;

        document.getElementById('logMoodButton').addEventListener('click', () => {
            this.showMoodModal();
        });

        // Render mood trend chart
        this.renderMoodTrendChart();
    },

    getMoodEmoji(mood) {
        const emojis = ['😢', '😔', '😐', '😄', '😊'];
        return emojis[mood - 1] || '😐';
    },

    async getTodayMood() {
        const today = this.formatDate(new Date());
        return await db.moodEntries.where('date').equals(today).first();
    },

    async getMoodHistory() {
        return await db.moodEntries.orderBy('date').reverse().limit(10).toArray();
    },

    showMoodModal(entry = null) {
        const today = this.formatDate(new Date());
        document.getElementById('moodDate').value = entry ? entry.date : today;
        document.getElementById('moodLevel').value = entry ? entry.mood : 3;
        document.getElementById('energyLevel').value = entry ? entry.energy : 3;
        document.getElementById('numbLevel').value = entry ? entry.numb : 3;
        document.getElementById('moodNotes').value = entry ? entry.notes : '';
        
        this.showModal('moodModal');
    },

    async quickLogMood(mood, energy, numb) {
        const today = this.formatDate(new Date());
        
        try {
            const existingEntry = await db.moodEntries.where('date').equals(today).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    numb,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date: today,
                    mood,
                    energy,
                    numb,
                    notes: '',
                    createdAt: new Date()
                });
            }
            
            this.renderDashboard();
            this.renderMoodPage();
            alert('Mood logged successfully!');
        } catch (error) {
            console.error('Error logging mood:', error);
            alert('Error logging mood. Please try again.');
        }
    },

    async saveMoodEntry() {
        const date = document.getElementById('moodDate').value;
        const mood = parseInt(document.getElementById('moodLevel').value);
        const energy = parseInt(document.getElementById('energyLevel').value);
        const numb = parseInt(document.getElementById('numbLevel').value);
        const notes = document.getElementById('moodNotes').value;

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            const existingEntry = await db.moodEntries.where('date').equals(date).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    numb,
                    notes,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date,
                    mood,
                    energy,
                    numb,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('moodModal');
            this.renderDashboard();
            this.renderMoodPage();
        } catch (error) {
            console.error('Error saving mood entry:', error);
            alert('Error saving mood entry. Please try again.');
        }
    },

    async renderMoodTrendChart() {
        const ctx = document.getElementById('moodTrendChart');
        if (!ctx) return;
        
        const moodData = await this.getMoodTrendData();
        
        if (this.charts.moodTrend) {
            this.charts.moodTrend.destroy();
        }

        this.charts.moodTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: moodData.labels,
                datasets: [
                    {
                        label: 'Mood',
                        data: moodData.mood,
                        borderColor: '#E1306C',
                        backgroundColor: 'rgba(225, 48, 108, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Energy',
                        data: moodData.energy,
                        borderColor: '#FCAF45',
                        backgroundColor: 'rgba(252, 175, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Numbness',
                        data: moodData.numb,
                        borderColor: '#833AB4',
                        backgroundColor: 'rgba(131, 58, 180, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5
                    }
                }
            }
        });
    },

    async getMoodTrendData() {
        const moodEntries = await db.moodEntries.orderBy('date').reverse().limit(14).toArray();
        const labels = [];
        const mood = [];
        const energy = [];
        const numb = [];
        
        moodEntries.reverse().forEach(entry => {
            const date = new Date(entry.date);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            mood.push(entry.mood);
            energy.push(entry.energy);
            numb.push(entry.numb);
        });
        
        return { labels, mood, energy, numb };
    },

    // Analytics Page with Charts
    async renderAnalyticsPage() {
        const analyticsEl = document.getElementById('analytics');
        
        analyticsEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Productivity Overview</div>
                </div>
                <div class="chart-container">
                    <canvas id="productivityChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Habit Consistency</div>
                </div>
                <div class="chart-container">
                    <canvas id="habitConsistencyChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Workout Progress</div>
                </div>
                <div class="chart-container">
                    <canvas id="workoutProgressChart"></canvas>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Mood & Energy Correlation</div>
                </div>
                <div class="chart-container">
                    <canvas id="moodEnergyChart"></canvas>
                </div>
            </div>
        `;

        // Render all charts
        this.renderProductivityChart();
        this.renderHabitConsistencyChart();
        this.renderWorkoutProgressChart();
        this.renderMoodEnergyChart();
    },

    async renderProductivityChart() {
        const ctx = document.getElementById('productivityChart');
        if (!ctx) return;
        
        const weekData = await this.getWeeklyProductivityData();
        
        if (this.charts.productivity) {
            this.charts.productivity.destroy();
        }

        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekData.labels,
                datasets: [
                    {
                        label: 'Dopamine Control',
                        data: weekData.dopamine,
                        borderColor: '#405DE6',
                        backgroundColor: 'rgba(64, 93, 230, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Workout Completion',
                        data: weekData.workout,
                        borderColor: '#00C851',
                        backgroundColor: 'rgba(0, 200, 81, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Hygiene Completion',
                        data: weekData.hygiene,
                        borderColor: '#0095F6',
                        backgroundColor: 'rgba(0, 149, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    async renderHabitConsistencyChart() {
        const ctx = document.getElementById('habitConsistencyChart');
        if (!ctx) return;
        
        const habitData = await this.getHabitConsistencyData();
        
        if (this.charts.habitConsistency) {
            this.charts.habitConsistency.destroy();
        }

        this.charts.habitConsistency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: habitData.labels,
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: habitData.rates,
                    backgroundColor: [
                        'rgba(64, 93, 230, 0.8)',
                        'rgba(0, 149, 246, 0.8)',
                        'rgba(193, 53, 132, 0.8)',
                        'rgba(225, 48, 108, 0.8)',
                        'rgba(253, 29, 29, 0.8)'
                    ],
                    borderColor: [
                        '#405DE6',
                        '#0095F6',
                        '#C13584',
                        '#E1306C',
                        '#FD1D1D'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    },

    async renderWorkoutProgressChart() {
        const ctx = document.getElementById('workoutProgressChart');
        if (!ctx) return;
        
        const workoutData = await this.getWorkoutProgressData();
        
        if (this.charts.workoutProgress) {
            this.charts.workoutProgress.destroy();
        }

        this.charts.workoutProgress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: workoutData.labels,
                datasets: [{
                    label: 'Workout Frequency (per week)',
                    data: workoutData.frequency,
                    borderColor: '#00C851',
                    backgroundColor: 'rgba(0, 200, 81, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    async renderMoodEnergyChart() {
        const ctx = document.getElementById('moodEnergyChart');
        if (!ctx) return;
        
        const moodData = await this.getMoodEnergyData();
        
        if (this.charts.moodEnergy) {
            this.charts.moodEnergy.destroy();
        }

        this.charts.moodEnergy = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Mood vs Energy',
                    data: moodData.points,
                    backgroundColor: 'rgba(64, 93, 230, 0.6)',
                    borderColor: '#405DE6',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Energy Level'
                        },
                        min: 1,
                        max: 5
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Mood Level'
                        },
                        min: 1,
                        max: 5
                    }
                }
            }
        });
    },

    // Data methods for charts
    async getWeeklyProductivityData() {
        const days = [];
        const dopamineData = [];
        const workoutData = [];
        const hygieneData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            
            days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Get dopamine completion
            const dopamineEntry = await db.dopamineEntries.where('date').equals(dateStr).first();
            dopamineData.push(dopamineEntry && dopamineEntry.status === 'passed' ? 100 : 0);
            
            // Get workout completion
            const workoutEntry = await db.workoutHistory.where('date').equals(dateStr).first();
            workoutData.push(workoutEntry && (workoutEntry.type === 'completed' || workoutEntry.type === 'rest') ? 100 : 0);
            
            // Get hygiene completion
            const hygieneCompletion = await this.calculateHygieneCompletion(dateStr);
            hygieneData.push(hygieneCompletion);
        }
        
        return {
            labels: days,
            dopamine: dopamineData,
            workout: workoutData,
            hygiene: hygieneData
        };
    },

    async getHabitConsistencyData() {
        const habits = await db.hygieneHabits.toArray();
        const labels = [];
        const rates = [];
        
        for (const habit of habits) {
            const completions = await db.hygieneCompletions
                .where('habitId')
                .equals(habit.id)
                .and(entry => entry.completed)
                .toArray();
            
            // Calculate completion rate for last 7 days
            const totalDays = 7;
            const completionRate = Math.round((completions.length / totalDays) * 100);
            
            labels.push(habit.name);
            rates.push(completionRate);
        }
        
        return { labels, rates };
    },

    async getWorkoutProgressData() {
        const workoutHistory = await db.workoutHistory
            .where('type')
            .equals('completed')
            .toArray();
        
        // Group by week
        const weeklyData = {};
        workoutHistory.forEach(entry => {
            const date = new Date(entry.date);
            const week = this.getWeekNumber(date);
            if (!weeklyData[week]) {
                weeklyData[week] = 0;
            }
            weeklyData[week]++;
        });
        
        const labels = Object.keys(weeklyData).slice(-8); // Last 8 weeks
        const frequency = Object.values(weeklyData).slice(-8);
        
        return { labels, frequency };
    },

    async getMoodEnergyData() {
        const moodEntries = await db.moodEntries.limit(30).toArray();
        const points = moodEntries.map(entry => ({
            x: entry.energy,
            y: entry.mood
        }));
        
        return { points };
    },

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    },

    async getTodayFocusTime() {
        const today = this.formatDate(new Date());
        const focusSessions = await db.focusSessions.where('date').equals(today).toArray();
        return focusSessions.reduce((total, session) => total + session.duration, 0);
    },

    // Database Page
    async renderDatabasePage() {
        const databaseEl = document.getElementById('database');
        
        const dopamineEntries = await db.dopamineEntries.toArray();
        const hygieneHabits = await db.hygieneHabits.toArray();
        const hygieneCompletions = await db.hygieneCompletions.toArray();
        const workoutTemplates = await db.workoutTemplates.toArray();
        const workoutExercises = await db.workoutExercises.toArray();
        const workoutHistory = await db.workoutHistory.toArray();
        const moodEntries = await db.moodEntries.toArray();

        databaseEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Database Viewer</div>
                    <div class="card-more">
                        <i class="fas fa-database"></i>
                    </div>
                </div>
                
                <div class="database-section">
                    <h3>Dopamine Entries (${dopamineEntries.length})</h3>
                    <table class="database-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dopamineEntries.map(entry => `
                                <tr>
                                    <td>${entry.date}</td>
                                    <td>${entry.status}</td>
                                    <td>${entry.notes || ''}</td>
                                    <td class="database-actions">
                                        <button class="log-action edit-dopamine" data-id="${entry.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="log-action delete-dopamine" data-id="${entry.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="database-section">
                    <h3>Hygiene Habits (${hygieneHabits.length})</h3>
                    <table class="database-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${hygieneHabits.map(habit => `
                                <tr>
                                    <td>${habit.name}</td>
                                    <td>${habit.description}</td>
                                    <td class="database-actions">
                                        <button class="log-action delete-habit" data-id="${habit.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="database-section">
                    <h3>Workout History (${workoutHistory.length})</h3>
                    <table class="database-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workoutHistory.map(history => `
                                <tr>
                                    <td>${history.date}</td>
                                    <td>${history.type}</td>
                                    <td class="database-actions">
                                        <button class="log-action delete-workout" data-id="${history.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="database-section">
                    <h3>Mood Entries (${moodEntries.length})</h3>
                    <table class="database-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Mood</th>
                                <th>Energy</th>
                                <th>Numbness</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${moodEntries.map(entry => `
                                <tr>
                                    <td>${entry.date}</td>
                                    <td>${entry.mood}/5</td>
                                    <td>${entry.energy}/5</td>
                                    <td>${entry.numb}/5</td>
                                    <td class="database-actions">
                                        <button class="log-action delete-mood" data-id="${entry.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Add event listeners for database actions
        databaseEl.querySelectorAll('.edit-dopamine').forEach(btn => {
            btn.addEventListener('click', () => {
                const entryId = parseInt(btn.getAttribute('data-id'));
                this.editDopamineEntry(entryId);
            });
        });

        databaseEl.querySelectorAll('.delete-dopamine').forEach(btn => {
            btn.addEventListener('click', () => {
                const entryId = parseInt(btn.getAttribute('data-id'));
                this.deleteDopamineEntry(entryId);
            });
        });

        databaseEl.querySelectorAll('.delete-habit').forEach(btn => {
            btn.addEventListener('click', () => {
                const habitId = parseInt(btn.getAttribute('data-id'));
                this.deleteHabit(habitId);
            });
        });

        databaseEl.querySelectorAll('.delete-workout').forEach(btn => {
            btn.addEventListener('click', () => {
                const historyId = parseInt(btn.getAttribute('data-id'));
                this.deleteWorkoutHistory(historyId);
            });
        });

        databaseEl.querySelectorAll('.delete-mood').forEach(btn => {
            btn.addEventListener('click', () => {
                const moodId = parseInt(btn.getAttribute('data-id'));
                this.deleteMoodEntry(moodId);
            });
        });
    },

    async deleteDopamineEntry(entryId) {
        if (confirm('Are you sure you want to delete this dopamine entry?')) {
            try {
                await db.dopamineEntries.delete(entryId);
                this.renderDatabasePage();
                this.renderDopaminePage();
                this.renderDashboard();
            } catch (error) {
                console.error('Error deleting dopamine entry:', error);
                alert('Error deleting entry. Please try again.');
            }
        }
    },

    async deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit? This will also delete all completion records for this habit.')) {
            try {
                await db.hygieneHabits.delete(habitId);
                // Also delete related completions
                await db.hygieneCompletions.where('habitId').equals(habitId).delete();
                this.renderDatabasePage();
                this.renderHygienePage();
                this.renderDashboard();
            } catch (error) {
                console.error('Error deleting habit:', error);
                alert('Error deleting habit. Please try again.');
            }
        }
    },

    async deleteWorkoutHistory(historyId) {
        if (confirm('Are you sure you want to delete this workout history entry?')) {
            try {
                await db.workoutHistory.delete(historyId);
                this.renderDatabasePage();
                this.renderWorkoutPage();
                this.renderDashboard();
            } catch (error) {
                console.error('Error deleting workout history:', error);
                alert('Error deleting workout history. Please try again.');
            }
        }
    },

    async deleteMoodEntry(moodId) {
        if (confirm('Are you sure you want to delete this mood entry?')) {
            try {
                await db.moodEntries.delete(moodId);
                this.renderDatabasePage();
                this.renderMoodPage();
                this.renderDashboard();
            } catch (error) {
                console.error('Error deleting mood entry:', error);
                alert('Error deleting mood entry. Please try again.');
            }
        }
    },

    // Calculation methods
    async calculateCurrentStreak() {
        const entries = await db.dopamineEntries.orderBy('date').toArray();
        let currentStreak = 0;
        const today = new Date();
        
        // Start from today and go backwards
        for (let i = 0; i < 365; i++) { // Check up to a year back
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateKey = this.formatDate(checkDate);
            
            const entry = entries.find(e => e.date === dateKey);
            if (entry && entry.status === 'passed') {
                currentStreak++;
            } else {
                break;
            }
        }
        
        return currentStreak;
    },

    async calculateLongestStreak() {
        const entries = await db.dopamineEntries.orderBy('date').toArray();
        let longestStreak = 0;
        let currentStreak = 0;
        
        // Sort entries by date
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const entry of entries) {
            if (entry.status === 'passed') {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return longestStreak;
    },

    async calculateTodayCompletion(date) {
        let completion = 0;
        let totalItems = 3; // dopamine, workout, hygiene
        
        // Check dopamine
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        if (dopamineEntry && dopamineEntry.status === 'passed') completion++;
        
        // Check workout
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        if (workoutEntry && (workoutEntry.type === 'completed' || workoutEntry.type === 'rest')) completion++;
        
        // Check hygiene
        const hygieneCompletion = await this.calculateHygieneCompletion(date);
        if (hygieneCompletion >= 80) completion++;
        
        return Math.round((completion / totalItems) * 100);
    },

    async updateDailyCompletion() {
        const today = this.formatDate(new Date());
        const dopamineCompleted = await this.isDopamineCompletedToday();
        const workoutCompleted = await this.isWorkoutCompletedToday();
        const hygieneCompleted = await this.calculateHygieneCompletion(today) >= 80;
        const totalCompletion = await this.calculateTodayCompletion(today);
        
        const existing = await db.dailyCompletion.where('date').equals(today).first();
        
        if (existing) {
            await db.dailyCompletion.update(existing.id, {
                dopamineCompleted,
                workoutCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        } else {
            await db.dailyCompletion.add({
                date: today,
                dopamineCompleted,
                workoutCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        }
    },

    async isDopamineCompletedToday() {
        const today = this.formatDate(new Date());
        const entry = await db.dopamineEntries.where('date').equals(today).first();
        return entry && entry.status === 'passed';
    },

    async isWorkoutCompletedToday() {
        const today = this.formatDate(new Date());
        const entry = await db.workoutHistory.where('date').equals(today).first();
        return entry && (entry.type === 'completed' || entry.type === 'rest');
    },

    // Email Automation System
    async setupEmailAutomation() {
        // Check if we need to send today's report
        const lastReportDate = localStorage.getItem('lastEmailReportDate');
        const today = this.formatDate(new Date());
        
        if (lastReportDate !== today) {
            // Send daily report at the end of the day (after 8 PM)
            const now = new Date();
            if (now.getHours() >= 20) {
                await this.sendDailyEmailReport();
                localStorage.setItem('lastEmailReportDate', today);
            }
        }
    },

    async checkDailyEmailReport() {
        const today = this.formatDate(new Date());
        const lastReport = localStorage.getItem('lastEmailReportDate');
        
        if (lastReport !== today) {
            // Check if it's after 8 PM
            const now = new Date();
            if (now.getHours() >= 20) {
                await this.sendDailyEmailReport();
                localStorage.setItem('lastEmailReportDate', today);
            }
        }
    },

    showEmailReportModal() {
        const today = this.formatDate(new Date());
        document.getElementById('emailReportDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('emailRecipient').value = 'rihazrizvi@gmail.com';
        
        this.generateEmailPreview();
        this.showModal('emailReportModal');
    },

    async generateEmailPreview() {
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        const previewEl = document.getElementById('emailPreview');
        
        previewEl.innerHTML = `
            <table class="report-table">
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Date</td>
                    <td>${stats.date}</td>
                </tr>
                <tr>
                    <td>Overall Completion</td>
                    <td>${stats.overallCompletion}%</td>
                </tr>
                <tr>
                    <td>Dopamine Control</td>
                    <td>${stats.dopamine ? stats.dopamine.status : 'Not logged'}</td>
                </tr>
                <tr>
                    <td>Workout</td>
                    <td>${stats.workout ? stats.workout.type : 'Not logged'}</td>
                </tr>
                <tr>
                    <td>Hygiene Completion</td>
                    <td>${stats.hygiene.completion}%</td>
                </tr>
                ${stats.mood ? `
                <tr>
                    <td>Mood</td>
                    <td>${stats.mood.mood}/5</td>
                </tr>
                <tr>
                    <td>Energy</td>
                    <td>${stats.mood.energy}/5</td>
                </tr>
                <tr>
                    <td>Numbness</td>
                    <td>${stats.mood.numb}/5</td>
                </tr>
                ` : ''}
                <tr>
                    <td>Focus Sessions</td>
                    <td>${stats.focus.sessions}</td>
                </tr>
                <tr>
                    <td>Total Focus Time</td>
                    <td>${stats.focus.totalDuration} minutes</td>
                </tr>
            </table>
        `;
    },

    async sendEmailReport() {
        const recipient = document.getElementById('emailRecipient').value;
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        
        try {
            await this.sendEmail(stats, recipient);
            this.hideModal('emailReportModal');
            alert('Daily report sent successfully!');
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Failed to send email. Please check your connection and try again.');
        }
    },

    async sendDailyEmailReport() {
        const today = this.formatDate(new Date());
        const stats = await this.getDailyStats(today);
        
        try {
            await this.sendEmail(stats, 'rihazrizvi@gmail.com');
            console.log('Daily email report sent successfully');
        } catch (error) {
            console.error('Failed to send daily email report:', error);
            // Store for manual sending later
            await this.storePendingEmail(stats);
        }
    },

    async sendEmail(stats, recipient) {
        const tableData = this.formatStatsForTable(stats);
        
        const templateParams = {
            to_email: recipient,
            subject: `Life Tracker Daily Report - ${stats.date}`,
            message: `
Daily Productivity Report

Date: ${stats.date}
Overall Completion: ${stats.overallCompletion}%

${tableData}

Generated by Life Tracker Pro
            `.trim(),
            html_message: this.generateEmailHTML(stats)
        };

        try {
            // You need to create a template in EmailJS and replace 'template_your_template_id' with your actual template ID
            const response = await emailjs.send('service_c3ur38h', 'template_your_template_id', templateParams);
            console.log('Email sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    },

    formatStatsForTable(stats) {
        let table = "Metric|Value\n";
        table += "-----|-----\n";
        table += `Date|${stats.date}\n`;
        table += `Overall Completion|${stats.overallCompletion}%\n`;
        table += `Dopamine Control|${stats.dopamine ? stats.dopamine.status : 'Not logged'}\n`;
        table += `Workout|${stats.workout ? stats.workout.type : 'Not logged'}\n`;
        table += `Hygiene Completion|${stats.hygiene.completion}%\n`;
        
        if (stats.mood) {
            table += `Mood|${stats.mood.mood}/5\n`;
            table += `Energy|${stats.mood.energy}/5\n`;
            table += `Numbness|${stats.mood.numb}/5\n`;
        }
        
        table += `Focus Sessions|${stats.focus.sessions}\n`;
        table += `Total Focus Time|${stats.focus.totalDuration} minutes\n`;
        
        return table;
    },

    generateEmailHTML(stats) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .stat { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                    .good { background: #d4edda; }
                    .bad { background: #f8d7da; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f8f9fa; }
                </style>
            </head>
            <body>
                <h2>📊 Life Tracker Daily Report - ${stats.date}</h2>
                
                <div class="stat ${stats.overallCompletion >= 80 ? 'good' : 'bad'}">
                    <h3>Overall Completion: ${stats.overallCompletion}%</h3>
                </div>

                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Date</td>
                        <td>${stats.date}</td>
                    </tr>
                    <tr>
                        <td>Overall Completion</td>
                        <td>${stats.overallCompletion}%</td>
                    </tr>
                    <tr>
                        <td>Dopamine Control</td>
                        <td>${stats.dopamine ? stats.dopamine.status : 'Not logged'}</td>
                    </tr>
                    <tr>
                        <td>Workout</td>
                        <td>${stats.workout ? stats.workout.type : 'Not logged'}</td>
                    </tr>
                    <tr>
                        <td>Hygiene Completion</td>
                        <td>${stats.hygiene.completion}%</td>
                    </tr>
                    ${stats.mood ? `
                    <tr>
                        <td>Mood</td>
                        <td>${stats.mood.mood}/5</td>
                    </tr>
                    <tr>
                        <td>Energy</td>
                        <td>${stats.mood.energy}/5</td>
                    </tr>
                    <tr>
                        <td>Numbness</td>
                        <td>${stats.mood.numb}/5</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td>Focus Sessions</td>
                        <td>${stats.focus.sessions}</td>
                    </tr>
                    <tr>
                        <td>Total Focus Time</td>
                        <td>${stats.focus.totalDuration} minutes</td>
                    </tr>
                </table>

                <hr>
                <p><em>Generated by Life Tracker Pro</em></p>
            </body>
            </html>
        `;
    },

    async storePendingEmail(stats) {
        const pendingEmails = JSON.parse(localStorage.getItem('pendingEmails') || '[]');
        pendingEmails.push({
            timestamp: new Date().toISOString(),
            stats: stats
        });
        localStorage.setItem('pendingEmails', JSON.stringify(pendingEmails));
    },

    async getDailyStats(date) {
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        const workoutEntry = await db.workoutHistory.where('date').equals(date).first();
        const hygieneCompletion = await this.calculateHygieneCompletion(date);
        const moodEntry = await db.moodEntries.where('date').equals(date).first();
        const focusSessions = await db.focusSessions.where('date').equals(date).toArray();

        return {
            date,
            dopamine: dopamineEntry ? {
                status: dopamineEntry.status,
                notes: dopamineEntry.notes
            } : null,
            workout: workoutEntry ? {
                type: workoutEntry.type,
                duration: workoutEntry.duration
            } : null,
            hygiene: {
                completion: hygieneCompletion,
                totalHabits: (await db.hygieneHabits.toArray()).length
            },
            mood: moodEntry ? {
                mood: moodEntry.mood,
                energy: moodEntry.energy,
                numb: moodEntry.numb
            } : null,
            focus: {
                sessions: focusSessions.length,
                totalDuration: focusSessions.reduce((total, session) => total + session.duration, 0)
            },
            overallCompletion: await this.calculateTodayCompletion(date)
        };
    },

    // Initialize all pages
    renderAllPages() {
        this.renderDashboard();
        this.renderDopaminePage();
        this.renderHygienePage();
        this.renderWorkoutPage();
        this.renderMoodPage();
        this.renderAnalyticsPage();
        this.renderDatabasePage();
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    LifeTrackerApp.init();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
