// --- STATE AND CONFIGURATION --- //

// Credentials loaded from config.js

// Determine the current page
const currentPath = window.location.pathname;
const onLoginPage = currentPath.endsWith('login.html') || currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
const onDashboardPage = window.location.pathname.endsWith('dashboard.html');

// State management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// --- INITIALIZATION --- //
function init() {
    checkAuth();
    
    if (onLoginPage) {
        initLogin();
    } else if (onDashboardPage) {
        initDashboard();
    }
}

// --- AUTHENTICATION --- //
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (!isLoggedIn && onDashboardPage) {
        window.location.href = 'index.html';
    } 
    
    if (isLoggedIn && onLoginPage) {
        window.location.href = 'dashboard.html';
    }
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value.trim();
        
        if (usernameInput === CONFIG.USERNAME && passwordInput === CONFIG.PASSWORD) {
            // Successful login
            loginError.style.display = 'none';
            localStorage.setItem('isLoggedIn', 'true');
            // Assuming the display name is Initialized 
            localStorage.setItem('currentUser', usernameInput.charAt(0).toUpperCase() + usernameInput.slice(1)); 
            
            // Redirect
            window.location.href = 'dashboard.html';
        } else {
            // Error
            loginError.style.display = 'block';
            
            // Shake animation for error
            loginForm.style.animation = 'none';
            setTimeout(() => {
                loginForm.style.animation = 'slideInRight 0.3s ease';
            }, 10);
        }
    });
}

// --- DASHBOARD LOGIC --- //
function initDashboard() {
    // Reveal dashboard with smooth fade
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Set User details
    const userName = localStorage.getItem('currentUser') || 'User';
    document.getElementById('userNameDisplay').textContent = userName;
    document.getElementById('userInitial').textContent = userName.charAt(0).toUpperCase();

    // DOM Elements
    const form = document.getElementById('transactionForm');
    const list = document.getElementById('list');
    const balanceAmount = document.getElementById('balanceAmount');
    const incomeAmount = document.getElementById('incomeAmount');
    const expenseAmount = document.getElementById('expenseAmount');
    const logoutBtn = document.getElementById('logoutBtn');

    // Logout Event
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });

    // Form Submit Event
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = document.getElementById('text').value;
        const amountValue = document.getElementById('amount').value;
        const isExpense = document.getElementById('typeExpense').checked;
        
        if (text.trim() === '' || amountValue === '') {
            alert('Please add a text and amount');
            return;
        }

        // Amount logic (negative if expense)
        const amountNum = parseFloat(amountValue);
        const finalAmount = isExpense ? -Math.abs(amountNum) : Math.abs(amountNum);

        const transaction = {
            id: generateID(),
            text: text,
            amount: finalAmount,
            date: new Date().toISOString()
        };

        transactions.push(transaction);
        
        // Reset form
        document.getElementById('text').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('text').focus();
        
        updateStorageAndUI();
    });

    // Initial render
    renderUI();

    // Make functions globally available for inline onclick attributes
    window.removeTransaction = function(id) {
        transactions = transactions.filter(t => t.id !== id);
        updateStorageAndUI();
    };

    window.editTransaction = function(id) {
        // Find transaction
        const t = transactions.find(t => t.id === id);
        if (!t) return;

        // Ask for new details
        const newText = prompt("Edit Transaction Name:", t.text);
        if (newText === null || newText.trim() === '') return;
        
        const newAmountStr = prompt("Edit Amount ($):", Math.abs(t.amount));
        if (newAmountStr === null || newAmountStr.trim() === '') return;
        
        const newAmount = parseFloat(newAmountStr);
        if (isNaN(newAmount) || newAmount <= 0) {
            alert("Invalid amount");
            return;
        }

        // Maintain sign
        t.text = newText;
        t.amount = t.amount < 0 ? -newAmount : newAmount;

        updateStorageAndUI();
    };
    
    // Core Render Functions
    function addTransactionDOM(transaction) {
        const sign = transaction.amount < 0 ? '-' : '+';
        const isExpense = transaction.amount < 0;
        const iconClass = isExpense ? 'fa-cart-shopping' : 'fa-money-bill-wave';
        const iconBgClass = isExpense ? 'icon-expense' : 'icon-income';
        const amountClass = isExpense ? 'amount-expense' : 'amount-income';

        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const item = document.createElement('div');
        item.classList.add('transaction-item');
        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon ${iconBgClass}">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.text}</h4>
                    <p>${formattedDate}</p>
                </div>
            </div>
            <div style="display:flex; flex-direction: column; align-items: flex-end; gap: 0.5rem">
                <span class="${amountClass}">${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
                <div class="transaction-actions">
                    <button onclick="editTransaction(${transaction.id})" class="btn-icon" style="padding: 0.25rem; font-size: 0.85rem;" title="Edit">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="removeTransaction(${transaction.id})" class="btn-icon" style="padding: 0.25rem; font-size: 0.85rem; color: var(--danger-color);" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Insert at the top
        document.getElementById('list').prepend(item);
    }

    function updateValues() {
        const amounts = transactions.map(transaction => transaction.amount);

        const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
        
        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => (acc += item), 0)
            .toFixed(2);
            
        const expense = (amounts
            .filter(item => item < 0)
            .reduce((acc, item) => (acc += item), 0) * -1)
            .toFixed(2);

        document.getElementById('balanceAmount').innerText = total;
        document.getElementById('incomeAmount').innerText = income;
        document.getElementById('expenseAmount').innerText = expense;

        // Change balance color if negative
        if (total < 0) {
            document.getElementById('balanceAmount').style.color = 'var(--danger-color)';
        } else {
            document.getElementById('balanceAmount').style.color = 'inherit';
        }
        
        // Update transactions count
        document.getElementById('transactionCount').innerText = `${transactions.length} items`;
    }

    function renderUI() {
        const list = document.getElementById('list');
        list.innerHTML = '';

        if (transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-receipt"></i>
                    <p>No transactions found.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Add a new income or expense to get started.</p>
                </div>
            `;
        } else {
            // Sort to render newest first, then reverse since we prepend
            const sorted = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
            sorted.forEach(addTransactionDOM);
        }

        updateValues();
    }

    function updateStorageAndUI() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderUI();
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Start application
window.addEventListener('DOMContentLoaded', init);
