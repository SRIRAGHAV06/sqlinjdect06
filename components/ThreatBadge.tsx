
import React from 'react';
import { ThreatLevel } from '../types';

interface ThreatBadgeProps {
  level: ThreatLevel;
}

const ThreatBadge: React.FC<ThreatBadgeProps> = ({ level }) => {
  const getStyles = () => {
    switch (level) {
      case ThreatLevel.SAFE:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case ThreatLevel.LOW:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case ThreatLevel.MEDIUM:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case ThreatLevel.HIGH:
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case ThreatLevel.CRITICAL:
        return 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles()}`}>
      {level}
    </span>
  );
};

export default ThreatBadge;
