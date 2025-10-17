import { Goal, JournalEntry, MicroSkill } from '../types';

// Simulate a Firestore-like in-memory database
const db: Record<string, any> = {
    users: {}
};

// Access mandatory global variables
const appId = (window as any).__app_id;
const firebaseConfig = (window as any).__firebase_config;
const authToken = (window as any).__initial_auth_token;

console.log("Firestore Service Initialized with:", { appId, firebaseConfig });

const simulateLatency = <T,>(data: T, delay: number = 1500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const initUserDb = (userId: string) => {
    if (!db.users[userId]) {
        db.users[userId] = { 
            pm_goals: {}, 
            context_journal: {} 
        };
    }
}

export const saveGoal = async (userId: string, goalText: string): Promise<Goal> => {
    const goalPath = `/artifacts/${appId}/users/${userId}/pm_goals/current_goal`;
    console.log(`[Firestore SIM] Authenticating with token: ${authToken.substring(0, 10)}...`);
    console.log(`[Firestore SIM] Saving goal to path: ${goalPath}`);
    
    const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        text: goalText,
        status: 'in-progress',
    };

    initUserDb(userId);
    db.users[userId].pm_goals.current_goal = newGoal;

    console.log("[Firestore SIM] Current DB state:", JSON.stringify(db, null, 2));
    return simulateLatency(newGoal);
};

export const saveJournalEntry = async (userId: string, entryText: string): Promise<JournalEntry> => {
    const journalPath = `/artifacts/${appId}/users/${userId}/context_journal/tacit_knowledge`;
    console.log(`[Firestore SIM] Saving journal entry to path: ${journalPath}`);
    
    const newEntry: JournalEntry = {
        id: `journal_${Date.now()}`,
        text: entryText,
        timestamp: new Date(),
    };

    initUserDb(userId);
    db.users[userId].context_journal.tacit_knowledge = newEntry;
    
    console.log("[Firestore SIM] Current DB state:", JSON.stringify(db, null, 2));
    return simulateLatency(newEntry);
};

export const getPrivateJournal = async (userId: string): Promise<JournalEntry | null> => {
    const journalPath = `/artifacts/${appId}/users/${userId}/context_journal/tacit_knowledge`;
    console.log(`[Firestore SIM] Retrieving journal from path: ${journalPath}`);
    
    const entry = db.users[userId]?.context_journal?.tacit_knowledge || null;

    return simulateLatency(entry);
}

export const logPerformanceMetric = async (userId: string, skill: MicroSkill, success: boolean): Promise<{ status: string, tcr: number }> => {
    const metricsPath = `/artifacts/${appId}/performance_metrics`;
    console.log(`[Firestore SIM] Logging performance metric for skill '${skill.title}' to ${metricsPath}`);

    const tcr = Math.random() * (0.95 - 0.85) + 0.85; // Simulate a high TCR
    const log = {
        skillId: skill.id,
        userId,
        timestamp: new Date(),
        success,
        tcr: tcr.toFixed(2),
    };
    
    if (!db.performance_metrics) db.performance_metrics = [];
    db.performance_metrics.push(log);
    
    console.log("[Firestore SIM] Current DB state:", JSON.stringify(db, null, 2));
    return simulateLatency({ status: "logged", tcr });
}
