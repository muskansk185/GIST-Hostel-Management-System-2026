export const DEPARTMENT_MAP: Record<string, string> = {
  'CSE': 'Computer Science and Engineering',
  'AIDS': 'Artificial Intelligence and Data Science',
  'AIML': 'Artificial Intelligence and Machine Learning',
  'ECE': 'Electronics and Communication Engineering',
  'EEE': 'Electrical and Electronics Engineering',
  'MECH': 'Mechanical Engineering',
  'CIVIL': 'Civil Engineering',
  'DS': 'Data Science',
  'CS': 'Computer Science'
};

export const getFullDepartmentName = (shortName?: string) => {
  if (!shortName) return '';
  return DEPARTMENT_MAP[shortName] || shortName;
};
