import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Overview from './components/Overview/Overview';
import { ScheduleProvider } from './context/ScheduleContext';
import './App.css';

function App() {
  return (
    <ScheduleProvider>
      <Router>
        <div className="App">
          <Overview />
        </div>
      </Router>
    </ScheduleProvider>
  );
}

export default App;
