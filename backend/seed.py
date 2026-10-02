"""
Database Seed Script
=====================
Creates sample data for demonstration purposes.
"""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import db, Candidate, Skill, Job, JobSkill, Project, Certification


def seed_database(force=False):
    """Seed the database with sample data."""
    # Check if already seeded (prevent reseeding candidates after database has been initialized)
    if not force and (Skill.query.count() > 0 or Candidate.query.count() > 0):
        return False

    print("Seeding database with sample data...")

    # ==================== SKILLS ====================
    skill_names = [
        "Python", "Java", "C++", "C", "JavaScript", "TypeScript", "HTML", "CSS",
        "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "Flask",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase",
        "AWS", "Docker", "Git", "GitHub", "Kubernetes",
        "Machine Learning", "Data Science", "TensorFlow", "PyTorch",
        "Data Structures", "Algorithms", "Power BI", "Excel",
        "Linux", "REST API", "Spring Boot", "Selenium", "Redis",
    ]

    skills = {}
    for name in skill_names:
        skill = Skill.query.filter_by(name=name).first()
        if not skill:
            skill = Skill(name=name)
            db.session.add(skill)
            db.session.flush()
        skills[name] = skill

    # ==================== CANDIDATES ====================
    candidates_data = [
        {
            "name": "Rahul Sharma",
            "email": "rahul.sharma@email.com",
            "phone": "+91 9876543210",
            "education": "B.Tech",
            "university": "IIT Delhi",
            "graduation_year": "2022",
            "experience_years": 3,
            "current_company": "Google",
            "current_role": "Software Engineer",
            "skills": ["Python", "Java", "C++", "Machine Learning", "TensorFlow", "Data Structures", "Algorithms", "SQL", "Git", "Docker", "AWS", "Linux"],
            "projects": [
                {"name": "AI-Powered Resume Screener", "description": "Built a machine learning model to screen resumes using NLP techniques", "technologies": "Python, TensorFlow, Flask"},
                {"name": "Distributed Task Scheduler", "description": "Designed a distributed task scheduling system using Python and Redis", "technologies": "Python, Redis, Docker"},
                {"name": "Real-time Chat Application", "description": "Full-stack chat application with WebSocket support", "technologies": "Node.js, React, MongoDB"},
            ],
            "certifications": [
                {"name": "AWS Solutions Architect Associate", "issuer": "Amazon Web Services"},
                {"name": "TensorFlow Developer Certificate", "issuer": "Google"},
            ],
        },
        {
            "name": "Priya Patel",
            "email": "priya.patel@email.com",
            "phone": "+91 9876543211",
            "education": "M.Tech",
            "university": "IIT Bombay",
            "graduation_year": "2021",
            "experience_years": 4,
            "current_company": "Microsoft",
            "current_role": "Senior Software Engineer",
            "skills": ["Python", "Java", "C++", "JavaScript", "React", "Node.js", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Git", "Data Structures", "Algorithms", "REST API"],
            "projects": [
                {"name": "Microservices E-Commerce Platform", "description": "Developed a scalable e-commerce platform using microservices architecture", "technologies": "Java, Spring Boot, Docker, Kubernetes"},
                {"name": "Data Analytics Dashboard", "description": "Interactive analytics dashboard for business intelligence", "technologies": "React, Python, PostgreSQL, Power BI"},
            ],
            "certifications": [
                {"name": "Microsoft Azure Fundamentals", "issuer": "Microsoft"},
                {"name": "Kubernetes Administrator", "issuer": "CNCF"},
                {"name": "AWS Cloud Practitioner", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Arjun Nair",
            "email": "arjun.nair@email.com",
            "phone": "+91 9876543212",
            "education": "B.Tech",
            "university": "NIT Trichy",
            "graduation_year": "2023",
            "experience_years": 2,
            "current_company": "Amazon",
            "current_role": "Software Developer",
            "skills": ["Python", "Java", "SQL", "MySQL", "Git", "Data Structures", "Algorithms", "Linux", "HTML", "CSS", "JavaScript"],
            "projects": [
                {"name": "Inventory Management System", "description": "Web-based inventory management with role-based access control", "technologies": "Python, Django, MySQL"},
                {"name": "Student Result Portal", "description": "Online portal for viewing student results", "technologies": "Java, Spring Boot, MySQL"},
            ],
            "certifications": [
                {"name": "Oracle Java SE Programmer", "issuer": "Oracle"},
            ],
        },
        {
            "name": "Sneha Gupta",
            "email": "sneha.gupta@email.com",
            "phone": "+91 9876543213",
            "education": "B.Tech",
            "university": "BITS Pilani",
            "graduation_year": "2022",
            "experience_years": 3,
            "current_company": "Flipkart",
            "current_role": "Full Stack Developer",
            "skills": ["JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB", "HTML", "CSS", "Git", "Docker", "REST API", "AWS"],
            "projects": [
                {"name": "Social Media Dashboard", "description": "Real-time social media analytics dashboard", "technologies": "React, Node.js, MongoDB, WebSocket"},
                {"name": "Food Delivery App", "description": "Full-stack food delivery application with payment integration", "technologies": "React Native, Node.js, MongoDB"},
                {"name": "CI/CD Pipeline Automation", "description": "Automated deployment pipeline for microservices", "technologies": "Docker, Jenkins, AWS"},
            ],
            "certifications": [
                {"name": "MongoDB Developer Associate", "issuer": "MongoDB Inc."},
                {"name": "React Developer Certification", "issuer": "Meta"},
            ],
        },
        {
            "name": "Vikram Singh",
            "email": "vikram.singh@email.com",
            "phone": "+91 9876543214",
            "education": "M.S.",
            "university": "Stanford University",
            "graduation_year": "2020",
            "experience_years": 5,
            "current_company": "Apple",
            "current_role": "Senior ML Engineer",
            "skills": ["Python", "C++", "Machine Learning", "TensorFlow", "PyTorch", "Data Science", "SQL", "PostgreSQL", "Docker", "AWS", "Git", "Linux", "Data Structures", "Algorithms"],
            "projects": [
                {"name": "Neural Style Transfer Engine", "description": "Deep learning model for artistic style transfer on images", "technologies": "Python, PyTorch, CUDA"},
                {"name": "Recommendation System", "description": "Collaborative filtering recommendation engine for e-commerce", "technologies": "Python, TensorFlow, AWS"},
                {"name": "NLP Text Classifier", "description": "Multi-class text classification using transformer models", "technologies": "Python, PyTorch, Hugging Face"},
            ],
            "certifications": [
                {"name": "Deep Learning Specialization", "issuer": "Coursera (deeplearning.ai)"},
                {"name": "AWS Machine Learning Specialty", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Ananya Krishnan",
            "email": "ananya.krishnan@email.com",
            "phone": "+91 9876543215",
            "education": "B.Tech",
            "university": "VIT Vellore",
            "graduation_year": "2023",
            "experience_years": 1.5,
            "current_company": "Infosys",
            "current_role": "Software Engineer",
            "skills": ["Java", "Python", "SQL", "MySQL", "HTML", "CSS", "JavaScript", "Git", "Data Structures", "Algorithms"],
            "projects": [
                {"name": "Library Management System", "description": "Desktop application for managing library books and members", "technologies": "Java, MySQL, JavaFX"},
            ],
            "certifications": [],
        },
        {
            "name": "Rohan Desai",
            "email": "rohan.desai@email.com",
            "phone": "+91 9876543216",
            "education": "B.E.",
            "university": "Pune University",
            "graduation_year": "2021",
            "experience_years": 3.5,
            "current_company": "TCS",
            "current_role": "DevOps Engineer",
            "skills": ["Python", "Docker", "Kubernetes", "AWS", "Linux", "Git", "Jenkins", "SQL", "MongoDB", "REST API"],
            "projects": [
                {"name": "Cloud Infrastructure Automation", "description": "Automated cloud infrastructure provisioning using Terraform", "technologies": "AWS, Terraform, Python"},
                {"name": "Monitoring Dashboard", "description": "Real-time system monitoring and alerting platform", "technologies": "Python, Grafana, Prometheus"},
            ],
            "certifications": [
                {"name": "AWS DevOps Engineer Professional", "issuer": "Amazon Web Services"},
                {"name": "Docker Certified Associate", "issuer": "Docker Inc."},
            ],
        },
        {
            "name": "Meera Joshi",
            "email": "meera.joshi@email.com",
            "phone": "+91 9876543217",
            "education": "MCA",
            "university": "Mumbai University",
            "graduation_year": "2022",
            "experience_years": 2.5,
            "current_company": "Wipro",
            "current_role": "Data Analyst",
            "skills": ["Python", "SQL", "MySQL", "Power BI", "Excel", "Data Science", "Machine Learning", "Git"],
            "projects": [
                {"name": "Sales Forecasting Model", "description": "Time series forecasting for retail sales data", "technologies": "Python, Pandas, Scikit-learn"},
                {"name": "Customer Segmentation", "description": "K-means clustering for customer segmentation", "technologies": "Python, Scikit-learn, Matplotlib"},
            ],
            "certifications": [
                {"name": "Google Data Analytics Certificate", "issuer": "Google"},
                {"name": "Power BI Data Analyst", "issuer": "Microsoft"},
            ],
        },
        {
            "name": "Karthik Reddy",
            "email": "karthik.reddy@email.com",
            "phone": "+91 9876543218",
            "education": "B.Tech",
            "university": "IIIT Hyderabad",
            "graduation_year": "2022",
            "experience_years": 2,
            "current_company": "Zomato",
            "current_role": "Backend Developer",
            "skills": ["Python", "Django", "Flask", "SQL", "PostgreSQL", "Redis", "Docker", "Git", "REST API", "Linux", "Data Structures", "Algorithms"],
            "projects": [
                {"name": "API Gateway Service", "description": "High-performance API gateway with rate limiting and auth", "technologies": "Python, Flask, Redis"},
                {"name": "URL Shortener", "description": "Scalable URL shortening service", "technologies": "Python, Django, PostgreSQL"},
            ],
            "certifications": [
                {"name": "Python Professional Certificate", "issuer": "Python Institute"},
            ],
        },
        {
            "name": "Divya Menon",
            "email": "divya.menon@email.com",
            "phone": "+91 9876543219",
            "education": "B.Tech",
            "university": "NIT Warangal",
            "graduation_year": "2023",
            "experience_years": 1,
            "current_company": "Freshworks",
            "current_role": "Frontend Developer",
            "skills": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Git", "REST API", "Angular"],
            "projects": [
                {"name": "Portfolio Website Builder", "description": "Drag-and-drop portfolio website builder", "technologies": "React, TypeScript, CSS"},
            ],
            "certifications": [],
        },
        {
            "name": "Aditya Kapoor",
            "email": "aditya.kapoor@email.com",
            "phone": "+91 9876543220",
            "education": "B.Tech",
            "university": "DTU Delhi",
            "graduation_year": "2021",
            "experience_years": 4,
            "current_company": "PayPal",
            "current_role": "Software Engineer II",
            "skills": ["Java", "Spring Boot", "Python", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Git", "REST API", "Data Structures", "Algorithms", "Redis"],
            "projects": [
                {"name": "Payment Processing System", "description": "High-throughput payment processing with idempotency", "technologies": "Java, Spring Boot, PostgreSQL"},
                {"name": "Fraud Detection System", "description": "Real-time fraud detection using rule engine and ML", "technologies": "Python, Java, Redis"},
                {"name": "API Rate Limiter", "description": "Distributed rate limiting system", "technologies": "Java, Redis, Docker"},
            ],
            "certifications": [
                {"name": "Spring Professional Certification", "issuer": "VMware"},
                {"name": "AWS Solutions Architect Associate", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Nisha Agarwal",
            "email": "nisha.agarwal@email.com",
            "phone": "+91 9876543221",
            "education": "M.Tech",
            "university": "IIT Kanpur",
            "graduation_year": "2020",
            "experience_years": 5,
            "current_company": "Uber",
            "current_role": "Staff Engineer",
            "skills": ["Python", "Java", "C++", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Git", "Machine Learning", "Data Structures", "Algorithms", "REST API", "Linux", "Redis"],
            "projects": [
                {"name": "Ride Matching Algorithm", "description": "Optimized driver-rider matching using graph algorithms", "technologies": "Python, C++, Redis"},
                {"name": "Real-time Pricing Engine", "description": "Dynamic pricing engine with demand prediction", "technologies": "Python, Machine Learning, PostgreSQL"},
            ],
            "certifications": [
                {"name": "System Design Expert", "issuer": "AlgoExpert"},
                {"name": "AWS Solutions Architect Professional", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Siddharth Iyer",
            "email": "siddharth.iyer@email.com",
            "phone": "+91 9876543222",
            "education": "B.Sc",
            "university": "Bangalore University",
            "graduation_year": "2022",
            "experience_years": 2,
            "current_company": "Cognizant",
            "current_role": "Junior Developer",
            "skills": ["Java", "SQL", "MySQL", "HTML", "CSS", "Git"],
            "projects": [
                {"name": "Employee Management Portal", "description": "Web app for managing employee records", "technologies": "Java, MySQL, HTML"},
            ],
            "certifications": [],
        },
        {
            "name": "Kavya Bhat",
            "email": "kavya.bhat@email.com",
            "phone": "+91 9876543223",
            "education": "B.Tech",
            "university": "PES University",
            "graduation_year": "2023",
            "experience_years": 1,
            "current_company": "Mindtree",
            "current_role": "Associate Software Engineer",
            "skills": ["Python", "Java", "C", "SQL", "HTML", "CSS", "Git", "Data Structures"],
            "projects": [
                {"name": "Online Quiz Platform", "description": "Web-based quiz platform with timer and scoring", "technologies": "Python, Flask, SQLite"},
            ],
            "certifications": [
                {"name": "Python for Everybody", "issuer": "Coursera"},
            ],
        },
        {
            "name": "Amit Verma",
            "email": "amit.verma@email.com",
            "phone": "+91 9876543224",
            "education": "B.Tech",
            "university": "IIT Madras",
            "graduation_year": "2021",
            "experience_years": 4,
            "current_company": "Netflix",
            "current_role": "Senior Software Engineer",
            "skills": ["Python", "Java", "JavaScript", "React", "Node.js", "SQL", "PostgreSQL", "Docker", "AWS", "Git", "Data Structures", "Algorithms", "REST API", "MongoDB", "Redis"],
            "projects": [
                {"name": "Content Recommendation Engine", "description": "Personalized content recommendation using collaborative filtering", "technologies": "Python, Machine Learning, PostgreSQL"},
                {"name": "Video Streaming Optimizer", "description": "Adaptive bitrate streaming optimization", "technologies": "Python, C++, AWS"},
            ],
            "certifications": [
                {"name": "AWS Developer Associate", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Pooja Rao",
            "email": "pooja.rao@email.com",
            "phone": "+91 9876543225",
            "education": "B.Tech",
            "university": "RV College of Engineering",
            "graduation_year": "2024",
            "experience_years": 0.5,
            "current_company": None,
            "current_role": "Intern",
            "skills": ["Python", "C", "C++", "Java", "SQL", "HTML", "CSS", "Git", "Data Structures", "Algorithms"],
            "projects": [
                {"name": "Simple Chat Application", "description": "Console-based chat application using sockets", "technologies": "Python, Socket Programming"},
                {"name": "Sorting Visualizer", "description": "Interactive visualization of sorting algorithms", "technologies": "Python, Pygame"},
            ],
            "certifications": [],
        },
        {
            "name": "Rajesh Kumar",
            "email": "rajesh.kumar@email.com",
            "phone": "+91 9876543226",
            "education": "Diploma",
            "university": "Government Polytechnic",
            "graduation_year": "2020",
            "experience_years": 3,
            "current_company": "HCL Tech",
            "current_role": "Support Engineer",
            "skills": ["SQL", "MySQL", "Linux", "Excel", "HTML", "CSS"],
            "projects": [],
            "certifications": [
                {"name": "CCNA", "issuer": "Cisco"},
            ],
        },
        {
            "name": "Tanvi Mehta",
            "email": "tanvi.mehta@email.com",
            "phone": "+91 9876543227",
            "education": "M.S.",
            "university": "Carnegie Mellon University",
            "graduation_year": "2021",
            "experience_years": 4,
            "current_company": "Meta",
            "current_role": "ML Engineer",
            "skills": ["Python", "C++", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "SQL", "Docker", "AWS", "Git", "Data Structures", "Algorithms", "Data Science", "Linux"],
            "projects": [
                {"name": "Object Detection Pipeline", "description": "Real-time object detection system for autonomous vehicles", "technologies": "Python, PyTorch, CUDA"},
                {"name": "Sentiment Analysis Tool", "description": "BERT-based sentiment analysis for social media", "technologies": "Python, TensorFlow, NLP"},
                {"name": "Image Generation with GANs", "description": "Generative adversarial network for face generation", "technologies": "Python, PyTorch"},
            ],
            "certifications": [
                {"name": "Deep Learning Specialization", "issuer": "Coursera (deeplearning.ai)"},
                {"name": "TensorFlow Developer Certificate", "issuer": "Google"},
                {"name": "AWS Machine Learning Specialty", "issuer": "Amazon Web Services"},
            ],
        },
        {
            "name": "Suresh Pillai",
            "email": "suresh.pillai@email.com",
            "phone": "+91 9876543228",
            "education": "B.Tech",
            "university": "NIT Calicut",
            "graduation_year": "2022",
            "experience_years": 2.5,
            "current_company": "Razorpay",
            "current_role": "Backend Developer",
            "skills": ["Python", "Java", "SQL", "PostgreSQL", "Redis", "Docker", "Git", "REST API", "Data Structures", "Algorithms", "Linux", "Flask"],
            "projects": [
                {"name": "Payment Reconciliation System", "description": "Automated payment reconciliation with bank statements", "technologies": "Python, PostgreSQL, Redis"},
                {"name": "Webhook Manager", "description": "Reliable webhook delivery system with retry logic", "technologies": "Python, Redis, Docker"},
            ],
            "certifications": [
                {"name": "Python Professional Certificate", "issuer": "Python Institute"},
            ],
        },
        {
            "name": "Ishita Das",
            "email": "ishita.das@email.com",
            "phone": "+91 9876543229",
            "education": "B.Tech",
            "university": "Jadavpur University",
            "graduation_year": "2023",
            "experience_years": 1.5,
            "current_company": "Accenture",
            "current_role": "Full Stack Developer",
            "skills": ["JavaScript", "React", "Node.js", "Express", "MongoDB", "HTML", "CSS", "Git", "Python", "SQL", "REST API"],
            "projects": [
                {"name": "E-Learning Platform", "description": "Online course platform with video streaming and quizzes", "technologies": "React, Node.js, MongoDB"},
                {"name": "Task Management App", "description": "Kanban-style task management with drag and drop", "technologies": "React, Express, MongoDB"},
            ],
            "certifications": [
                {"name": "Full Stack Web Development", "issuer": "freeCodeCamp"},
            ],
        },
    ]

    if Candidate.query.count() == 0:
        for cand_data in candidates_data:
            candidate = Candidate(
                name=cand_data["name"],
                email=cand_data["email"],
                phone=cand_data["phone"],
                education=cand_data["education"],
                university=cand_data["university"],
                graduation_year=cand_data["graduation_year"],
                experience_years=cand_data["experience_years"],
                current_company=cand_data.get("current_company"),
                current_role=cand_data.get("current_role"),
                status="Under Review"
            )
            db.session.add(candidate)
            db.session.flush()

            # Add skills
            for skill_name in cand_data["skills"]:
                if skill_name in skills:
                    candidate.skills.append(skills[skill_name])

            # Add projects
            for proj_data in cand_data.get("projects", []):
                project = Project(
                    candidate_id=candidate.id,
                    name=proj_data["name"],
                    description=proj_data["description"],
                    technologies=proj_data.get("technologies", "")
                )
                db.session.add(project)

            # Add certifications
            for cert_data in cand_data.get("certifications", []):
                cert = Certification(
                    candidate_id=candidate.id,
                    name=cert_data["name"],
                    issuer=cert_data.get("issuer")
                )
                db.session.add(cert)

    # ==================== JOBS ====================
    jobs_data = [
        {
            "title": "Software Developer",
            "description": "Looking for a skilled software developer with strong programming fundamentals and experience in building scalable applications.",
            "minimum_experience": 2,
            "education_requirement": "B.Tech",
            "required_skills": ["Python", "SQL", "Data Structures", "Algorithms", "Git"],
            "preferred_skills": ["Docker", "AWS", "REST API"],
        },
        {
            "title": "Full Stack Web Developer",
            "description": "Seeking a full stack developer proficient in modern web technologies for building customer-facing applications.",
            "minimum_experience": 2,
            "education_requirement": "B.Tech",
            "required_skills": ["JavaScript", "React", "Node.js", "SQL", "Git"],
            "preferred_skills": ["TypeScript", "Docker", "MongoDB", "REST API"],
        },
        {
            "title": "Machine Learning Engineer",
            "description": "Looking for an ML engineer to build and deploy machine learning models for production systems.",
            "minimum_experience": 3,
            "education_requirement": "M.Tech",
            "required_skills": ["Python", "Machine Learning", "TensorFlow", "SQL"],
            "preferred_skills": ["PyTorch", "Docker", "AWS", "Data Science"],
        },
        {
            "title": "Data Analyst",
            "description": "Seeking a data analyst to derive insights from large datasets and create dashboards.",
            "minimum_experience": 1,
            "education_requirement": "B.Tech",
            "required_skills": ["Python", "SQL", "Excel"],
            "preferred_skills": ["Power BI", "Data Science", "Machine Learning"],
        },
        {
            "title": "Backend Developer",
            "description": "Looking for a backend developer experienced in building robust APIs and microservices.",
            "minimum_experience": 2,
            "education_requirement": "B.Tech",
            "required_skills": ["Python", "SQL", "REST API", "Git"],
            "preferred_skills": ["Django", "Flask", "Docker", "PostgreSQL", "Redis"],
        },
    ]

    if Job.query.count() == 0:
        for job_data in jobs_data:
            job = Job(
                title=job_data["title"],
                description=job_data["description"],
                minimum_experience=job_data["minimum_experience"],
                education_requirement=job_data["education_requirement"],
                status="Active"
            )
            db.session.add(job)
            db.session.flush()

            for skill_name in job_data["required_skills"]:
                if skill_name in skills:
                    js = JobSkill(job_id=job.id, skill_id=skills[skill_name].id, skill_type='required')
                    db.session.add(js)

            for skill_name in job_data["preferred_skills"]:
                if skill_name in skills:
                    js = JobSkill(job_id=job.id, skill_id=skills[skill_name].id, skill_type='preferred')
                    db.session.add(js)

    db.session.commit()
    print(f"Seeded {len(candidates_data)} candidates, {len(jobs_data)} jobs, {len(skill_names)} skills")
    return True
