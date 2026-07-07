# AI Resume Analyzer & Career Advisor

> Transform a static resume into personalized, actionable career intelligence.

The **AI Resume Analyzer & Career Advisor** is a production-ready full-stack Agentic AI application that analyzes PDF resumes and generates personalized career guidance.

Users can upload a resume and receive:

- ATS compatibility analysis
- Automatic skill extraction
- AI-powered career recommendations
- Target-role comparison
- Missing skill identification
- Interview preparation guidance
- Certification recommendations
- Personalized 30/60/90-day learning roadmap
- Analysis history

The application uses a resilient multi-provider AI architecture with **OpenAI as the primary provider** and **Groq as the automatic fallback provider**.

---

## Live Application

### Frontend

**Live Demo:**

https://resume-generator-git-main-prabakaran2.vercel.app/

### Backend

The backend is deployed on Railway.

### GitHub Repository

https://github.com/prabav2004/resume_generator

---

## Project Overview

Most candidates have a resume but do not have a clear understanding of:

- How well their resume performs in ATS systems
- Which career roles match their current skills
- Which important skills they are missing
- How to prepare for interviews
- Which certifications they should pursue
- What they should learn over the next 30, 60, and 90 days

This project solves these problems by converting a resume into a complete personalized career action plan.

The application combines multiple career tools into a single intelligent workflow.

---

## Key Features

### Resume PDF Upload

Users can securely upload a PDF resume.

The backend:

1. Validates the uploaded file
2. Stores it temporarily
3. Extracts resume text
4. Sends the extracted content through the analysis pipeline

---

### Resume Parsing

The application extracts text directly from uploaded PDF resumes.

The parsed text is used by downstream services for:

- Skill extraction
- ATS analysis
- Career recommendations
- Role comparison
- Learning roadmap generation

---

### Automatic Skill Extraction

The application identifies skills from the resume and organizes them into categories.

Examples include:

- Programming languages
- Frameworks
- Databases
- Development tools
- Cloud technologies
- Soft skills

Hugging Face models are used as part of the skill analysis pipeline.

---

### ATS Resume Analysis

The ATS Analyzer Agent evaluates the resume and generates:

- ATS compatibility score
- Resume strengths
- Resume weaknesses
- Section-level analysis
- Improvement recommendations

The ATS score helps candidates understand how well their resume may perform in automated screening systems.

---

### AI Career Recommendations

The Career Recommendation Agent analyzes the candidate's resume and generates:

- Suitable career roles
- Match scores
- Detailed suitability reasons
- Career strengths
- Areas for improvement
- Interview preparation guidance
- Technical preparation topics
- Behavioral interview tips
- Sample interview questions
- Recommended certifications
- Salary growth strategies
- High-value skills to learn

---

### Target Role Comparison

Users can select a target career role.

The Role Comparison Agent compares the candidate's extracted skills with the requirements of the selected role.

The system generates:

- Role match percentage
- Existing relevant skills
- Missing skills
- Skill-gap analysis
- Priority areas for improvement

Example:

```text
Target Role: Frontend Developer

Role Match: 72%

Existing Skills:
- JavaScript
- React
- HTML
- CSS

Missing Skills:
- TypeScript
- Next.js
- Advanced Testing