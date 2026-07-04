# Role Comparison Agent

A specialized AI agent that compares extracted resume skills against selected target roles and provides detailed gap analysis, priority levels, and personalized learning recommendations.

## Features

### Supported Target Roles
- **Frontend Developer** - JavaScript/TypeScript, React/Vue/Angular, web frameworks
- **Backend Developer** - Python/Java/Go, FastAPI/Django/Express, databases, cloud platforms
- **Full Stack Developer** - Combined frontend and backend skills
- **Data Scientist** - Python, R, SQL, ML frameworks, data visualization tools
- **AI Engineer** - Python, TensorFlow/PyTorch, LangChain/LangGraph, deep learning

### Capabilities

1. **Skill Gap Analysis**
   - Identifies missing skills for target role
   - Categorizes by skill type (programming language, framework, tool, etc.)
   - Prioritizes gaps (Critical, High, Medium, Low)

2. **Priority Levels**
   - **Critical**: Fundamental skills required for the role
   - **High**: Important for performing well
   - **Medium**: Will enhance capabilities
   - **Low**: Nice to have, provides additional value

3. **Learning Resources**
   - Curated learning resources for each skill
   - Estimated learning hours
   - Recommended learning path

4. **Readiness Assessment**
   - Skill match percentage
   - Overall readiness level (Ready to Apply, Nearly Ready, Some Experience, Beginner Level, Early Stage)
   - Summary with actionable insights

## API Endpoints

### Compare Skills Against Role
```
POST /api/v1/roles/compare
```

**Request Body:**
```json
{
  "skills": {
    "programming_languages": ["Python", "JavaScript"],
    "frameworks": ["React", "FastAPI"],
    "databases": ["PostgreSQL"],
    "cloud_platforms": ["AWS"],
    "soft_skills": ["Communication"],
    "certifications": [],
    "tools": ["Git", "Docker"]
  },
  "target_role": "Full Stack Developer"
}
```

**Response:**
```json
{
  "target_role": "Full Stack Developer",
  "extracted_skills": {...},
  "missing_skills": [
    {
      "skill_name": "TypeScript",
      "category": "programming_languages",
      "priority_level": "critical",
      "why_important": "This is a fundamental skill required for this role.",
      "learning_resources": ["TypeScript Handbook", "TypeScript Deep Dive", "Pluralsight"],
      "estimated_learning_hours": 50
    },
    {
      "skill_name": "Angular",
      "category": "frameworks",
      "priority_level": "high",
      "why_important": "This skill is important for performing well in this role.",
      "learning_resources": ["Angular Documentation", "Angular University", "Pluralsight"],
      "estimated_learning_hours": 100
    }
  ],
  "matched_skills": {
    "programming_languages": ["Python", "JavaScript"],
    "frameworks": ["React", "FastAPI"],
    "databases": ["PostgreSQL"],
    "cloud_platforms": ["AWS"],
    "tools": ["Git", "Docker"]
  },
  "skill_match_percentage": 75.5,
  "overall_readiness": "Nearly Ready",
  "recommended_learning_path": [
    "TypeScript (critical)",
    "Angular (high)",
    "Kubernetes (medium)",
    "Spring Boot (low)"
  ],
  "total_learning_hours": 350,
  "summary": "You have 75.5% skill match for Full Stack Developer role. Current readiness level: Nearly Ready. You need to acquire 4 additional skills to be competitive for this role. Follow the recommended learning path to improve your qualifications."
}
```

### Get Available Roles
```
GET /api/v1/roles/roles
```

**Response:**
```json
{
  "roles": [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Data Scientist",
    "AI Engineer"
  ],
  "total": 5
}
```

## Usage Example

### 1. Extract Skills from Resume
```bash
# First, upload and extract skills from resume
POST /api/v1/resumes/upload
```

### 2. Get Available Roles
```bash
# Check available target roles
GET /api/v1/roles/roles
```

### 3. Compare Skills Against Target Role
```bash
# Compare extracted skills against target role
POST /api/v1/roles/compare
Content-Type: application/json

{
  "skills": {
    "programming_languages": ["Python", "JavaScript"],
    "frameworks": ["React", "FastAPI"],
    "databases": ["PostgreSQL"],
    "cloud_platforms": ["AWS"],
    "soft_skills": ["Communication"],
    "certifications": [],
    "tools": ["Git", "Docker"]
  },
  "target_role": "Full Stack Developer"
}
```

## Architecture

### Components

1. **Schema** (`app/schemas/role_comparison.py`)
   - `TargetRole`: Enum of supported roles
   - `PriorityLevel`: Enum for skill gap priorities
   - `SkillGap`: Individual skill gap with details
   - `RoleComparisonResult`: Complete comparison result

2. **Service** (`app/services/role_comparison_service.py`)
   - `RoleComparisonService`: Core comparison logic
   - Role requirements definitions
   - Learning resources catalog
   - Learning hour estimates
   - Gap analysis and prioritization

3. **Agent** (`app/graphs/role_comparison_agent.py`)
   - `RoleComparisonAgent`: LangGraph node implementation
   - Graph building using StateGraph pattern
   - Integration with service layer

4. **Routes** (`app/api/v1/routes/role_comparison.py`)
   - POST `/roles/compare`: Comparison endpoint
   - GET `/roles/roles`: Available roles endpoint

## Role Requirements

Each role has defined requirements across priority levels:

### Frontend Developer
- **Critical**: JavaScript, TypeScript, React/Angular/Vue/Next.js, Git
- **High**: HTML, CSS, Figma, Webpack
- **Medium**: PostgreSQL/MongoDB, Docker, GitHub Actions
- **Low**: AWS/Azure/GCP

### Backend Developer
- **Critical**: Python/Java/Go/C#/JavaScript, FastAPI/Django/Node.js/Spring Boot, PostgreSQL/MongoDB/MySQL
- **High**: Git, Docker, AWS/Azure/GCP
- **Medium**: Kubernetes, Jenkins, Problem Solving
- **Low**: TensorFlow, PyTorch

### Full Stack Developer
- **Critical**: JavaScript, TypeScript, Python, React/Next.js, Node.js/FastAPI, PostgreSQL/MongoDB
- **High**: Git, Docker, AWS/Azure/GCP
- **Medium**: Django, Vue, Kubernetes, GitHub Actions
- **Low**: Leadership, Mentoring

### Data Scientist
- **Critical**: Python, R, SQL, TensorFlow/PyTorch/Pandas/Scikit-learn, PostgreSQL/MongoDB/BigQuery
- **High**: Git, Tableau, Power BI, AWS/Azure/GCP
- **Medium**: Docker, Kubernetes, Communication
- **Low**: AWS Certifications

### AI Engineer
- **Critical**: Python, TensorFlow/PyTorch/LangChain/LangGraph, Git, Docker
- **High**: PostgreSQL/MongoDB/Redis, AWS/Azure/GCP
- **Medium**: Kubernetes, Java, C++
- **Low**: AWS Certifications

## Learning Path Strategy

The recommended learning path is generated by:
1. Sorting gaps by priority (Critical → High → Medium → Low)
2. Calculating total learning hours
3. Recommending top 10 skills in priority order
4. Providing specific learning resources for each skill

## Readiness Levels

| Match % | Level | Description |
|---------|-------|-------------|
| 80%+ | Ready to Apply | Highly qualified, can apply immediately |
| 60-79% | Nearly Ready | Close to qualification, minor gaps |
| 40-59% | Some Experience | Moderate experience, significant gaps |
| 20-39% | Beginner Level | Limited experience, substantial learning needed |
| <20% | Early Stage | Foundational skills needed |

## Integration

The role comparison agent integrates seamlessly with:
- **Skill Extraction Agent**: Uses extracted skills as input
- **LangGraph**: Uses graph-based workflow pattern
- **FastAPI**: Exposed through REST API
- **Pydantic**: Type-safe data validation

## Future Enhancements

- [ ] AI-powered learning resource recommendations using LLM
- [ ] Personalized learning timeline generation
- [ ] Real-time market demand tracking
- [ ] Salary benchmarking by role and skill level
- [ ] Mentorship matching recommendations
- [ ] Interview preparation resources
- [ ] Project suggestions for skill development
