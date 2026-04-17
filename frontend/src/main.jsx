import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'  // ← change this
import axios from 'axios'

axios.defaults.baseURL = '';
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <App />  // ← change this
)