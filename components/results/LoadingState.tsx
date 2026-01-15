'use client';

import { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';

interface Task {
  id: string;
  label: string;
  fullLabel: string;
  status: 'pending' | 'in_progress' | 'completed';
  displayedText: string;
}

interface LoadingStateProps {
  totalTasks?: number;
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 30, isActive: boolean) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!isActive) {
      setDisplayed('');
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayed(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isActive]);

  return displayed;
}

export function LoadingState({ totalTasks = 4 }: LoadingStateProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', label: 'Accessing Reddit subreddits...', fullLabel: 'Accessing Reddit subreddits...', status: 'pending', displayedText: '' },
    { id: '2', label: 'Extracting pain points...', fullLabel: 'Extracting pain points...', status: 'pending', displayedText: '' },
    { id: '3', label: 'LLM Scoring in progress...', fullLabel: 'LLM Scoring in progress...', status: 'pending', displayedText: '' },
    { id: '4', label: 'Generating blueprints...', fullLabel: 'Generating blueprints...', status: 'pending', displayedText: '' },
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let taskTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    // Start first task after a short delay
    taskTimeout = setTimeout(() => {
      setTasks((prev) => {
        const newTasks = [...prev];
        newTasks[0].status = 'in_progress';
        return newTasks;
      });
    }, 800);

    // Progressively complete tasks
    const taskIntervals = [
      { delay: 2000, taskIndex: 0 }, // Complete task 1
      { delay: 4500, taskIndex: 1 }, // Start and complete task 2
      { delay: 7000, taskIndex: 2 }, // Start and complete task 3
      { delay: 9500, taskIndex: 3 }, // Start and complete task 4
    ];

    taskIntervals.forEach(({ delay, taskIndex }) => {
      setTimeout(() => {
        setTasks((prev) => {
          const newTasks = [...prev];
          
          // Complete current task
          if (newTasks[taskIndex].status === 'in_progress') {
            newTasks[taskIndex].status = 'completed';
            newTasks[taskIndex].displayedText = newTasks[taskIndex].fullLabel;
          }
          
          // Start next task
          if (taskIndex < newTasks.length - 1) {
            newTasks[taskIndex + 1].status = 'in_progress';
          }
          
          return newTasks;
        });
      }, delay);
    });

    // Smooth progress bar animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        const completedCount = tasks.filter((t) => t.status === 'completed').length;
        const targetProgress = (completedCount / tasks.length) * 100;
        
        if (prev < targetProgress) {
          return Math.min(targetProgress, prev + 2);
        }
        return prev;
      });
    }, 100);

    return () => {
      clearTimeout(taskTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <h2 className="text-lg font-mono text-terminal">
            Scan en cours...
          </h2>
        </div>

        <div className="space-y-4 mb-6">
          {tasks.map((task) => {
            const TaskTypewriter = ({ task }: { task: Task }) => {
              const displayed = useTypewriter(
                task.fullLabel,
                20,
                task.status === 'in_progress' || task.status === 'completed'
              );
              
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 font-mono text-sm"
                >
                  {task.status === 'completed' && (
                    <Check className="h-4 w-4 text-terminal flex-shrink-0 animate-in fade-in duration-300" />
                  )}
                  {task.status === 'in_progress' && (
                    <Clock className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                  )}
                  {task.status === 'pending' && (
                    <div className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span
                    className={
                      task.status === 'completed'
                        ? 'text-terminal'
                        : task.status === 'in_progress'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                  >
                    {task.status === 'completed' && '[✓] '}
                    {task.status === 'in_progress' && '[⏳] '}
                    {task.status === 'pending' && '[ ] '}
                    {task.status === 'completed' 
                      ? task.fullLabel 
                      : task.status === 'in_progress'
                      ? displayed + (displayed.length < task.fullLabel.length ? '▊' : '')
                      : task.label}
                  </span>
                </div>
              );
            };

            return <TaskTypewriter key={task.id} task={task} />;
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
