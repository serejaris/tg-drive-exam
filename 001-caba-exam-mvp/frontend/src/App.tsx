import { useState, useCallback } from 'react';
import type { Screen, ExamResult, ExamMode } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { ExamScreen } from './screens/ExamScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { MistakesScreen } from './screens/MistakesScreen';
import { SettingsScreen } from './screens/SettingsScreen';

interface ScreenParams {
  results?: ExamResult;
  mode?: ExamMode;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [screenParams, setScreenParams] = useState<ScreenParams>({});

  const navigate = useCallback((newScreen: Screen, params?: ScreenParams) => {
    setScreen(newScreen);
    setScreenParams(params || {});
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomeScreen onNavigate={navigate} />;
      case 'practice':
        return <PracticeScreen onNavigate={navigate} />;
      case 'exam':
        return <ExamScreen onNavigate={navigate} />;
      case 'results':
        if (screenParams.results) {
          return (
            <ResultsScreen
              results={screenParams.results}
              mode={screenParams.mode || 'practice'}
              onNavigate={navigate}
            />
          );
        }
        return <HomeScreen onNavigate={navigate} />;
      case 'mistakes':
        return <MistakesScreen onNavigate={navigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigate} />;
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return <div className="app">{renderScreen()}</div>;
}

export default App;
