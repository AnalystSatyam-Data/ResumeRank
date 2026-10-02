"""
Resume Parser Service
======================
Extracts candidate information from PDF and DOCX resumes.
Uses rule-based extraction with regex patterns.
"""
import re
import os


# Skill dictionary — easily extensible
SKILL_DICTIONARY = [
    # Programming Languages
    "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Golang",
    "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl",
    "Dart", "Lua", "Shell", "Bash", "PowerShell", "Assembly",
    # Web Frontend
    "HTML", "CSS", "React", "Angular", "Vue", "Vue.js", "Next.js", "Svelte",
    "jQuery", "Bootstrap", "Tailwind", "SASS", "SCSS", "Redux", "Webpack",
    # Web Backend
    "Node.js", "Express", "Express.js", "Django", "Flask", "Spring", "Spring Boot",
    "ASP.NET", "FastAPI", "Rails", "Ruby on Rails", "Laravel", "Gin",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "Redis", "Cassandra",
    "Oracle", "SQLite", "DynamoDB", "Elasticsearch", "Neo4j", "MariaDB",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Jenkins",
    "CI/CD", "Terraform", "Ansible", "Nginx", "Apache", "Linux", "Unix",
    # Data Science & ML
    "Machine Learning", "Deep Learning", "Data Science", "Data Analysis",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
    "Matplotlib", "NLP", "Natural Language Processing", "Computer Vision",
    "Neural Networks", "Reinforcement Learning",
    # Tools & Frameworks
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "VS Code", "IntelliJ", "Eclipse", "Postman", "Figma",
    # Computer Science Fundamentals
    "Data Structures", "Algorithms", "OOP", "Object-Oriented Programming",
    "Design Patterns", "System Design", "REST API", "GraphQL", "Microservices",
    # Mobile
    "Android", "iOS", "React Native", "Flutter", "Xamarin",
    # Other
    "Power BI", "Tableau", "Excel", "Agile", "Scrum", "DevOps",
    "Blockchain", "IoT", "Cybersecurity", "Networking",
    "Unit Testing", "Integration Testing", "Selenium", "API Testing",
]


def parse_resume(file_path):
    """
    Parse a resume file and extract candidate information.

    Args:
        file_path: Path to the resume file (PDF or DOCX)

    Returns:
        Dictionary containing extracted information
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.pdf':
        text = _extract_text_from_pdf(file_path)
    elif ext == '.docx':
        text = _extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

    if not text or len(text.strip()) < 20:
        raise ValueError("Could not extract meaningful text from the resume")

    return _extract_information(text)


def _extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    try:
        import pdfplumber
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        # Fallback to PyPDF2
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception:
            raise ValueError(f"Failed to parse PDF: {str(e)}")


def _extract_text_from_docx(file_path):
    """Extract text from a DOCX file."""
    try:
        import docx
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + "\n"
        return text
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {str(e)}")


def _extract_information(text):
    """Extract structured information from resume text."""
    result = {
        'name': _extract_name(text),
        'email': _extract_email(text),
        'phone': _extract_phone(text),
        'education': _extract_education(text),
        'university': _extract_university(text),
        'graduation_year': _extract_graduation_year(text),
        'experience_years': _extract_experience_years(text),
        'current_company': _extract_company(text),
        'current_role': _extract_role(text),
        'skills': _extract_skills(text),
        'projects': _extract_projects(text),
        'certifications': _extract_certifications(text),
        'resume_text': text
    }
    return result


def _extract_name(text):
    """Extract candidate name from resume."""
    lines = text.strip().split('\n')

    # Try first non-empty line (most resumes start with name)
    for line in lines[:5]:
        line = line.strip()
        if not line:
            continue
        # Skip lines that look like headers, emails, or phone numbers
        if re.match(r'^(resume|curriculum|cv|portfolio|profile)', line, re.IGNORECASE):
            continue
        if '@' in line or re.search(r'\d{5,}', line):
            continue
        if re.search(r'^https?://', line):
            continue

        # Check if it looks like a name (2-4 words, mostly letters)
        words = line.split()
        if 1 <= len(words) <= 5 and all(re.match(r'^[A-Za-z.\'-]+$', w) for w in words):
            return ' '.join(words).title()

    return "Unknown Candidate"


def _extract_email(text):
    """Extract email from resume."""
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    match = re.search(pattern, text)
    return match.group(0).lower() if match else None


def _extract_phone(text):
    """Extract phone number from resume."""
    patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{10}',
        r'\+\d{12}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            phone = match.group(0).strip()
            # Verify it's actually a phone number (has enough digits)
            digits = re.sub(r'[^\d]', '', phone)
            if len(digits) >= 10:
                return phone
    return None


def _extract_education(text):
    """Extract education level from resume."""
    text_lower = text.lower()

    education_patterns = [
        (r"(m\.?\s?tech|master\s*(of|in)\s*tech)", "M.Tech"),
        (r"(m\.?\s?s\.?\s|master\s*(of|in)\s*science)", "M.S."),
        (r"(mba|master\s*(of|in)\s*business)", "MBA"),
        (r"(m\.?\s?e\.?|master\s*(of|in)\s*engineering)", "M.E."),
        (r"(m\.?\s?c\.?\s?a\.?|master\s*(of|in)\s*computer\s*application)", "MCA"),
        (r"(b\.?\s?tech|bachelor\s*(of|in)\s*tech)", "B.Tech"),
        (r"(b\.?\s?e\.?|bachelor\s*(of|in)\s*engineering)", "B.E."),
        (r"(b\.?\s?s\.?\s?c\.?|bachelor\s*(of|in)\s*science)", "B.Sc"),
        (r"(b\.?\s?c\.?\s?a\.?|bachelor\s*(of|in)\s*computer\s*application)", "BCA"),
        (r"(b\.?\s?s\.?\s|bachelor\s*(of|in)\s*science)", "B.S."),
        (r"(ph\.?\s?d|doctorate|doctor\s*of\s*philosophy)", "Ph.D"),
        (r"(diploma)", "Diploma"),
        (r"(12th|hsc|higher\s*secondary)", "12th"),
    ]

    for pattern, label in education_patterns:
        if re.search(pattern, text_lower):
            return label

    return None


def _extract_university(text):
    """Extract university/college name."""
    patterns = [
        r'(?:university|college|institute|school|academy)\s+(?:of\s+)?([A-Za-z\s,]+)',
        r'([A-Za-z\s]+(?:University|College|Institute|School|Academy|IIT|NIT|IIIT))',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            uni = matches[0].strip()
            # Clean up
            uni = re.sub(r'\s+', ' ', uni).strip()
            if len(uni) > 5 and len(uni) < 100:
                return uni

    return None


def _extract_graduation_year(text):
    """Extract graduation year."""
    # Look for 4-digit years near education context
    pattern = r'(?:graduat|batch|class|year|pass)\w*\s*(?:of|:|-|–)?\s*(\d{4})'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        year = int(match.group(1))
        if 1990 <= year <= 2030:
            return str(year)

    # Fallback: look for years near education keywords
    edu_section = _get_section(text, ['education', 'academic', 'qualification'])
    if edu_section:
        years = re.findall(r'20[0-3]\d', edu_section)
        if years:
            return max(years)

    return None


def _extract_experience_years(text):
    """Extract years of experience."""
    patterns = [
        r'(\d+\.?\d*)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp|work)',
        r'(?:experience|exp)\s*(?::|–|-)\s*(\d+\.?\d*)\s*(?:years?|yrs?)',
        r'(?:total|overall)\s*(?:experience|exp)\s*(?::|–|-)\s*(\d+\.?\d*)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            years = float(match.group(1))
            if 0 <= years <= 50:
                return years

    # Fallback: count from work experience dates
    date_ranges = re.findall(r'(20\d{2})\s*(?:to|–|-|—)\s*(20\d{2}|present|current)', text, re.IGNORECASE)
    total_years = 0
    for start, end in date_ranges:
        start_year = int(start)
        end_year = 2024 if end.lower() in ['present', 'current'] else int(end)
        total_years += max(0, end_year - start_year)
    if total_years > 0:
        return float(total_years)

    return 0


def _extract_company(text):
    """Extract current/most recent company."""
    exp_section = _get_section(text, ['experience', 'work', 'employment', 'professional'])
    if exp_section:
        lines = exp_section.strip().split('\n')
        for line in lines[:5]:
            line = line.strip()
            if not line:
                continue
            # Skip section headers
            if re.match(r'^(work|experience|employment|professional)', line, re.IGNORECASE):
                continue
            # Company names are usually short lines
            if 2 < len(line) < 80 and not re.search(r'@|\.com', line):
                # Clean up
                company = re.sub(r'[\|•\-–].*', '', line).strip()
                if company and len(company) > 2:
                    return company
    return None


def _extract_role(text):
    """Extract current/most recent role."""
    role_patterns = [
        r'(?:role|position|designation|title)\s*(?::|–|-)\s*(.+)',
        r'((?:senior|junior|lead|principal|staff)?\s*(?:software|web|full.?stack|front.?end|back.?end|data|ml|devops|cloud|mobile)\s*(?:engineer|developer|scientist|analyst|architect))',
    ]

    for pattern in role_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            role = match.group(1).strip()
            if len(role) > 3 and len(role) < 100:
                return role.title()

    return None


def _extract_skills(text):
    """Extract skills from resume text using the skill dictionary."""
    found_skills = set()
    text_lower = text.lower()

    for skill in SKILL_DICTIONARY:
        # Create pattern that matches the skill as a whole word
        escaped = re.escape(skill)
        # Handle case where skill has special chars like C++, C#, Node.js
        pattern = r'(?:^|[\s,;|•\-\(\[/])' + escaped + r'(?:$|[\s,;|•\-\)\]/.])'

        if re.search(pattern, text_lower if skill.lower() != 'c' else text, re.IGNORECASE):
            # Special handling for "C" to avoid false positives
            if skill == 'C':
                # Only match standalone C, C programming, etc.
                if re.search(r'(?:^|[\s,;|•])C(?:\s+programming|\s+language)?(?:$|[\s,;|•\-])', text):
                    found_skills.add(skill)
            else:
                found_skills.add(skill)

    return list(found_skills)


def _extract_projects(text):
    """Extract project information from resume."""
    projects = []
    proj_section = _get_section(text, ['project', 'personal project', 'academic project'])

    if proj_section:
        # Split into individual projects
        lines = proj_section.strip().split('\n')
        current_project = None

        for line in lines:
            line = line.strip()
            if not line:
                continue
            if re.match(r'^(projects?|personal|academic)', line, re.IGNORECASE):
                continue

            # Check if this is a project title (usually starts with bullet or is a short line)
            is_title = (
                re.match(r'^[•\-\*▪▸➤❖]\s*', line) or
                (len(line) < 100 and not line.endswith('.'))
            )

            if is_title and len(line) > 3:
                # Clean up title
                title = re.sub(r'^[•\-\*▪▸➤❖]\s*', '', line).strip()
                title = re.sub(r'\s*[\(\[].*?[\)\]]', '', title).strip()  # Remove parenthetical
                if title and len(title) > 2:
                    current_project = {
                        'name': title[:200],
                        'description': '',
                        'technologies': ''
                    }
                    projects.append(current_project)
            elif current_project and len(line) > 10:
                # Add as description
                if not current_project['description']:
                    current_project['description'] = line[:500]
                else:
                    current_project['description'] += ' ' + line[:500]

        # Extract technologies for each project
        for proj in projects:
            full_text = proj['name'] + ' ' + proj['description']
            techs = _extract_skills(full_text)
            proj['technologies'] = ', '.join(techs[:10])

    return projects[:10]  # Limit to 10 projects


def _extract_certifications(text):
    """Extract certification information from resume."""
    certs = []
    cert_section = _get_section(text, ['certification', 'certificate', 'credential', 'license'])

    if cert_section:
        lines = cert_section.strip().split('\n')
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
            if re.match(r'^(certification|certificate|credential|license)', line, re.IGNORECASE):
                continue

            # Clean up
            cert_name = re.sub(r'^[•\-\*▪▸➤❖]\s*', '', line).strip()
            if cert_name and len(cert_name) > 3:
                # Try to extract issuer
                issuer = None
                issuer_patterns = [
                    r'(?:by|from|issued\s+by|–|-|,)\s+(.+)',
                    r'\((.+?)\)',
                ]
                for pattern in issuer_patterns:
                    match = re.search(pattern, cert_name)
                    if match:
                        issuer = match.group(1).strip()
                        cert_name = cert_name[:match.start()].strip()
                        break

                if cert_name:
                    certs.append({
                        'name': cert_name[:300],
                        'issuer': issuer[:200] if issuer else None
                    })

    return certs[:10]  # Limit to 10 certifications


def _get_section(text, keywords):
    """Extract a section from the resume by looking for section headers."""
    lines = text.split('\n')
    section_start = None
    section_end = None

    section_headers = [
        'education', 'experience', 'work', 'skills', 'project', 'certification',
        'certificate', 'achievement', 'award', 'publication', 'reference',
        'summary', 'objective', 'profile', 'interest', 'hobby', 'language',
        'personal', 'academic', 'professional', 'qualification', 'training',
        'employment', 'credential', 'license', 'volunteer', 'activity',
        'extracurricular', 'contact'
    ]

    for i, line in enumerate(lines):
        line_stripped = line.strip().lower()
        # Check if this line is a section header
        is_header = False
        for kw in keywords:
            if kw.lower() in line_stripped and len(line_stripped) < 60:
                is_header = True
                break

        if is_header:
            section_start = i + 1
            continue

        if section_start is not None:
            # Check if we hit the next section
            for header in section_headers:
                if (header in line_stripped and
                    header not in [kw.lower() for kw in keywords] and
                    len(line_stripped) < 60):
                    section_end = i
                    break
            if section_end:
                break

    if section_start is not None:
        if section_end is None:
            section_end = min(section_start + 30, len(lines))
        return '\n'.join(lines[section_start:section_end])

    return None


def get_skill_dictionary():
    """Return the current skill dictionary."""
    return SKILL_DICTIONARY


def add_to_skill_dictionary(skill):
    """Add a new skill to the dictionary."""
    if skill not in SKILL_DICTIONARY:
        SKILL_DICTIONARY.append(skill)
        return True
    return False


def remove_from_skill_dictionary(skill):
    """Remove a skill from the dictionary."""
    if skill in SKILL_DICTIONARY:
        SKILL_DICTIONARY.remove(skill)
        return True
    return False
