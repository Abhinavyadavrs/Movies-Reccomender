from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import MovieRecommender
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the recommender system
recommender = MovieRecommender('movies.csv')

@app.route('/')
def home():
    return jsonify({"message": "Movie Recommendation API"})

@app.route('/api/movies', methods=['GET'])
def get_all_movies():
    movies = recommender.get_all_movies()
    return jsonify(movies)

@app.route('/api/recommendations/movie', methods=['GET'])
def get_recommendations_by_movie():
    title = request.args.get('title')
    num_recs = request.args.get('num', default=5, type=int)
    
    if not title:
        return jsonify({"error": "Title parameter is required"}), 400
    
    recommendations = recommender.get_recommendations(title, num_recs)
    return jsonify(recommendations)

@app.route('/api/recommendations/preferences', methods=['GET'])
def get_recommendations_by_preferences():
    genres = request.args.get('genres', '')
    director = request.args.get('director', '')
    keywords = request.args.get('keywords', '')
    num_recs = request.args.get('num', default=5, type=int)
    
    recommendations = recommender.get_recommendations_by_preferences(
        genres, director, keywords, num_recs
    )
    return jsonify(recommendations)

@app.route('/api/search', methods=['GET'])
def search_movies():
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    results = recommender.search_movies(query)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)