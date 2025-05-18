// Format date for display
export const formatDate = (dateString: string): string => {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Convert time difference to seconds
  const seconds = Math.floor(diff / 1000);
  
  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  // Handle future dates
  if (seconds < 0) {
    return "in the future";
  }
  
  // Just now
  if (seconds < 60) {
    return "just now";
  }
  
  // For each interval, check if the difference is greater
  // and calculate the number of units
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    
    if (interval >= 1) {
      // Return the relative time in the appropriate unit
      return interval === 1 
        ? `1 ${unit} ago` 
        : `${interval} ${unit}s ago`;
    }
  }
  
  return "just now";
};

// Formats a score on a scale of 1-5 to a descriptive level
export const formatScoreLevel = (score: number): string => {
  if (score < 2) return "Needs Improvement";
  if (score < 3) return "Developing";
  if (score < 4) return "Proficient";
  if (score < 4.5) return "Advanced";
  return "Exemplary";
};

// Alias for formatScoreLevel to maintain compatibility
export const getScoreText = formatScoreLevel;

// Calculate score percentage from score value and maximum possible score
export const calculateScorePercentage = (score: number, maxScore: number = 5): number => {
  return Math.round((score / maxScore) * 100);
};

// Get appropriate color class based on score level
export const getScoreColorClass = (score: number): string => {
  if (score < 2) return "text-red-500";
  if (score < 3) return "text-orange-500";
  if (score < 4) return "text-blue-500";
  return "text-green-500";
};

// Get scoring scale color (alias for getScoreColorClass)
export const getScoreColor = getScoreColorClass;

// Get badge color class based on score
export const getScoreBadgeColor = (score: number): string => {
  if (score < 2) return "bg-red-100 text-red-800";
  if (score < 3) return "bg-orange-100 text-orange-800";
  if (score < 4) return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
};