export interface PINValidationResult {
  valid: boolean;
  year: string;
  yearFull: string;
  collegeCode: string;
  deptCode: string;
  studentPin: string;
  errors: string[];
}

export interface DeptInfo {
  code: string;
  name: string;
}

export const DEPARTMENTS: DeptInfo[] = [
  { code: "CS", name: "Computer Science" },
  { code: "IT", name: "Information Technology" },
  { code: "EC", name: "Electronics & Communication" },
  { code: "EE", name: "Electrical Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "CV", name: "Civil Engineering" },
  { code: "IE", name: "Industrial Engineering" },
];

/** Default college code — used only as fallback. Actual code comes from institution DB. */
export const COLLEGE_CODE = "622";

export const YEAR_CODES: Record<string, string> = {
  "23": "2023-24",
  "24": "2024-25",
  "25": "2025-26",
  "26": "2026-27",
  "27": "2027-28",
  "28": "2028-29",
  "29": "2029-30",
};

/**
 * Dynamic PIN regex builder.
 * Format: YY<collegeCode>-DEPT-NNN
 * College code can be any alphanumeric string (set by admin per institution).
 */
function buildPinRegex(collegeCode: string): RegExp {
  const escaped = collegeCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^(\\d{2})(${escaped})-([A-Za-z]{2,4})-(\\d{3})$`);
}

export function validatePIN(pin: string, collegeCode: string = COLLEGE_CODE): PINValidationResult {
  const result: PINValidationResult = {
    valid: false,
    year: "",
    yearFull: "",
    collegeCode: "",
    deptCode: "",
    studentPin: "",
    errors: [],
  };

  if (!pin || pin.trim() === "") {
    result.errors.push("PIN number is required");
    return result;
  }

  const normalizedPin = pin.trim().toUpperCase();
  const regex = buildPinRegex(collegeCode);
  const match = normalizedPin.match(regex);

  if (!match) {
    result.errors.push(
      `Invalid PIN format. Expected: YY${collegeCode}-DEPT-PIN (e.g., 24${collegeCode}-CS-001)`
    );
    return result;
  }

  const yearCode = match[1];
  const pinCollegeCode = match[2];
  const deptCode = match[3].toUpperCase();
  const studentPin = match[4];

  if (pinCollegeCode !== collegeCode) {
    result.errors.push(
      `Invalid college code. Expected: ${collegeCode}, got: ${pinCollegeCode}`
    );
    return result;
  }

  if (!YEAR_CODES[yearCode]) {
    const validYears = Object.keys(YEAR_CODES).join(", ");
    result.errors.push(
      `Invalid year code. Must be one of: ${validYears}`
    );
    return result;
  }

  const deptExists = DEPARTMENTS.some((d) => d.code === deptCode);
  if (!deptExists) {
    const validDepts = DEPARTMENTS.map((d) => d.code).join(", ");
    result.errors.push(
      `Invalid department code. Must be one of: ${validDepts}`
    );
    return result;
  }

  const studentNum = parseInt(studentPin, 10);
  if (studentNum < 1 || studentNum > 999) {
    result.errors.push("Student PIN must be between 001 and 999");
    return result;
  }

  result.valid = true;
  result.year = yearCode;
  result.yearFull = YEAR_CODES[yearCode];
  result.collegeCode = pinCollegeCode;
  result.deptCode = deptCode;
  result.studentPin = studentPin;

  return result;
}

export function generatePIN(
  yearCode: string,
  collegeCode: string,
  deptCode: string,
  studentNumber: number
): string {
  const paddedStudentNum = String(studentNumber).padStart(3, "0");
  return `${yearCode}${collegeCode}-${deptCode.toUpperCase()}-${paddedStudentNum}`;
}

export function getDeptName(code: string): string {
  const dept = DEPARTMENTS.find((d) => d.code === code.toUpperCase());
  return dept?.name || "Unknown Department";
}

export function getYearDisplay(yearCode: string): string {
  return YEAR_CODES[yearCode] || `20${yearCode}-${parseInt(yearCode) + 1}`;
}

export function formatPIN(pin: string, collegeCode?: string): string {
  const result = validatePIN(pin, collegeCode);
  if (!result.valid) return pin;

  return `${result.year}${result.collegeCode}-${result.deptCode}-${result.studentPin}`;
}

export function isPINRegistered(pin: string, existingPins: string[]): boolean {
  const normalizedPin = pin.trim().toUpperCase();
  return existingPins.map((p) => p.toUpperCase()).includes(normalizedPin);
}

export const PIN_EXAMPLES = {
  valid: [
    "23622-CS-001",
    "23622-IT-015",
    "23622-EC-050",
    "24622-ME-100",
  ],
  invalid: [
    "invalid",
    "23-622-CS-001",
    "99622-CS-001",
    "23622-XYZ-001",
    "23622-CS-000",
    "23622-CS-1000",
  ],
};
