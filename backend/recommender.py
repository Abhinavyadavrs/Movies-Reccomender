import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class MovieRecommender:
    def __init__(self, data_path):
        self.df = self.load_data(data_path)
        self.tfidf_matrix = None
        self.cosine_sim = None
        self.indices = None
        self.prepare_data()
    
    def load_data(self, data_path):
        """Load the movie dataset"""
        try:
            df = pd.read_csv(data_path)
            print(f"Dataset loaded successfully with {len(df)} movies.")
            return df
        except FileNotFoundError:
            print("Dataset file not found.")
            return pd.DataFrame()
    
    def prepare_data(self):
        """Prepare the data for recommendation"""
        if self.df.empty:
            return
            
        # Create a soup of features for each movie
        self.df['soup'] = self.df.apply(self.create_soup, axis=1)
        
        # Create TF-IDF matrix
        tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = tfidf.fit_transform(self.df['soup'])
        
        # Compute cosine similarity matrix
        self.cosine_sim = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)
        
        # Create indices series
        self.indices = pd.Series(self.df.index, index=self.df['title']).drop_duplicates()
    
    def create_soup(self, x):
        """Combine all features into a single string"""
        return ' '.join(x['genres'].lower().split(',')) + ' ' + x['director'].lower() + ' ' + ' '.join(x['keywords'].lower().split(','))
    
    def get_recommendations(self, title, num_recommendations=5):
        """Get movie recommendations based on content similarity"""
        if self.df.empty:
            return []
            
        # Get the index of the movie that matches the title
        if title not in self.indices:
            return []
        
        idx = self.indices[title]
        
        # Get the pairwise similarity scores of all movies with that movie
        sim_scores = list(enumerate(self.cosine_sim[idx]))
        
        # Sort the movies based on the similarity scores
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Get the scores of the top most similar movies
        sim_scores = sim_scores[1:num_recommendations+1]
        
        # Get the movie indices
        movie_indices = [i[0] for i in sim_scores]
        
        # Return the top most similar movies
        return self.df.iloc[movie_indices].to_dict('records')
    
    def get_recommendations_by_preferences(self, genres=None, director=None, keywords=None, num_recommendations=5):
        """Get movie recommendations based on user preferences"""
        if self.df.empty:
            return []
            
        # Filter movies based on preferences
        filtered_movies = self.df.copy()
        
        if genres:
            genre_list = [genre.strip().lower() for genre in genres.split(',')]
            for genre in genre_list:
                filtered_movies = filtered_movies[filtered_movies['genres'].str.lower().str.contains(genre)]
        
        if director:
            filtered_movies = filtered_movies[filtered_movies['director'].str.lower().str.contains(director.lower())]
        
        if keywords:
            keyword_list = [keyword.strip().lower() for keyword in keywords.split(',')]
            for keyword in keyword_list:
                filtered_movies = filtered_movies[filtered_movies['keywords'].str.lower().str.contains(keyword)]
        
        if len(filtered_movies) == 0:
            return []
        
        # Sort by rating and return top recommendations
        recommendations = filtered_movies.sort_values('rating', ascending=False).head(num_recommendations)
        return recommendations.to_dict('records')
    
    def get_all_movies(self):
        """Get all movies in the database"""
        if self.df.empty:
            return []
        return self.df.to_dict('records')
    
    def search_movies(self, query):
        """Search movies by title"""
        if self.df.empty:
            return []
        return self.df[self.df['title'].str.contains(query, case=False)].to_dict('records')