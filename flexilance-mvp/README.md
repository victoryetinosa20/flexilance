# Flexilance Backend API

A Django REST Framework backend for a freelance marketplace platform. This API provides user authentication, job posting, proposal submission, and user management functionalities.

## 🚀 Features

- **User Authentication**: Token-based authentication system
- **User Management**: Freelancer and client roles with profiles
- **Job Management**: Create, browse, and manage job postings
- **Proposal System**: Submit and manage job proposals
- **RESTful API**: Clean, well-documented endpoints
- **Admin Panel**: Full Django admin interface for management

## 🛠️ Technology Stack

- **Backend**: Django 5.0 + Django REST Framework
- **Database**: SQLite (development), PostgreSQL ready
- **Authentication**: Token Authentication
- **API Documentation**: Built-in DRF browsable API

## 📋 Prerequisites

- Python 3.8+
- pip (Python package manager)

## ⚡ Quick Start

### 1. Setup Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install django djangorestframework pillow
```

### 3. Database Setup

```bash
# Create database tables
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## 🔐 API Endpoints

### Authentication

#### Register User
- **POST** `/api/register/`
- **Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "is_freelancer": true,
  "skills": "Python, Django, React",
  "bio": "Experienced full-stack developer"
}
```

#### Get Auth Token
- **POST** `/api-token-auth/`
- **Body**:
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```
- **Response**:
```json
{
  "token": "your_auth_token_here"
}
```

### User Management

#### Get User Profile
- **GET** `/api/profile/`
- **Headers**: `Authorization: Token your_token_here`

### Job Management

#### List Active Jobs
- **GET** `/api/jobs/`
- **Headers**: `Authorization: Token your_token_here`
- **Query Params**: `?search=keyword` (optional)

#### Create Job
- **POST** `/api/jobs/`
- **Headers**: `Authorization: Token your_token_here`
- **Body**:
```json
{
  "title": "Website Development",
  "description": "Need a responsive website built",
  "budget": "1500.00",
  "skills_required": "HTML, CSS, JavaScript",
  "deadline": "2024-12-31T23:59:59Z"
}
```

#### Get My Jobs (Client Only)
- **GET** `/api/my-jobs/`
- **Headers**: `Authorization: Token your_token_here`

### Proposal Management

#### List Proposals
- **GET** `/api/proposals/`
- **Headers**: `Authorization: Token your_token_here`
- **Note**: Returns user's own proposals (freelancer) or proposals for user's jobs (client)

#### Submit Proposal
- **POST** `/api/proposals/`
- **Headers**: `Authorization: Token your_token_here`
- **Body**:
```json
{
  "job": 1,
  "cover_letter": "I have extensive experience with similar projects...",
  "bid_amount": "1200.00",
  "delivery_time": 14
}
```

#### Get Job Proposals
- **GET** `/api/jobs/{job_id}/proposals/`
- **Headers**: `Authorization: Token your_token_here`
- **Note**: Only job owner can access

## 🗄️ Database Models

### User & Profile
- **User**: Django's built-in User model
- **Profile**: Extended user information (role, skills, bio)

### Job
- **Job**: Job postings with title, description, budget, skills required
- **Fields**: title, description, budget, client, skills_required, deadline, is_active

### Proposal
- **Proposal**: Job applications from freelancers
- **Fields**: job, freelancer, cover_letter, bid_amount, delivery_time, status

## 🔧 Configuration

### Environment Variables
For production, set these environment variables:

```python
DEBUG = False
SECRET_KEY = 'your-secret-key-here'
ALLOWED_HOSTS = ['your-domain.com']
DATABASE_URL = 'postgres://user:pass@localhost/dbname'
```

### Production Database
Update `settings.py` for PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'flexilance',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 🧪 Testing

Run the test suite:

```bash
python manage.py test
```

## 📊 Admin Panel

Access the admin panel at `http://localhost:8000/admin/` to manage:

- Users and profiles
- Job postings
- Proposals
- System configuration

## 🚀 Deployment

### Render.com (Recommended)

1. Create `requirements.txt`:
```txt
Django==5.0.14
djangorestframework==3.15.1
Pillow==10.3.0
gunicorn==21.2.0
psycopg2-binary==2.9.9
```

2. Create `runtime.txt`:
```txt
python-3.11.0
```

3. Create `build.sh`:
```bash
#!/usr/bin/env bash
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

4. Deploy to Render following their Django deployment guide.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api/`
- Visit the admin panel at `/admin/`
- Review the Django REST Framework documentation

---

**Built with ❤️ using Django & Django REST Framework**