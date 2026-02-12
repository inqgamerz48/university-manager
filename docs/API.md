# API Documentation

## Base URL
```
https://your-project.vercel.app/api
```

---

## Authentication

### POST /api/auth/login
Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "STUDENT"
  },
  "redirect": "/student/dashboard"
}
```

**Errors:**
```json
{
  "error": "Invalid credentials"
}
```

---

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your-password",
  "pinNumber": "PIN123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "redirect": "/student/dashboard"
}
```

---

### GET /api/auth/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "STUDENT",
  "profile": {
    "full_name": "John Doe",
    "pin_number": "PIN123",
    "year": "YEAR_1",
    "semester": "SEM_1"
  }
}
```

---

## Admin

### GET /api/admin/users
List all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` - Search by email or name
- `role` - Filter by role
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "STUDENT",
      "profile": {
        "full_name": "John Doe"
      },
      "created_at": "2026-02-12T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### PATCH /api/admin/users/:id
Update user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "role": "FACULTY",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "FACULTY"
  }
}
```

---

### PATCH /api/admin/users/:id/role
Update user role (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "role": "ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User role updated successfully"
}
```

---

### GET /api/admin/stats
Get dashboard statistics (Admin only).

**Response:**
```json
{
  "totalUsers": 1250,
  "totalStudents": 1000,
  "totalFaculty": 50,
  "totalBranches": 12,
  "totalSubjects": 89,
  "pendingComplaints": 5,
  "todayAttendance": 850,
  "activeAssignments": 45
}
```

---

## Assignments

### GET /api/assignments
List assignments.

**Query Parameters:**
- `subject_id` - Filter by subject
- `faculty_id` - Filter by faculty
- `page` - Page number
- `limit` - Items per page

**Response:**
```json
{
  "assignments": [
    {
      "id": "uuid",
      "title": "Database Project",
      "description": "Design a database for...",
      "due_date": "2026-02-28T23:59:59Z",
      "max_grade": 100,
      "subject_code": "CS301",
      "subject_name": "Database Systems",
      "faculty_name": "Dr. Smith",
      "is_active": true
    }
  ],
  "total": 50
}
```

---

### POST /api/assignments
Create new assignment (Faculty only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Database Project",
  "description": "Design a database for college management",
  "instructions": "Use ER diagrams...",
  "due_date": "2026-02-28T23:59:59Z",
  "max_grade": 100,
  "subject_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "assignment": {
    "id": "uuid",
    "title": "Database Project",
    ...
  }
}
```

---

### POST /api/assignments/:id/submit
Submit assignment (Student only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- `file` - Assignment file (PDF, DOC, DOCX, XLSX)
- `content` - Optional text content

**Response:**
```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "assignment_id": "uuid",
    "student_id": "uuid",
    "file_url": "https://...",
    "submitted_at": "2026-02-12T00:00:00Z"
  }
}
```

---

## Attendance

### GET /api/attendance
Get attendance records.

**Query Parameters:**
- `student_id` - Filter by student
- `subject_id` - Filter by subject
- `from_date` - Start date
- `to_date` - End date

**Response:**
```json
{
  "attendance": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "subject_id": "uuid",
      "date": "2026-02-12",
      "status": "PRESENT",
      "subject_code": "CS301",
      "subject_name": "Database Systems"
    }
  ]
}
```

---

### POST /api/attendance
Mark attendance (Faculty only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "student_id": "uuid",
  "subject_id": "uuid",
  "date": "2026-02-12",
  "status": "PRESENT"
}
```

**Response:**
```json
{
  "success": true,
  "attendance": {
    "id": "uuid",
    "student_id": "uuid",
    "status": "PRESENT"
  }
}
```

---

## Notices

### GET /api/notices
List notices.

**Query Parameters:**
- `category` - Filter by category
- `priority` - Filter by priority

**Response:**
```json
{
  "notices": [
    {
      "id": "uuid",
      "title": "Mid-Semester Exams",
      "content": "Mid-semester exams will commence...",
      "priority": "high",
      "category": "exam",
      "published_at": "2026-02-12T00:00:00Z",
      "published_by_name": "Dr. Smith"
    }
  ]
}
```

---

### POST /api/notices
Create notice (Admin/Faculty only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Mid-Semester Exams",
  "content": "Mid-semester exams will commence...",
  "priority": "high",
  "category": "exam"
}
```

---

## Complaints

### GET /api/complaints
List complaints.

**Response:**
```json
{
  "complaints": [
    {
      "id": "uuid",
      "title": "Library Issues",
      "description": "Books not available...",
      "category": "infrastructure",
      "status": "PENDING",
      "priority": "medium",
      "created_at": "2026-02-12T00:00:00Z"
    }
  ]
}
```

---

### POST /api/complaints
Submit complaint (Student only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Library Issues",
  "description": "Books not available...",
  "category": "infrastructure",
  "priority": "medium"
}
```

---

### PATCH /api/complaints/:id
Update complaint status (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "resolution": "Working on it..."
}
```

---

## Imports

### POST /api/imports/students
Bulk import students from CSV.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- `file` - CSV file with columns: pin_number, first_name, last_name, email, year, semester, course_code, course_name

**Response:**
```json
{
  "success": true,
  "imported": 50,
  "errors": [
    {
      "row": 25,
      "pin_number": "PIN123",
      "error": "Duplicate pin_number"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to access this resource"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

API endpoints are rate limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

---

## Versioning

API versioning is handled via URL prefix: `/api/v1/...`

Current version: v1
