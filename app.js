// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ZaqApp: Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.error('ZaqApp: Service Worker registration failed:', error);
            });
    });
}

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const postsContainer = document.getElementById('postsContainer');
const offlineMessage = document.getElementById('offlineMessage');
const onlineStatus = document.getElementById('onlineStatus');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const installBtn = document.getElementById('installBtn');

// API Configuration
const API_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5';

// Network Status
let isOnline = navigator.onLine;

// Update network status
function updateNetworkStatus() {
    isOnline = navigator.onLine;
    
    if (isOnline) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Online';
        offlineMessage.hidden = true;
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
        offlineMessage.hidden = false;
    }
}

// Event Listeners for network status
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Initialize network status
updateNetworkStatus();

// Fetch Posts from API
async function fetchPosts() {
    try {
        showLoading(true);
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        displayPosts(posts);
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        
        // Check if we have cached data
        const cachedResponse = await caches.match(API_URL);
        if (cachedResponse) {
            const cachedPosts = await cachedResponse.json();
            displayPosts(cachedPosts);
        }
    } finally {
        showLoading(false);
    }
}

// Display Posts
function displayPosts(posts) {
    postsContainer.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="error-message">
                <h4>No Posts Available</h4>
                <p>No posts were found. Please try again later.</p>
            </div>
        `;
        return;
    }
    
    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `
            <div class="post-title">${post.title}</div>
            <div class="post-body">${post.body}</div>
            <div class="post-meta">
                <span>User ID: ${post.userId}</span>
                <span class="post-id">#${post.id}</span>
            </div>
        `;
        postsContainer.appendChild(postCard);
    });
}

// Show/Hide Loading Spinner
function showLoading(show) {
    loadingSpinner.hidden = !show;
}

// PWA Install Handler
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        deferredPrompt = null;
        installBtn.hidden = true;
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('ZaqApp: Application initialized');
    
    // Auto-fetch posts on load
    setTimeout(() => {
        fetchPosts();
    }, 1000);
});

// Auto-refresh when coming back online
window.addEventListener('online', () => {
    setTimeout(() => {
        fetchPosts();
    }, 2000);
});
