# PM's Deep Work Co-Pilot

The PM's Deep Work Co-Pilot is an intelligent web application designed to help Product Managers and other knowledge workers structure their day for focused, strategic work. It acts as an AI partner, facilitating a "virtuous context loop" where the user provides goals and tacit knowledge, and the AI provides tailored assistance, learning nudges, and task delegation capabilities.

## Table of Contents
1.  [Product Requirements](#product-requirements)
    - [Vision & Goal](#vision--goal)
    - [Target Audience](#target-audience)
    - [Core Problem](#core-problem)
    - [Key Features](#key-features)
2.  [UI/UX Design](#uiux-design)
    - [Design Philosophy](#design-philosophy)
    - [Layout](#layout)
    - [Key Components](#key-components)
3.  [Technical Design & Architecture](#technical-design--architecture)
    - [Tech Stack](#tech-stack)
    - [Project Structure](#project-structure)
    - [System Design](#system-design)
    - [The Virtuous Context Loop](#the-virtuous-context-loop)

---

## Product Requirements

### Vision & Goal
To create an AI-powered co-pilot that empowers knowledge workers to combat distraction, foster deep work, and enhance their strategic thinking skills. The application aims to move beyond simple task management to become an active partner in achieving daily professional goals.

### Target Audience
-   **Primary:** Product Managers (PMs) who need to balance tactical execution with long-term strategic planning.
-   **Secondary:** Program Managers, UX Designers, Engineers, and any knowledge worker whose role demands periods of intense, focused effort.

### Core Problem
Modern knowledge workers are constantly bombarded with notifications and context-switching demands, making it difficult to allocate meaningful time for "deep work." Planning a focused day is hard, and existing tools often add to the cognitive load rather than reducing it.

### Key Features
-   **Daily Plan Management:** Users can define a primary "big rock" task and several smaller tasks for the day. Tasks can be linked to external sources like Jira or Google Docs and checked off upon completion.
-   **Context-Aware AI Co-Pilot:**
    -   **Assistant Mode:** An always-available chat assistant for brainstorming, asking questions, and refining ideas.
    -   **Delegate Mode:** After locking in a daily plan, the user can delegate specific, context-heavy tasks (e.g., "Draft a value proposition") to the AI.
-   **Context Capture Journal:** A private, free-form text area where users can input "tacit knowledge"—internal thoughts, assumptions, and proprietary context—that the AI uses to inform its responses.
-   **Dynamic Learning Moments:** Based on the user's "big rock" task, the app automatically generates 1-3 relevant micro-learning activities (e.g., articles, videos) to sharpen relevant skills.
-   **Focus Tools:** A dedicated UI panel includes:
    -   A **Pomodoro Timer** to structure work/break intervals.
    -   A **Mindful Relaxation** prompt.
    -   A minimalist **Spotify Player** integration for focus music.
-   **Real-time Performance Dashboard:**
    -   **Focus Score:** Rates the quality of the daily plan. A high score is achieved with one "big rock" and a minimal number of other tasks.
    -   **Learning Score:** Tracks the completion percentage of the day's learning activities.
    -   **Context Meter:** Fills up as the user provides more information in their journal, visualizing how much context the AI has to work with.

---

## UI/UX Design

### Design Philosophy
-   **Focus-Oriented:** A dark-themed, minimalist, and clutter-free interface designed to minimize distractions.
-   **Informative & Actionable:** Key metrics are always visible but unobtrusive. UI elements are intuitive and provide clear affordances for interaction.
-   **Seamless Experience:** Smooth transitions and animations guide the user through the workflow, from planning to execution.

### Layout
The application uses a responsive, multi-panel layout:
1.  **Header:** A slim, persistent header contains the application title and the three core performance scores (Focus, Learning, Context).
2.  **Center Panel (Deep Work Journal):** The user's primary workspace. It houses the daily plan, learning moments, focus tools, and the context capture journal. This panel is always visible.
3.  **Right Panel (AI Context Agent):** A collapsible panel for all AI interactions. It features a toggle between "Delegate" and "Assistant" modes, a chat history view, and an input field.

### Key Components
-   `HeaderScores`: Provides an at-a-glance dashboard of the user's performance metrics.
-   `DeepWorkJournal`: The central hub for user input, combining task lists, learning activities, and the journal.
-   `FocusTools`: A self-contained, tabbed widget for managing focus sessions.
-   `AIContextAgent`: The primary interface for all Gemini-powered interactions, ensuring a clear separation between user planning and AI collaboration.

---

## Technical Design & Architecture

### Tech Stack
-   **Frontend:** React (v19) with TypeScript, Vite
-   **Styling:** Tailwind CSS
-   **AI Model:** Google Gemini API (`gemini-2.5-flash`) via the `@google/genai` SDK
-   **Backend (Simulated):** An in-memory key-value store (`firestoreService.ts`) simulates Firestore database interactions for persisting goals and journal entries without requiring a real backend.

### Project Structure
```
/
├── public/
├── src/
│   ├── components/       # Reusable React components (icons, cards, etc.)
│   ├── services/         # Modules for external interactions (e.g., firestoreService.ts)
│   ├── App.tsx           # Main application component, handles state and logic
│   ├── index.tsx         # React root entry point
│   └── types.ts          # Centralized TypeScript type definitions
├── index.html            # HTML entry point
├── README.md             # This file
└── ... (config files)
```

### System Design

The application is a client-side single-page application (SPA) that interacts with two primary external systems: the simulated Firestore database for state persistence and the Google Gemini API for intelligence.

#### Data Flow Diagram
```mermaid
---
config:
  theme: forest
  themeVariables:
    fontSize: 18px
---
graph TD
    PM[👤 Product Manager / Knowledge Worker]
    subgraph app["Deep Work Co-Pilot"]
        Journal[📝 Deep Work Journal Plan Tasks + Capture Context]
        Metrics[📊 Performance Dashboard Focus/Learning/Context Scores]
        AI[🤖 AI Context Agent Assistant + Delegate Modes]
        Focus[⏱️ Focus Tools Pomodoro/Music/Relax]
    end
    Storage[(💾 Context Storage Goals + Tacit Knowledge)]
    Gemini[🧠 Google Gemini API AI Intelligence]
    PM -->|1\. Sets Goals & Captures Context| Journal
    PM -->|2\. Chats & Delegates Tasks| AI
    PM -->|3\. Uses Focus Sessions| Focus
    PM -->|4\. Monitors Progress| Metrics
    Journal -->|Saves Context| Storage
    Storage -->|Primes AI with User Context| Gemini
    Gemini -->|Intelligent Responses| AI
    AI -->|Generates Learning Nudges| Journal
    Journal -.->|Completion Data| Metrics
    Focus -.->|Activity Data| Metrics
    style PM fill:#A435F0,stroke:#7C1BAB,stroke-width:3px,color:#fff
    style Journal fill:#FF6D00,stroke:#E65100,stroke-width:2px,color:#fff
    style AI fill:#A435F0,stroke:#7C1BAB,stroke-width:3px,color:#fff
    style Gemini fill:#A435F0,stroke:#7C1BAB,stroke-width:2px,color:#fff
    style Storage fill:#1C1D1F,stroke:#000,stroke-width:2px,color:#fff
    style Metrics fill:#EC5252,stroke:#C41E3A,stroke-width:2px,color:#fff
    style Focus fill:#EC5252,stroke:#C41E3A,stroke-width:2px,color:#fff
    style app fill:#f5f5f5,stroke:#A435F0,stroke-width:3px
```

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'16px'}}}%%
graph TD
    subgraph ui["🖥️ User Interface Layer"]
        PM[Product Manager/<br/>Knowledge Worker]
        Header[Header Scores:<br/>Focus/Learning/Context]
        Journal[Deep Work Journal:<br/>Daily Plan + Tasks]
        FocusTools[Focus Tools:<br/>Pomodoro/Music/Relax]
        Learning[Learning Moments:<br/>Micro-Activities]
    end
    
    subgraph core["⚡ Core Application Logic"]
        AppState[App.tsx<br/>State Management]
        Router[React Router<br/>SPA Navigation]
    end
    
    subgraph ai["🤖 AI Co-Pilot Engine"]
        ChatUI[AI Context Agent UI:<br/>Assistant/Delegate Mode]
        GeminiAPI[Google Gemini API<br/>gemini-2.5-flash]
        SystemPrompt[System Instruction<br/>Context Priming]
        ChatHistory[Chat Session<br/>Conversation Memory]
    end
    
    subgraph data["💾 Data Persistence Layer"]
        FirestoreService[Firestore Service<br/>In-Memory Store]
        GoalStore[(Goals &<br/>Big Rocks)]
        JournalStore[(Context Journal<br/>Tacit Knowledge)]
        TaskStore[(Daily Tasks &<br/>Completions)]
    end
    
    subgraph external["🔗 External Integrations"]
        Jira[Jira API<br/>Task Links]
        GoogleDocs[Google Docs<br/>Document Links]
        Spotify[Spotify Player<br/>Focus Music]
    end
    
    %% User Interactions
    PM -->|Inputs Daily Plan| Journal
    PM -->|Captures Context| Journal
    PM -->|Uses Focus Tools| FocusTools
    PM -->|Engages Learning| Learning
    PM -->|Chats with AI| ChatUI
    
    %% UI to Core
    Journal -->|Updates State| AppState
    FocusTools -->|Updates Metrics| AppState
    Learning -->|Tracks Completion| AppState
    ChatUI -->|Manages Sessions| AppState
    
    %% Core to Data
    AppState -->|Persists Goals| FirestoreService
    AppState -->|Saves Journal| FirestoreService
    AppState -->|Stores Tasks| FirestoreService
    
    FirestoreService -->|Writes| GoalStore
    FirestoreService -->|Writes| JournalStore
    FirestoreService -->|Writes| TaskStore
    
    %% Data to AI
    GoalStore -->|Loads Context| SystemPrompt
    JournalStore -->|Loads Context| SystemPrompt
    
    %% AI Flow
    ChatUI -->|Sends Query| GeminiAPI
    SystemPrompt -->|Primes AI| GeminiAPI
    ChatHistory -->|Provides History| GeminiAPI
    GeminiAPI -->|Returns Response| ChatUI
    GeminiAPI -->|Generates Nudges| Learning
    
    %% External Integration
    Journal -.->|Links Tasks| Jira
    Journal -.->|Links Docs| GoogleDocs
    FocusTools -.->|Plays Music| Spotify
    
    %% Metrics Flow
    AppState -->|Calculates Scores| Header
    
    %% Virtuous Loop
    TaskStore -.->|Completion Data| AppState
    Learning -.->|Engagement Data| AppState
    AppState -.->|Improves Context| SystemPrompt
    
    style PM fill:#A435F0,stroke:#7C1BAB,stroke-width:2px,color:#fff
    style GeminiAPI fill:#A435F0,stroke:#7C1BAB,stroke-width:3px,color:#fff
    style ChatUI fill:#A435F0,stroke:#7C1BAB,stroke-width:2px,color:#fff
    style Journal fill:#FF6D00,stroke:#E65100,stroke-width:2px,color:#fff
    style Learning fill:#EC5252,stroke:#C41E3A,stroke-width:2px,color:#fff
    style FocusTools fill:#EC5252,stroke:#C41E3A,stroke-width:2px,color:#fff
    style AppState fill:#A435F0,stroke:#7C1BAB,stroke-width:2px,color:#fff
    style FirestoreService fill:#1C1D1F,stroke:#000,stroke-width:2px,color:#fff
    style GoalStore fill:#1C1D1F,stroke:#000,stroke-width:2px,color:#fff
    style JournalStore fill:#1C1D1F,stroke:#000,stroke-width:2px,color:#fff
    style TaskStore fill:#1C1D1F,stroke:#000,stroke-width:2px,color:#fff
    style SystemPrompt fill:#A435F0,stroke:#7C1BAB,stroke-width:2px,color:#fff
    style Header fill:#FF6D00,stroke:#E65100,stroke-width:2px,color:#fff
    
    style ui fill:#f5f5f5,stroke:#A435F0,stroke-width:2px
    style core fill:#f5f5f5,stroke:#FF6D00,stroke-width:2px
    style ai fill:#f5f5f5,stroke:#A435F0,stroke-width:3px
    style data fill:#f5f5f5,stroke:#1C1D1F,stroke-width:2px
    style external fill:#f5f5f5,stroke:#EC5252,stroke-width:2px,stroke-dasharray: 5 5
```

### The Virtuous Context Loop
This is the core concept driving the application's unique value.

1.  **Context Input:** The user defines a high-level goal (the "big rock" task) and provides detailed, private thoughts in the "Context Capture Journal."
2.  **Context Persistence:** This information is saved via the `firestoreService`.
3.  **AI Priming:** When the daily plan is locked in, the application initializes a new `Chat` instance with the Gemini API. The goal and journal entry are used to construct a highly specific `systemInstruction`, priming the AI with the user's unique context.
4.  **Contextual Interaction:** All subsequent interactions in both "Assistant" and "Delegate" mode are now deeply informed by this context, leading to more relevant and valuable AI responses.
5.  **Feedback & Iteration:** The AI provides drafts and learning nudges. The user's engagement with these (e.g., completing learning activities) is tracked, closing the loop and reinforcing the deep work cycle.