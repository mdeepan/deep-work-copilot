
import React from 'react';
import type { MicroSkill } from '../types';
import { LightbulbIcon } from './icons';

interface LearningNudgeCardProps {
  skill: MicroSkill;
}

export const LearningNudgeCard: React.FC<LearningNudgeCardProps> = ({ skill }) => {
  return (
    <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg p-5 shadow-lg text-white animate-fade-in-up mt-6">
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 p-2 rounded-full">
          <LightbulbIcon className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <p className="text-sm font-semibold text-yellow-300">Applying Micro-Skill</p>
          <h3 className="text-xl font-bold mt-1">{skill.title}</h3>
          <p className="mt-2 text-white/90">{skill.description}</p>
          <a
            href={skill.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-sm font-semibold bg-white/90 text-teal-700 px-4 py-2 rounded-md hover:bg-white transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
};
