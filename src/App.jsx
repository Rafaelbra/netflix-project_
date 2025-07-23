import { useEffect, useState } from 'react'
import Search from './Components/Search.jsx'
import Spinner from './Components/Spinner.jsx'
import MovieCard from './Components/MovieCard.jsx'
import { useDebounce, useStateList } from 'react-use'
import {updateSearchCount} from './appwrite.js'


const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState ('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounces the search term to prevent making too any API requests
  // by waiting for the user to stop typing for 600ms
  useDebounce ( () => setDebouncedSearchTerm(searchTerm), 600, [searchTerm])

  /// Fetching API Data
  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');


    try {

      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if(!response.ok) {
        throw new Error('Failed to fetch movies')
      }

      const data = await response.json();

      if (data.Response == 'False') {
        setErrorMessage (data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      
      // Calling data to database on appwrite
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
      // currently not getting access
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please, try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  /// useEffect hook to fetch data
  useEffect( () => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm])

  return (
    <main>

      <div className = 'pattern'/>

      <div className = 'wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />

          <h1>Find <span className = 'text-gradient'> Movies </span>  You'll Enjoy, Without the Hassle</h1>        

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        <section className='all-movies'>

          <h2 className='mt-[40px]'>All movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

          {errorMessage && <p className='text-red-500'>{errorMessage}</p>}

        </section>
      </div>
    </main>
  )
}

export default App
