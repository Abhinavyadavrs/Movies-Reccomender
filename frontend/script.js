// API base URL
const API_BASE = 'http://localhost:5000/api';

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const movieSearch = document.getElementById('movie-search');
const searchResults = document.getElementById('search-results');
const getRecommendationsBtn = document.getElementById('get-recommendations');
const getPrefRecommendationsBtn = document.getElementById('get-pref-recommendations');
const resultsSection = document.getElementById('results-section');
const resultsContainer = document.getElementById('results-container');
const allMoviesList = document.getElementById('all-movies-list');
const loading = document.getElementById('loading');

// Current selected movie
let selectedMovie = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPanel = this.id.replace('tab-', 'panel-');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show target panel
            tabPanels.forEach(panel => panel.classList.add('hidden'));
            document.getElementById(targetPanel).classList.remove('hidden');
            
            // Load all movies if browsing
            if (targetPanel === 'panel-browse') {
                loadAllMovies();
            }
        });
    });

    // Set up movie search
    movieSearch.addEventListener('input', debounce(handleMovieSearch, 300));
    
    // Click outside to close search results
    document.addEventListener('click', function(e) {
        if (!searchResults.contains(e.target) && e.target !== movieSearch) {
            searchResults.classList.add('hidden');
        }
    });

    // Get recommendations based on movie
    getRecommendationsBtn.addEventListener('click', function() {
        if (!selectedMovie) {
            alert('Please select a movie first');
            return;
        }
        
        getMovieRecommendations(selectedMovie);
    });

    // Get recommendations based on preferences
    getPrefRecommendationsBtn.addEventListener('click', function() {
        const genres = document.getElementById('pref-genres').value;
        const director = document.getElementById('pref-director').value;
        const keywords = document.getElementById('pref-keywords').value;
        
        if (!genres && !director && !keywords) {
            alert('Please enter at least one preference');
            return;
        }
        
        getPreferenceRecommendations(genres, director, keywords);
    });

    // Load all movies on initial browse tab load
    loadAllMovies();
});

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle movie search input
async function handleMovieSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const movies = await response.json();
        
        displaySearchResults(movies);
    } catch (error) {
        console.error('Search error:', error);
    }
}

// Display search results
function displaySearchResults(movies) {
    if (movies.length === 0) {
        searchResults.innerHTML = '<div class="p-3 text-center">No movies found</div>';
        searchResults.classList.remove('hidden');
        return;
    }
    
    searchResults.innerHTML = movies.map(movie => `
        <div class="search-result-item p-3 cursor-pointer hover:bg-purple-600 rounded-lg" data-movie='${JSON.stringify(movie).replace(/'/g, "&#39;")}'>
            ${movie.title} (${movie.year})
        </div>
    `).join('');
    
    searchResults.classList.remove('hidden');
    
    // Add click event to search result items
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            selectedMovie = JSON.parse(this.dataset.movie.replace(/&#39;/g, "'"));
            movieSearch.value = selectedMovie.title;
            searchResults.classList.add('hidden');
        });
    });
}

// Get movie recommendations
async function getMovieRecommendations(movie) {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/recommendations/movie?title=${encodeURIComponent(movie.title)}&num=8`);
        const recommendations = await response.json();
        
        displayResults(recommendations, `Movies similar to ${movie.title}`);
    } catch (error) {
        console.error('Recommendation error:', error);
        alert('Failed to get recommendations. Please try again.');
    } finally {
        hideLoading();
    }
}

// Get recommendations based on preferences
async function getPreferenceRecommendations(genres, director, keywords) {
    showLoading();
    
    try {
        let url = `${API_BASE}/recommendations/preferences?num=8`;
        if (genres) url += `&genres=${encodeURIComponent(genres)}`;
        if (director) url += `&director=${encodeURIComponent(director)}`;
        if (keywords) url += `&keywords=${encodeURIComponent(keywords)}`;
        
        const response = await fetch(url);
        const recommendations = await response.json();
        
        let title = 'Recommended Movies';
        if (genres || director || keywords) {
            title = 'Movies matching your preferences';
        }
        
        displayResults(recommendations, title);
    } catch (error) {
        console.error('Preference recommendation error:', error);
        alert('Failed to get recommendations. Please try again.');
    } finally {
        hideLoading();
    }
}

// Load all movies
async function loadAllMovies() {
    try {
        const response = await fetch(`${API_BASE}/movies`);
        const movies = await response.json();
        
        displayAllMovies(movies);
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

// Display all movies
function displayAllMovies(movies) {
    if (movies.length === 0) {
        allMoviesList.innerHTML = '<div class="col-span-full text-center py-8">No movies found</div>';
        return;
    }
    
    allMoviesList.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

// Display results
function displayResults(movies, title) {
    if (movies.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-film text-5xl text-gray-600 mb-4"></i>
                <h3 class="text-xl font-semibold">No recommendations found</h3>
                <p class="text-gray-400">Try different search criteria</p>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    }
    
    document.querySelector('#results-section h2').textContent = title;
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Create movie card HTML
function createMovieCard(movie) {
    const stars = Math.round(movie.rating / 2); // Convert 10-point scale to 5 stars
    const starIcons = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    
    return `
        <div class="movie-card bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div class="h-48 overflow-hidden">
                <img src="${movie.poster}" alt="${movie.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-1">${movie.title}</h3>
                <p class="text-gray-400 text-sm mb-2">${movie.year} • ${movie.genres}</p>
                <div class="flex justify-between items-center mb-2">
                    <div class="star-rating">${starIcons}</div>
                    <span class="bg-purple-600 text-xs px-2 py-1 rounded">${movie.rating}</span>
                </div>
                <p class="text-sm text-gray-400"><span class="text-white">Director:</span> ${movie.director}</p>
            </div>
        </div>
    `;
}

// Show loading spinner
function showLoading() {
    loading.classList.remove('hidden');
}

// Hide loading spinner
function hideLoading() {
    loading.classList.add('hidden');
}