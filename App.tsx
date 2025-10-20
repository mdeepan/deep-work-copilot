
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FlowStep, MicroSkill, ChatMessage, AssistantChatMessage, Task, LearningActivity, LearningActivityType, TaskSource } from './types';
import * as FirestoreService from './services/firestoreService';
import { LearningNudgeCard } from './components/LearningNudgeCard';
import { 
    CheckCircleIcon, LoadingSpinner, CalendarIcon, BriefcaseIcon, GlobeIcon, SparklesIcon, 
    ChevronLeftIcon, ChevronRightIcon, WandSparklesIcon, ChatBubbleLeftRightIcon,
    VideoCameraIcon, DocumentTextIcon, UsersIcon, JiraIcon, GDocIcon, LinkIcon,
    PlayIcon, PauseIcon, StopIcon, MoonIcon, SpotifyIcon, BackwardIcon, ForwardIcon, 
    PlayCircleIcon, PauseCircleIcon, TargetIcon, BrainIcon, FunnelIcon, UserCircleIcon,
    PlusCircleIcon, ArrowPathIcon, Cog6ToothIcon, TrashIcon
} from './components/icons';
import { GoogleGenAI, Chat } from '@google/genai';

const MICRO_SKILLS: Record<string, MicroSkill> = {
  PLAYING_TO_WIN: {
    id: 'ms_001',
    title: 'Playing to Win Framework',
    description: 'A practical approach to strategy that frames it as a set of five crucial, integrated choices.',
    link: '#',
  },
  MARKET_SIZING_API: {
    id: 'ms_002',
    title: 'Market Sizing: API-as-a-Product',
    description: 'Techniques for estimating market size specifically for API-based products, considering developer adoption and usage-based pricing.',
    link: '#',
  },
};

const USER_ID = `pm_${Math.random().toString(36).substring(2, 9)}`;

const initialTasks: Task[] = [
    { id: 'task_1', text: "Develop a pitch deck for the 'Quick Share' feature based on Competitor X's announcement.", isBigRock: true, completed: false, source: { type: 'jira', identifier: 'PROD-123', link: '#' } },
    { id: 'task_2', text: 'Sync with design on Q3 roadmap', isBigRock: false, completed: false },
    { id: 'task_3', text: 'Review final UXR findings for checkout flow', isBigRock: false, completed: false, source: { type: 'gdoc', identifier: 'UXR Findings', link: '#' } },
    { id: 'task_4', text: 'Prep for weekly business review', isBigRock: false, completed: false },
];

const learningActivityIcons: Record<LearningActivityType, React.FC<{className?: string}>> = {
    'video': VideoCameraIcon,
    'article': DocumentTextIcon,
    'role-play': UsersIcon
};

const taskSourceIcons: Record<TaskSource['type'], React.FC<{className?: string}>> = {
    'jira': JiraIcon,
    'gdoc': GDocIcon,
    'slack': () => <></>, // Placeholder
    'manual': LinkIcon
};

// =================================================================
// Header Scores Component
// =================================================================
const HeaderScores: React.FC<{ focusScore: number; learningScore: number; contextValue: number }> = ({ focusScore, learningScore, contextValue }) => {
    const getScoreColor = (score: number) => {
        if (score > 80) return 'text-green-400';
        if (score > 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="absolute top-2 right-4 flex items-center space-x-6">
            <div className="flex items-center space-x-2" title="Focus Score: Measures the quality of your daily plan. A high score means a focused plan with one 'big rock' task.">
                <TargetIcon className={`w-5 h-5 ${getScoreColor(focusScore)}`} />
                <div>
                    <span className="text-sm font-bold text-white">{focusScore}</span>
                    <span className="text-xs text-gray-400">/100</span>
                </div>
            </div>
             <div className="flex items-center space-x-2" title="Learning Score: Based on completed learning moments for the day.">
                <BrainIcon className={`w-5 h-5 ${getScoreColor(learningScore)}`} />
                 <div>
                    <span className="text-sm font-bold text-white">{learningScore}</span>
                    <span className="text-xs text-gray-400">%</span>
                </div>
            </div>
            <div className="flex items-center space-x-2" title="Context Meter: Fills up as you provide more tacit knowledge in your journal.">
                <FunnelIcon className={`w-5 h-5 ${getScoreColor(contextValue)}`} />
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${contextValue}%` }}></div>
                </div>
            </div>
        </div>
    );
};


// =================================================================
// Focus Tools Component
// =================================================================
const FocusTools: React.FC<{ isEnabled: boolean }> = ({ isEnabled }) => {
    const [activeTab, setActiveTab] = useState<'timer' | 'relax' | 'music'>('timer');
    
    // Pomodoro State
    const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerActive, setIsTimerActive] = useState(false);

    // Spotify State
    const [spotifyConnected, setSpotifyConnected] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!isTimerActive || !isEnabled) return;
        if (timeLeft <= 0) {
            setTimerMode(prev => prev === 'work' ? 'break' : 'work');
            setTimeLeft(timerMode === 'work' ? 5 * 60 : 25 * 60);
            new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3').play();
            return;
        }
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isTimerActive, timeLeft, timerMode, isEnabled]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const resetTimer = () => {
        setIsTimerActive(false);
        setTimerMode('work');
        setTimeLeft(25 * 60);
    };

    const renderTimer = () => (
        <div className="text-center">
            <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${timerMode === 'work' ? 'text-teal-400' : 'text-indigo-400'}`}>{timerMode} Session</p>
            <p className="text-6xl font-mono font-bold text-white">{formatTime(timeLeft)}</p>
            <div className="flex justify-center space-x-4 mt-4">
                <button onClick={() => setIsTimerActive(!isTimerActive)} className="text-gray-300 hover:text-white transition-colors" aria-label={isTimerActive ? "Pause" : "Play"}>
                    {isTimerActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10"/>}
                </button>
                 <button onClick={resetTimer} className="text-gray-300 hover:text-white transition-colors" aria-label="Reset">
                    <StopIcon className="w-10 h-10"/>
                </button>
            </div>
        </div>
    );
    
    const renderRelax = () => (
        <div className="text-center">
            <MoonIcon className="w-12 h-12 text-indigo-400 mx-auto mb-2"/>
            <h4 className="font-bold text-white">Mindful Moment</h4>
            <p className="text-sm text-gray-400 mt-2">Take a deep breath in... and out. <br />Clear your mind and refocus your energy.</p>
        </div>
    );
    
    const renderMusic = () => (
        <div>
            {spotifyConnected ? (
                <div className="flex items-center space-x-4">
                    <img src="https://i.scdn.co/image/ab67616d00004851f53199741de97e5158655be6" alt="Album art" className="w-16 h-16 rounded-md"/>
                    <div className="flex-grow">
                        <p className="font-bold text-white">Lo-fi beats</p>
                        <p className="text-sm text-gray-400">Spotify</p>
                         <div className="flex items-center space-x-4 mt-2">
                             <BackwardIcon className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer"/>
                             <button onClick={() => setIsPlaying(!isPlaying)}>
                                {isPlaying ? <PauseCircleIcon className="w-8 h-8 text-white"/> : <PlayCircleIcon className="w-8 h-8 text-white"/>}
                             </button>
                             <ForwardIcon className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer"/>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <SpotifyIcon className="w-10 h-10 text-green-500 mx-auto mb-3"/>
                    <button onClick={() => setSpotifyConnected(true)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-full hover:bg-green-700 transition-colors text-sm">
                        Connect Spotify
                    </button>
                </div>
            )}
        </div>
    );

    const tabs = {
        timer: { label: 'Timer', content: renderTimer() },
        relax: { label: 'Relax', content: renderRelax() },
        music: { label: 'Music', content: renderMusic() },
    };

    return (
         <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div className="flex border-b border-gray-700 mb-4">
                {Object.keys(tabs).map((key) => (
                     <button key={key} onClick={() => setActiveTab(key as any)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${activeTab === key ? 'text-white border-indigo-500' : 'text-gray-400 border-transparent hover:text-white'}`}>
                         {tabs[key as keyof typeof tabs].label}
                     </button>
                ))}
            </div>
            {tabs[activeTab as keyof typeof tabs].content}
        </div>
    )
};


// =================================================================
// Center Panel: Deep Work Journal
// =================================================================
const DeepWorkJournal: React.FC<{
    currentStep: FlowStep;
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    learningActivities: LearningActivity[];
    setLearningActivities: (activities: LearningActivity[]) => void;
    journal: string;
    setJournal: (j: string) => void;
    onSavePlan: () => void;
    isLoading: boolean;
    onDeleteTask: (id: string) => void;
    onSetBigRock: (id: string) => void;
    onOpenMcpModal: () => void;
}> = ({ 
    currentStep, tasks, setTasks, learningActivities, setLearningActivities, 
    journal, setJournal, onSavePlan, isLoading, onDeleteTask, onSetBigRock, onOpenMcpModal
}) => {
    
    const [newTaskText, setNewTaskText] = useState("");
    const isPlanEditable = currentStep === FlowStep.GoalInitiation;
    const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), []);
    const bigRockTask = useMemo(() => tasks.find(t => t.isBigRock), [tasks]);

    const handleTaskChange = (id: string, newText: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, text: newText } : t));
    };

    const toggleTaskCompletion = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const toggleLearningActivityCompletion = (id: string) => {
        setLearningActivities(learningActivities.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
    };

    const handleAddTask = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newTaskText.trim()) {
            const newTask: Task = {
                id: `task_${Date.now()}`,
                text: newTaskText.trim(),
                isBigRock: false,
                completed: false
            };
            setTasks([...tasks, newTask]);
            setNewTaskText("");
        }
    };

    const handleSyncTasks = () => {
        const syncedTasks: Task[] = [
            { id: 'task_sync_1', text: "Finalize Q4 budget proposal with finance", isBigRock: false, completed: false, source: { type: 'gdoc', identifier: 'Q4 Budget Draft', link: '#' }},
            { id: 'task_sync_2', text: "Triage new bug reports from the weekend", isBigRock: false, completed: false, source: { type: 'jira', identifier: 'PROD-BUGS', link: '#' }},
        ];
        const existingIds = new Set(tasks.map(t => t.id));
        const newTasks = syncedTasks.filter(t => !existingIds.has(t.id));
        setTasks([...tasks, ...newTasks]);
    };


    return (
        <div className="flex-1 bg-gray-800 p-8 flex flex-col space-y-6 overflow-y-auto">
            <div className="flex items-center space-x-3 text-gray-400">
                <CalendarIcon className="w-6 h-6" />
                <span className="text-lg font-semibold text-white">{today}</span>
            </div>
            
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between text-gray-300 mb-4">
                    <div className="flex items-center space-x-3">
                        <BriefcaseIcon className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Today's Plan</h2>
                    </div>
                    {isPlanEditable && (
                         <div className="flex items-center space-x-3">
                            <button onClick={handleSyncTasks} className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white bg-gray-700/50 px-2 py-1 rounded-md transition-colors" title="Sync tasks from enterprise apps">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                                <span>Sync</span>
                            </button>
                            <button onClick={onOpenMcpModal} className="text-xs text-gray-400 hover:text-white bg-gray-700/50 px-2 py-1 rounded-md transition-colors">
                                MCP
                            </button>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <div key={task.id} className="group flex items-start space-x-3">
                            <input type="checkbox" checked={task.completed} onChange={() => toggleTaskCompletion(task.id)} className="mt-1.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                            <div className="flex-grow">
                                <input
                                    type="text"
                                    value={task.text}
                                    onChange={(e) => handleTaskChange(task.id, e.target.value)}
                                    className={`w-full bg-transparent transition-all ${task.completed ? 'line-through text-gray-500' : 'text-white'} ${task.isBigRock ? 'font-bold' : 'text-sm text-gray-300'} ${isPlanEditable ? 'border-b border-transparent focus:outline-none focus:border-indigo-500' : ''}`}
                                    placeholder={task.isBigRock ? "e.g., Draft strategic pitch for 'Quick Share' feature" : "New Task"}
                                    disabled={!isPlanEditable}
                                />
                                {task.source && (
                                    <a href={task.source.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-indigo-400 mt-1">
                                        {React.createElement(taskSourceIcons[task.source.type], { className: `w-3 h-3 ${task.source.type === 'jira' ? 'text-blue-400' : 'text-blue-500'}` })}
                                        <span>{task.source.identifier}</span>
                                    </a>
                                )}
                            </div>
                            {isPlanEditable && (
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onSetBigRock(task.id)} title="Set as Big Rock Task">
                                        <TargetIcon className={`w-5 h-5 ${task.isBigRock ? 'text-indigo-400' : 'text-gray-600 hover:text-indigo-400'}`} />
                                    </button>
                                    <button onClick={() => onDeleteTask(task.id)} title="Delete Task">
                                        <TrashIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                 {isPlanEditable && (
                    <form onSubmit={handleAddTask} className="mt-4 flex items-center space-x-2 border-t border-gray-700 pt-4">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-grow bg-gray-700/50 border border-gray-600 rounded-md py-1.5 px-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        <button type="submit" className="p-1.5 text-gray-400 hover:text-white" title="Add task">
                            <PlusCircleIcon className="w-6 h-6" />
                        </button>
                    </form>
                )}
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                 <div className="flex items-center space-x-3 text-gray-300 mb-4">
                    <SparklesIcon className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-xl font-bold">Today's Learning Moments</h2>
                </div>
                {learningActivities.length > 0 ? (
                     <div className="space-y-3">
                        {learningActivities.map(activity => {
                            const Icon = learningActivityIcons[activity.type];
                            return (
                                <div key={activity.id} className="flex items-start space-x-3">
                                    <input type="checkbox" checked={activity.completed} onChange={() => toggleLearningActivityCompletion(activity.id)} className="mt-1.5 h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500" />
                                    <div className="flex items-center space-x-3 flex-grow">
                                        <div className="bg-gray-700 p-2 rounded-full">
                                            <Icon className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <div>
                                            <a href={activity.link} target="_blank" rel="noopener noreferrer" className={`text-sm font-semibold hover:text-indigo-400 ${activity.completed ? 'line-through text-gray-500' : 'text-white'}`}>{activity.title}</a>
                                            <p className="text-xs text-gray-500 capitalize">{activity.type}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">Define your Big Rock Task to generate learning activities.</p>
                )}
            </div>

            <FocusTools isEnabled={currentStep >= FlowStep.ContextCapture} />

            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex-grow flex flex-col">
                <div className="flex items-center space-x-3 text-gray-300 mb-1">
                    <GlobeIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Context Capture</h2>
                </div>
                 <p className="text-sm text-gray-400 mb-4">This is your private space. The agent will use this as proprietary context.</p>
                 <label htmlFor="journal" className="block text-sm font-bold text-gray-400 mb-2">Tacit Context (Journal)</label>
                 <textarea
                    id="journal"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    className={`w-full flex-grow p-4 bg-gray-700/50 border ${isPlanEditable ? 'border-gray-600 focus:ring-2 focus:ring-indigo-500' : 'border-gray-700 text-gray-500'} rounded-md text-gray-300 transition-all text-sm leading-6`}
                    placeholder={
                        isPlanEditable ? "Internal data shows share usage is down 25%. My assumption is the UI is too complex..."
                        : "Daily plan has been locked in. Context is ready for the agent."
                    }
                    disabled={!isPlanEditable}
                 />
                 {isPlanEditable && (
                    <button onClick={onSavePlan} disabled={isLoading || !journal || !bigRockTask?.text} className="mt-4 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                        {isLoading ? <LoadingSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : "Lock in Daily Plan"}
                    </button>
                 )}
            </div>
        </div>
    );
};

// =================================================================
// Right Panel: AI Context Agent
// =================================================================
const AIContextAgent: React.FC<{
    currentStep: FlowStep;
    bigRockTask: string;
    agentMode: 'delegate' | 'assistant';
    setAgentMode: (mode: 'delegate' | 'assistant') => void;
    feed: ChatMessage[];
    onDelegate: (step: FlowStep) => void;
    isAgentThinking: boolean;
    assistantHistory: AssistantChatMessage[];
    onSendAssistantMessage: (message: string) => void;
    isAssistantThinking: boolean;

}> = ({ 
    currentStep, 
    bigRockTask,
    agentMode,
    setAgentMode,
    feed, 
    onDelegate, 
    isAgentThinking,
    assistantHistory,
    onSendAssistantMessage,
    isAssistantThinking
}) => {
    const [chatInput, setChatInput] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [feed, assistantHistory, isAgentThinking, isAssistantThinking]);

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onSendAssistantMessage(chatInput.trim());
            setChatInput("");
        }
    };
    
    const generateContextualPrompts = (task: string): {key: string, text: string, prompt: string}[] => {
        const prompts: {key: string, text: string, prompt: string}[] = [];
        
        if (currentStep < FlowStep.DeepWorkDelegation) {
            prompts.push({ key: 'define-br', text: "Help me define a 'big rock' task for today.", prompt: "Help me define a 'big rock' task for today." });
            prompts.push({ key: 'good-plan', text: "What makes a good daily plan?", prompt: "What makes a good daily plan?" });
            return prompts;
        }

        if(task) {
             prompts.push({ key: 'find-experts', text: "Find experts who can help with my task", prompt: `Find experts in our company who could help with: "${task}"` });
        }
       
        const lowerTask = task.toLowerCase();
        if (lowerTask.includes('strategy') || lowerTask.includes('pitch')) {
            prompts.push({ key: 'craft-strategy', text: "Help me craft an effective strategy", prompt: "Help me craft an effective strategy" });
            prompts.push({ key: 'strategy-pitfalls', text: "What are common pitfalls in strategy documents?", prompt: "What are common pitfalls in strategy documents?" });
        }
        if (lowerTask.includes('market') || lowerTask.includes('sizing')) {
            prompts.push({ key: 'tam-sam', text: "Explain TAM, SAM, SOM in simple terms", prompt: "Explain TAM, SAM, SOM in simple terms" });
        }
        if (prompts.length <= 1) { // Only expert finder was added
             prompts.push({ key: 'break-down', text: "Help me break this task down", prompt: "Help me break this task down" });
             prompts.push({ key: 'first-step', text: "What's a good first step?", prompt: "What's a good first step?" });
        }
        return prompts;
    }
    const contextualPrompts = useMemo(() => generateContextualPrompts(bigRockTask), [bigRockTask, currentStep]);


    const renderDelegateFeedItem = (item: ChatMessage, index: number) => {
        switch(item.type) {
            case 'agent':
                return <p key={index} className="text-sm text-gray-300">{item.text}</p>
            case 'nudge':
                return <LearningNudgeCard key={index} skill={item.skill} />
            case 'draft':
                 return (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-md border border-gray-700 my-2 animate-fade-in-up">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">{item.title}</h3>
                        <div className="prose prose-invert prose-sm text-gray-300" dangerouslySetInnerHTML={{ __html: item.content.replace(/\n\n/g, '<br/><br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                )
            case 'success':
                 return (
                    <div key={index} className="text-center p-4 bg-green-900/50 border border-green-700 rounded-lg animate-fade-in-up">
                        <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2"/>
                        <h2 className="font-bold text-white">{item.text}</h2>
                        <p className="text-sm text-gray-400 mt-1">TCR: <span className="font-bold text-green-400">{(item.tcr * 100).toFixed(1)}%</span> logged.</p>
                    </div>
                 )
            default:
                return null;
        }
    }

    const renderDelegateView = () => (
        <>
            <div ref={chatContainerRef} className="flex-grow bg-gray-800 rounded-lg p-4 space-y-4 overflow-y-auto">
                {feed.length === 0 && <p className="text-center text-sm text-gray-500 italic">Agent is standing by...</p>}
                {feed.map(renderDelegateFeedItem)}
                 {isAgentThinking && (
                    <div className="flex items-center space-x-2 text-gray-400">
                        <LoadingSpinner className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Agent is thinking...</span>
                    </div>
                )}
            </div>
            <div className="mt-6">
                {renderActionButton()}
            </div>
        </>
    );

    const renderAssistantView = () => (
        <>
            <div ref={chatContainerRef} className="flex-grow bg-gray-800 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto">
               {assistantHistory.length === 0 ? (
                    <div className="text-center m-auto">
                        <h3 className="font-bold text-white">Assistant Mode</h3>
                        <p className="text-sm text-gray-400 mb-4">How can I help you think deeply today?</p>
                        <div className="space-y-2">
                            {contextualPrompts.map(p => (
                                <button key={p.key} onClick={() => onSendAssistantMessage(p.prompt)} className="w-full text-left text-sm bg-gray-700/50 p-2 rounded-md hover:bg-gray-700 transition-colors">{p.text}</button>
                            ))}
                        </div>
                    </div>
               ) : (
                    assistantHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))
               )}
                {isAssistantThinking && (
                    <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                             <LoadingSpinner className="w-4 h-4 animate-spin" />
                             <span className="text-sm">...</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask your co-pilot..."
                        disabled={isAssistantThinking}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-600"
                    />
                    <button type="submit" disabled={isAssistantThinking || !chatInput.trim()} className="bg-indigo-600 text-white font-bold p-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 transition-colors">Send</button>
                </form>
            </div>
        </>
    );

    const renderActionButton = () => {
        switch (currentStep) {
            case FlowStep.DeepWorkDelegation:
                return <button onClick={() => onDelegate(FlowStep.DeepWorkDelegation)} disabled={isAgentThinking} className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm">Delegate: Draft Value Prop</button>;
            case FlowStep.ReviewAndIteration:
                return <button onClick={() => onDelegate(FlowStep.ReviewAndIteration)} disabled={isAgentThinking} className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-md hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm">Delegate: Refine Market Sizing</button>;
            case FlowStep.TaskCompletion:
                return <button onClick={() => onDelegate(FlowStep.TaskCompletion)} disabled={isAgentThinking} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm">Approve Final Draft</button>;
            default:
                return <p className="text-center text-sm text-gray-500 italic">Lock in your daily plan to delegate tasks.</p>;
        }
    }

    return (
        <div className="bg-gray-900/80 p-6 flex flex-col border-l border-gray-700 h-full">
            <div className="flex-shrink-0 mb-4">
                <div className="flex items-center bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setAgentMode('delegate')} disabled={currentStep < FlowStep.DeepWorkDelegation} className={`w-1/2 flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-semibold transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${agentMode === 'delegate' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                        <WandSparklesIcon className="w-5 h-5" />
                        <span>Delegate</span>
                    </button>
                    <button onClick={() => setAgentMode('assistant')} className={`w-1/2 flex items-center justify-center space-x-2 rounded-md py-2 text-sm font-semibold transition-colors disabled:text-gray-600 disabled:cursor-not-allowed ${agentMode === 'assistant' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        <span>Assistant</span>
                    </button>
                </div>
            </div>
            
            {agentMode === 'delegate' ? renderDelegateView() : renderAssistantView()}
        </div>
    );
};


// =================================================================
// User Profile Popover Component
// =================================================================
const UserProfilePopover: React.FC<{
    context: string;
    setContext: (context: string) => void;
    onClose: () => void;
}> = ({ context, setContext, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div ref={popoverRef} className="absolute top-16 left-4 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-30 p-4 animate-fade-in-up">
            <h3 className="text-lg font-bold text-white mb-2">My Context</h3>
            <p className="text-sm text-gray-400 mb-3">This context is automatically prepended to all AI conversations to personalize your experience.</p>
            <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={6}
                className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md text-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={onClose} className="mt-3 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm">
                Close
            </button>
        </div>
    );
};


// =================================================================
// MCP Config Modal Component
// =================================================================
const McpConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-4">MCP Server Configuration</h2>
                <p className="text-sm text-gray-400 mb-4">Configure the connection to your enterprise MCP server to sync tools and data.</p>
                <div>
                    <label htmlFor="mcp-url" className="block text-sm font-medium text-gray-300 mb-2">Server URL</label>
                    <input
                        type="text"
                        id="mcp-url"
                        placeholder="https://mcp.my-enterprise.com"
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-md py-2 px-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm">
                        Cancel
                    </button>
                    <button onClick={onClose} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

// =================================================================
// Main App Component
// =================================================================
const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.GoalInitiation);
    const [isLoading, setIsLoading] = useState(false);
    const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
    
    // Delegate state
    const [isAgentThinking, setIsAgentThinking] = useState(false);
    const [chatFeed, setChatFeed] = useState<ChatMessage[]>([]);
    
    // Assistant state
    const [agentMode, setAgentMode] = useState<'delegate' | 'assistant'>('assistant');
    const [isAssistantThinking, setIsAssistantThinking] = useState(false);
    const [assistantChatHistory, setAssistantChatHistory] = useState<AssistantChatMessage[]>([]);
    const [chat, setChat] = useState<Chat | null>(null);

    // Journal & Task state
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [learningActivities, setLearningActivities] = useState<LearningActivity[]>([]);
    const [journal, setJournal] = useState<string>("");
    const bigRockTaskText = useMemo(() => tasks.find(t => t.isBigRock)?.text || '', [tasks]);

    // User Profile state
    const [userProfileContext, setUserProfileContext] = useState<string>(
        "I am a Product Manager for the 'Creator Tools' team at a large tech company. My primary focus this quarter is on improving user engagement and retention for our video editing features. I value clear, data-driven strategies and concise communication."
    );
    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);


    const aiRef = useRef<GoogleGenAI | null>(null);
    if (!aiRef.current) {
        aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    }

    // --- Score Calculations ---
    const focusScore = useMemo(() => {
        const hasBigRock = tasks.some(t => t.isBigRock);
        if (!hasBigRock) {
            return Math.max(0, 50 - tasks.length * 10);
        }
        const score = 70 + (4 - tasks.length) * 10;
        return Math.min(100, Math.max(0, score));
    }, [tasks]);

    const learningScore = useMemo(() => {
        const total = learningActivities.length;
        if (total === 0) return 0;
        const completed = learningActivities.filter(a => a.completed).length;
        return Math.round((completed / total) * 100);
    }, [learningActivities]);
    
    const contextValue = useMemo(() => {
        const maxLength = 500; // Arbitrary max length for 100%
        return Math.min(100, Math.round((journal.length / maxLength) * 100));
    }, [journal]);


    useEffect(() => {
        if (bigRockTaskText) {
            const generatedActivities: LearningActivity[] = [];
            const text = bigRockTaskText.toLowerCase();
            if (text.includes('pitch') || text.includes('deck') || text.includes('strategy')) {
                generatedActivities.push({ id: 'la_1', type: 'article', title: 'Components of a Killer Pitch Deck', completed: false, link: '#' });
                generatedActivities.push({ id: 'la_2', type: 'video', title: 'Nailing Your Product Strategy', completed: false, link: '#' });
            }
             if (text.includes('uxr') || text.includes('design') || text.includes('user research')) {
                generatedActivities.push({ id: 'la_3', type: 'article', title: 'Synthesizing User Research Effectively', completed: false, link: '#' });
            }
            if (generatedActivities.length < 2 && generatedActivities.length > 0) {
                generatedActivities.push({ id: 'la_4', type: 'role-play', title: 'Practice articulating the problem statement', completed: false, link: '#' });
            }
            setLearningActivities(generatedActivities.slice(0, 3));
        } else {
            setLearningActivities([]);
        }
    }, [bigRockTaskText]);

    // Initialize a generic chat on mount
    useEffect(() => {
        if (!chat && aiRef.current) {
            const genericChat = aiRef.current.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: `${userProfileContext}\n\n---END OF PROFILE---\n\nYou are a world-class Product Manager co-pilot. Help the user plan their day and answer general questions about product management.`,
              },
            });
            setChat(genericChat);
        }
    }, [userProfileContext]); 


    const handleReset = () => {
        setCurrentStep(FlowStep.GoalInitiation);
        setIsLoading(false);
        setIsAgentThinking(false);
        setIsAgentPanelOpen(true);
        setTasks(initialTasks);
        setJournal("");
        setChatFeed([]);
        setAgentMode('assistant');
        setIsAssistantThinking(false);
        setAssistantChatHistory([]);
        if (aiRef.current) {
             const genericChat = aiRef.current.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: `${userProfileContext}\n\n---END OF PROFILE---\n\nYou are a world-class Product Manager co-pilot. Help the user plan their day and answer general questions about product management.`,
              },
            });
            setChat(genericChat);
        }
    }

    const handleSavePlan = async () => {
        setIsLoading(true);
        await FirestoreService.saveGoal(USER_ID, bigRockTaskText);
        await FirestoreService.saveJournalEntry(USER_ID, journal);
        
        if (aiRef.current) {
             const newChat = aiRef.current.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: `${userProfileContext}\n\n---END OF PROFILE---\n\nYou are a world-class Product Manager co-pilot. The user's primary goal for the day (their "Big Rock Task") is: "${bigRockTaskText}". Their private, tacit context is: "${journal}". Your role is to act as an expert sounding board and assistant. Help them think deeply, challenge their assumptions, and provide insightful information related to their task. Be concise, helpful, and format your responses with markdown where appropriate.`,
              },
            });
            setChat(newChat);
            setAssistantChatHistory([]); 
        }

        setCurrentStep(FlowStep.DeepWorkDelegation);
        setIsLoading(false);
        setAgentMode('delegate');
    };

     const handleSendAssistantMessage = async (message: string) => {
        if (!chat) return;
        setIsAssistantThinking(true);
        setAssistantChatHistory(prev => [...prev, { role: 'user', content: message }]);
        try {
            const result = await chat.sendMessageStream({ message });
            let currentResponse = "";
            setAssistantChatHistory(prev => [...prev, { role: 'model', content: "" }]);
            for await (const chunk of result) {
                currentResponse += chunk.text;
                setAssistantChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].content = currentResponse;
                    return newHistory;
                });
            }
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            setAssistantChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].content = "Sorry, I encountered an error. Please try again.";
                return newHistory;
            });
        } finally {
            setIsAssistantThinking(false);
        }
    };


    const performAgentAction = useCallback(async (delegatedStep: FlowStep) => {
        setIsAgentThinking(true);
        if (agentMode !== 'delegate') setAgentMode('delegate');
        if (!isAgentPanelOpen) setIsAgentPanelOpen(true);

        switch (delegatedStep) {
            case FlowStep.DeepWorkDelegation:
                setChatFeed(prev => [...prev, { type: 'agent', text: "Understood. Accessing proprietary context from your journal..." }]);
                await FirestoreService.getPrivateJournal(USER_ID);
                await new Promise(res => setTimeout(res, 1500));
                setChatFeed(prev => [...prev, { type: 'nudge', skill: MICRO_SKILLS.PLAYING_TO_WIN }]);
                await new Promise(res => setTimeout(res, 2500));
                const draft1 = `**Value Proposition:** For users struggling with cumbersome sharing options, 'Quick Share' provides a one-click method to distribute content, increasing engagement by 30% unlike Competitor X's multi-step process.\n\n**Opportunity Summary:** The market for simplified content sharing is estimated at $500M. With current usage down 25%, 'Quick Share' can recapture lost users and open a new revenue stream. Initial market sizing is based on existing user data.`;
                setChatFeed(prev => [...prev, { type: 'draft', title: "DRAFT: Value Prop & Opportunity Summary", content: draft1 }]);
                setCurrentStep(FlowStep.ReviewAndIteration);
                break;
            case FlowStep.ReviewAndIteration:
                setChatFeed(prev => [...prev, { type: 'agent', text: "Acknowledged. Incorporating feedback to refine market sizing..." }]);
                await new Promise(res => setTimeout(res, 1500));
                setChatFeed(prev => [...prev, { type: 'nudge', skill: MICRO_SKILLS.MARKET_SIZING_API }]);
                await new Promise(res => setTimeout(res, 2500));
                const draft2 = `**Value Proposition:** For users struggling with cumbersome sharing options, 'Quick Share' provides a one-click method to distribute content, increasing engagement by 30% unlike Competitor X's multi-step process.\n\n**Opportunity Summary:** The market for simplified content sharing is estimated at $500M. With current usage down 25%, 'Quick Share' can recapture lost users and open a new revenue stream. **Updated market sizing reflects the new API pricing model, projecting a 15% increase in TAM to $575M.**`;
                setChatFeed(prev => [...prev, { type: 'draft', title: "REVISED DRAFT: Reflecting New API Model", content: draft2 }]);
                setCurrentStep(FlowStep.TaskCompletion);
                break;
            case FlowStep.TaskCompletion:
                 setChatFeed(prev => [...prev, { type: 'agent', text: "Final draft approved. Logging performance metrics and closing the context loop..." }]);
                 const { tcr } = await FirestoreService.logPerformanceMetric(USER_ID, MICRO_SKILLS.PLAYING_TO_WIN, true);
                 await FirestoreService.logPerformanceMetric(USER_ID, MICRO_SKILLS.MARKET_SIZING_API, true);
                 const tcrValue = Number(tcr);
                 await new Promise(res => setTimeout(res, 1500));
                 setChatFeed(prev => [...prev, { type: 'success', text: "Task Complete!", tcr: tcrValue }]);
                 setCurrentStep(FlowStep.Completed);
                break;
        }
        setIsAgentThinking(false);
    }, [isAgentPanelOpen, agentMode]);

    const handleDeleteTask = (taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    };
    
    const handleSetBigRock = (taskId: string) => {
        setTasks(prevTasks => prevTasks.map(task => ({
            ...task,
            isBigRock: task.id === taskId,
        })));
    };

    return (
        <div className="h-screen bg-gray-900 text-gray-200 flex flex-col font-sans overflow-hidden">
            <header className="relative text-center py-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm z-10 flex-shrink-0">
                 <div className="absolute top-1/2 -translate-y-1/2 left-4">
                    <button onClick={() => setIsProfilePopoverOpen(p => !p)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="View/Edit User Context">
                        <UserCircleIcon className="w-7 h-7 text-gray-300" />
                    </button>
                </div>
                 <h1 className="text-2xl font-bold text-white">Deep Work Co-Pilot</h1>
                 <HeaderScores focusScore={focusScore} learningScore={learningScore} contextValue={contextValue} />
            </header>
            <main className="flex flex-grow relative overflow-hidden">
                {isProfilePopoverOpen && (
                    <UserProfilePopover
                        context={userProfileContext}
                        setContext={setUserProfileContext}
                        onClose={() => setIsProfilePopoverOpen(false)}
                    />
                )}
                 {isMcpModalOpen && <McpConfigModal onClose={() => setIsMcpModalOpen(false)} />}
               <DeepWorkJournal 
                    currentStep={currentStep}
                    tasks={tasks}
                    setTasks={setTasks}
                    learningActivities={learningActivities}
                    setLearningActivities={setLearningActivities}
                    journal={journal}
                    setJournal={setJournal}
                    onSavePlan={handleSavePlan}
                    isLoading={isLoading}
                    onDeleteTask={handleDeleteTask}
                    onSetBigRock={handleSetBigRock}
                    onOpenMcpModal={() => setIsMcpModalOpen(true)}
               />
               <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isAgentPanelOpen ? 'w-[30rem]' : 'w-0'}`}>
                 <div className="w-[30rem] h-full overflow-hidden">
                    <AIContextAgent
                        currentStep={currentStep}
                        bigRockTask={bigRockTaskText}
                        agentMode={agentMode}
                        setAgentMode={setAgentMode}
                        feed={chatFeed}
                        onDelegate={performAgentAction}
                        isAgentThinking={isAgentThinking}
                        assistantHistory={assistantChatHistory}
                        onSendAssistantMessage={handleSendAssistantMessage}
                        isAssistantThinking={isAssistantThinking}
                    />
                 </div>
               </div>
                <button 
                    onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)} 
                    className="absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-gray-700 hover:bg-indigo-600 text-white p-2 rounded-l-md transition-all duration-300 ease-in-out"
                    style={{ transform: `translateX(${isAgentPanelOpen ? '-30rem' : '0px'}) translateY(-50%)` }}
                    aria-label={isAgentPanelOpen ? "Collapse Agent Panel" : "Expand Agent Panel"}
                >
                    {isAgentPanelOpen ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </main>
             {currentStep === FlowStep.Completed && (
                 <footer className="text-center py-3 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 flex-shrink-0 z-10">
                    <button onClick={handleReset} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors">
                        Start New Goal
                    </button>
                 </footer>
            )}
        </div>
    );
};

export default App;
