/**
 * SRM 2021 Regulation Grade Calculator
 * Internal: 60 marks
 * ESE: 40 marks
 * Total: 100 marks
 */

export interface ComponentMarks {
  cycleTest1: number; // max 20
  cycleTest2: number; // max 20
  assignmentQuiz: number; // max 10
  attendance: number; // max 5 (optional)
}

export interface GradeResult {
  internalMarks: number; // out of 60
  eseMarks: number; // out of 40
  totalMarks: number; // out of 100
  percentage: number; // 0-100
  grade: string; // O, A+, A, B+, B, C, F
  gradePoint: number; // 10, 9, 8, 7, 6, 5, 0
}

// SRM Grade mapping (Academic Regulation 2021)
const gradeMapping = [
  { minPercentage: 90, grade: 'O', gradePoint: 10 },    // Outstanding
  { minPercentage: 80, grade: 'A+', gradePoint: 9 },    // Excellent
  { minPercentage: 70, grade: 'A', gradePoint: 8 },     // Very Good
  { minPercentage: 60, grade: 'B+', gradePoint: 7 },    // Good
  { minPercentage: 50, grade: 'B', gradePoint: 6 },     // Average
  { minPercentage: 40, grade: 'C', gradePoint: 5 },     // Pass
  { minPercentage: 0, grade: 'F', gradePoint: 0 },      // Fail
];

/**
 * Calculate internal marks from component scores
 * Formula: (CT1 + CT2 + Assignment + Attendance) normalized to 60
 */
export function calculateInternalMarks(components: ComponentMarks): number {
  // Maximum possible marks in continuous evaluation
  const maxInternal = 20 + 20 + 10 + 5; // 55 marks total
  
  // Sum obtained marks (with validation)
  const obtainedMarks = 
    Math.min(components.cycleTest1, 20) +
    Math.min(components.cycleTest2, 20) +
    Math.min(components.assignmentQuiz, 10) +
    Math.min(components.attendance, 5);
  
  // Normalize to 60 marks
  // Formula: (obtained / maxPossible) * 60
  const internalMarks = (obtainedMarks / maxInternal) * 60;
  
  return Math.round(internalMarks * 100) / 100; // 2 decimal places
}

/**
 * Calculate final grade based on internal and ESE marks
 */
export function calculateGrade(totalMarks: number): { grade: string; gradePoint: number } {
  const percentage = (totalMarks / 100) * 100;
  
  for (const mapping of gradeMapping) {
    if (percentage >= mapping.minPercentage) {
      return { grade: mapping.grade, gradePoint: mapping.gradePoint };
    }
  }
  
  return { grade: 'F', gradePoint: 0 };
}

/**
 * Get complete grade calculation result
 */
export function calculateGradeResult(
  components: ComponentMarks,
  eseMarks: number
): GradeResult {
  const internalMarks = calculateInternalMarks(components);
  const validESE = Math.min(Math.max(eseMarks, 0), 40); // Clamp between 0-40
  const totalMarks = internalMarks + validESE;
  const percentage = (totalMarks / 100) * 100;
  const { grade, gradePoint } = calculateGrade(totalMarks);
  
  return {
    internalMarks: Math.round(internalMarks * 100) / 100,
    eseMarks: validESE,
    totalMarks: Math.round(totalMarks * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    grade,
    gradePoint,
  };
}

/**
 * Calculate required ESE marks to achieve a target grade
 */
export function calculateRequiredESE(
  components: ComponentMarks,
  targetGrade: string
): number | null {
  const internalMarks = calculateInternalMarks(components);
  
  // Find minimum percentage needed for target grade
  const targetMapping = gradeMapping.find(m => m.grade === targetGrade);
  if (!targetMapping) return null;
  
  // Calculate required total marks for this grade
  const requiredTotalMarks = (targetMapping.minPercentage / 100) * 100;
  const requiredESE = requiredTotalMarks - internalMarks;
  
  // Check if achievable
  if (requiredESE > 40) return null; // Not achievable
  if (requiredESE < 0) return 0; // Already achieved
  
  return Math.ceil(requiredESE * 100) / 100;
}

/**
 * Validate component marks
 */
export function validateComponentMarks(components: ComponentMarks): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (components.cycleTest1 < 0 || components.cycleTest1 > 20) {
    errors.push('Cycle Test 1 must be between 0-20');
  }
  if (components.cycleTest2 < 0 || components.cycleTest2 > 20) {
    errors.push('Cycle Test 2 must be between 0-20');
  }
  if (components.assignmentQuiz < 0 || components.assignmentQuiz > 10) {
    errors.push('Assignment/Quiz must be between 0-10');
  }
  if (components.attendance < 0 || components.attendance > 5) {
    errors.push('Attendance must be between 0-5');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get all available grades
 */
export function getAvailableGrades(): string[] {
  return gradeMapping.map(m => m.grade);
}
