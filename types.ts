export enum FlowStep {
  GoalInitiation = 1, // Goal not set
  ContextCapture = 2, // Goal set, ready for journal
  DeepWorkDelegation = 3, // Journal saved, ready to delegate
  ReviewAndIteration = 4, // First draft done, ready for feedback/next step
  TaskCompletion = 5, // Second draft done, ready for approval
  Completed = 6, // Approved and finished
}

export interface MicroSkill {
  id: string;
  title: string;
  description: string;
  link: string;
}

export interface Goal {
    id: string;
    text: string;
    status: 'in-progress' | 'completed';
}

export interface JournalEntry {
    id: string;
    text: string;
    timestamp: Date;
}

export type ChatMessage = 
  | { type: 'agent'; text: string }
  | { type: 'nudge'; skill: MicroSkill }
  | { type: 'draft'; title: string; content: string }
  | { type: 'success'; text: string; tcr: number };
  
export type AssistantChatMessage = {
  role: 'user' | 'model';
  content: string;
};

// New types for enhanced features
export type TaskSourceType = 'jira' | 'gdoc' | 'slack' | 'manual';

export interface TaskSource {
    type: TaskSourceType;
    identifier: string;
    link: string;
}

export interface Task {
    id: string;
    text: string;
    isBigRock: boolean;
    completed: boolean;
    source?: TaskSource;
}

export type LearningActivityType = 'video' | 'article' | 'role-play';

export interface LearningActivity {
    id: string;
    type: LearningActivityType;
    title: string;
    completed: boolean;
    link: string;
}
