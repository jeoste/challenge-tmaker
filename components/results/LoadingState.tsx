'use client';

import { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';

interface Task {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface LoadingStateProps {
  totalTasks?: number;
}

export function LoadingState({ totalTasks = 4 }: LoadingStateProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', label: 'Accessing Reddit subreddits...', status: 'pending' },
    { id: '2', label: 'Extracting pain points...', status: 'pending' },
    { id: '3', label: 'LLM Scoring in progress...', status: 'pending' },
    { id: '4', label: 'Generating blueprints...', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) => {
        const newTasks = [...prev];
        const currentIndex = newTasks.findIndex(
          (t) => t.status === 'in_progress'
        );
        const nextPendingIndex = newTasks.findIndex(
          (t) => t.status === 'pending'
        );

        if (currentIndex >= 0) {
          newTasks[currentIndex].status = 'completed';
        }

        if (nextPendingIndex >= 0) {
          newTasks[nextPendingIndex].status = 'in_progress';
        }

        const completedCount = newTasks.filter(
          (t) => t.status === 'completed'
        ).length;
        setProgress((completedCount / newTasks.length) * 100);

        return newTasks;
      });
    }, 1500);

    // Start first task
    setTimeout(() => {
      setTasks((prev) => {
        const newTasks = [...prev];
        newTasks[0].status = 'in_progress';
        return newTasks;
      });
    }, 500);

    return () => clearInterval(interval);
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
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 font-mono text-sm"
            >
              {task.status === 'completed' && (
                <Check className="h-4 w-4 text-terminal flex-shrink-0" />
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
                {task.label}
              </span>
            </div>
          ))}
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
