import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Overview from './components/Overview/Overview';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Overview />
      </div>
    </Router>
  );
}

export default App;
