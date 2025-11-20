**\# Flexilance MVP Backend \- Complete Step-by-Step Guide**

**\#\# 🎯 What You'll Build**  
ddd  
A simple but functional Django backend for Flexilance with:  
\- ✅ User registration & authentication  
\- ✅ Job posting system  
\- ✅ Proposal submission  
\- ✅ REST API endpoints  
\- ✅ Django admin panel  
\- ✅ Render deployment ready

\---

**\#\# 📋 Phase 1: Quick Setup (10 minutes)**

**\#\#\# Step 1.1: Create Project Folder**  
\`\`\`bash  
\# Open terminal/command prompt  
mkdir flexilance-mvp  
cd flexilance-mvp  
\`\`\`

**\#\#\# Step 1.2: Set Up Virtual Environment**  
\`\`\`bash  
\# Create virtual environment  
python \-m venv venv

\# Activate it (Windows)  
venv\\Scripts\\activate

\# Activate it (Mac/Linux)  
source venv/bin/activate  
\`\`\`

**\#\#\# Step 1.3: Install Dependencies**  
\`\`\`bash  
pip install django djangorestframework pillow  
\`\`\`

**\#\#\# Step 1.4: Create Django Project**  
\`\`\`bash  
django-admin startproject flexilance .  
python manage.py startapp core  
\`\`\`

✅ **\*\*Check\*\***: You should see \`flexilance/\` and \`core/\` folders

\---

**\#\# 🗄️ Phase 2: Simple Database Models (15 minutes)**

**\#\#\# Step 2.1: Create Models File**  
Create \`core/models.py\`:

\`\`\`python  
from django.db import models  
from django.contrib.auth.models import User

class Profile(models.Model):  
    user \= models.OneToOneField(User, on\_delete\=models.CASCADE)  
    is\_freelancer \= models.BooleanField(default\=False)  
    skills \= models.TextField(blank\=True)  
    bio \= models.TextField(blank\=True)

class Job(models.Model):  
    title \= models.CharField(max\_length\=200)  
    description \= models.TextField()  
    budget \= models.DecimalField(max\_digits\=10, decimal\_places\=2)  
    client \= models.ForeignKey(User, on\_delete\=models.CASCADE)  
    created\_at \= models.DateTimeField(auto\_now\_add\=True)  
    is\_active \= models.BooleanField(default\=True)

class Proposal(models.Model):  
    job \= models.ForeignKey(Job, on\_delete\=models.CASCADE)  
    freelancer \= models.ForeignKey(User, on\_delete\=models.CASCADE)  
    cover\_letter \= models.TextField()  
    bid\_amount \= models.DecimalField(max\_digits\=10, decimal\_places\=2)  
    created\_at \= models.DateTimeField(auto\_now\_add\=True)  
\`\`\`

**\#\#\# Step 2.2: Register Models in Admin**  
Create \`core/admin.py\`:

\`\`\`python  
from django.contrib import admin  
from .models import Profile, Job, Proposal

admin.site.register(Profile)  
admin.site.register(Job)  
admin.site.register(Proposal)  
\`\`\`

**\#\#\# Step 2.3: Update Settings**  
Add to \`flexilance/settings.py\`:

\`\`\`python  
INSTALLED\_APPS \= \[  
    'django.contrib.admin',  
    'django.contrib.auth',  
    'django.contrib.contenttypes',  
    'django.contrib.sessions',  
    'django.contrib.messages',  
    'django.contrib.staticfiles',  
    'rest\_framework',  
    'core',  \# Add this line  
\]

ALLOWED\_HOSTS \= \['\*'\]  \# Add at bottom  
\`\`\`

**\#\#\# Step 2.4: Create Database Tables**  
\`\`\`bash  
python manage.py makemigrations  
python manage.py migrate  
\`\`\`

✅ **\*\*Check\*\***: Database tables created successfully

\---

**\#\# 🔐 Phase 3: Simple Authentication (10 minutes)**

**\#\#\# Step 3.1: Install Token Auth**  
\`\`\`bash  
pip install djangorestframework  
\`\`\`

**\#\#\# Step 3.2: Update Settings for Auth**  
Add to \`flexilance/settings.py\`:

\`\`\`python  
REST\_FRAMEWORK \= {  
    'DEFAULT\_AUTHENTICATION\_CLASSES': \[  
        'rest\_framework.authentication.TokenAuthentication',  
    \],  
    'DEFAULT\_PERMISSION\_CLASSES': \[  
        'rest\_framework.permissions.IsAuthenticated',  
    \],  
}  
\`\`\`

**\#\#\# Step 3.3: Create Superuser**  
\`\`\`bash  
python manage.py createsuperuser  
\# Follow prompts to create admin account  
\`\`\`

✅ **\*\*Check\*\***: You can login to admin at \`http://localhost:8000/admin\`

\---

**\#\# 🌐 Phase 4: API Endpoints (20 minutes)**

**\#\#\# Step 4.1: Create Serializers**  
Create \`core/serializers.py\`:

\`\`\`python  
from rest\_framework import serializers  
from .models import Job, Proposal

class JobSerializer(serializers.ModelSerializer):  
    client\_name \= serializers.CharField(source\='client.username', read\_only\=True)  
     
    class Meta:  
        model \= Job  
        fields \= \['id', 'title', 'description', 'budget', 'client', 'client\_name', 'created\_at'\]

class ProposalSerializer(serializers.ModelSerializer):  
    freelancer\_name \= serializers.CharField(source\='freelancer.username', read\_only\=True)  
    job\_title \= serializers.CharField(source\='job.title', read\_only\=True)  
     
    class Meta:  
        model \= Proposal  
        fields \= \['id', 'job', 'job\_title', 'freelancer', 'freelancer\_name', 'cover\_letter', 'bid\_amount', 'created\_at'\]  
\`\`\`

**\#\#\# Step 4.2: Create Views**  
Create \`core/views.py\`:

\`\`\`python  
from rest\_framework import generics, permissions  
from rest\_framework.decorators import api\_view, permission\_classes  
from rest\_framework.response import Response  
from django.contrib.auth.models import User  
from .models import Profile, Job, Proposal  
from .serializers import JobSerializer, ProposalSerializer

@api\_view(\['POST'\])  
@permission\_classes(\[permissions.AllowAny\])  
def register(request):  
    username \= request.data.get('username')  
    email \= request.data.get('email')  
    password \= request.data.get('password')  
    is\_freelancer \= request.data.get('is\_freelancer', False)  
     
    user \= User.objects.create\_user(username, email, password)  
    Profile.objects.create(user\=user, is\_freelancer\=is\_freelancer)  
     
    return Response({'message': 'User created successfully'})

class JobListCreate(generics.ListCreateAPIView):  
    queryset \= Job.objects.filter(is\_active\=True)  
    serializer\_class \= JobSerializer  
    permission\_classes \= \[permissions.IsAuthenticated\]

class ProposalListCreate(generics.ListCreateAPIView):  
    queryset \= Proposal.objects.all()  
    serializer\_class \= ProposalSerializer  
    permission\_classes \= \[permissions.IsAuthenticated\]  
\`\`\`

**\#\#\# Step 4.3: Create URLs**  
Create \`core/urls.py\`:

\`\`\`python  
from django.urls import path  
from . import views

urlpatterns \= \[  
    path('register/', views.register, name\='register'),  
    path('jobs/', views.JobListCreate.as\_view(), name\='job-list'),  
    path('proposals/', views.ProposalListCreate.as\_view(), name\='proposal-list'),  
\]  
\`\`\`

**\#\#\# Step 4.4: Update Main URLs**  
Update \`flexilance/urls.py\`:

\`\`\`python  
from django.contrib import admin  
from django.urls import path, include  
from rest\_framework.authtoken import views

urlpatterns \= \[  
    path('admin/', admin.site.urls),  
    path('api/', include('core.urls')),  
    path('api-token-auth/', views.obtain\_auth\_token),  
\]  
\`\`\`

✅ **\*\*Check\*\***: API endpoints are ready

\---

**\#\# 🧪 Phase 5: Test Your Backend (10 minutes)**

**\#\#\# Step 5.1: Start Development Server**  
\`\`\`bash  
python manage.py runserver  
\`\`\`

**\#\#\# Step 5.2: Test Registration**  
\`\`\`bash  
\# Open new terminal and run:  
curl \-X POST http://localhost:8000/api/register/ \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"username": "testuser", "email": "test@test.com", "password": "test123", "is\_freelancer": true}'  
\`\`\`

**\#\#\# Step 5.3: Get Auth Token**  
\`\`\`bash  
curl \-X POST http://localhost:8000/api-token-auth/ \\  
  \-H "Content-Type: application/json" \\  
  \-d '{"username": "testuser", "password": "test123"}'  
\`\`\`

**\#\#\# Step 5.4: Create Job (Replace YOUR\_TOKEN)**  
\`\`\`bash  
curl \-X POST http://localhost:8000/api/jobs/ \\  
  \-H "Content-Type: application/json" \\  
  \-H "Authorization: Token YOUR\_TOKEN\_HERE" \\  
  \-d '{"title": "Website Design", "description": "Need a simple website", "budget": "500.00"}'  
\`\`\`

✅ **\*\*Check\*\***: API is working locally

\---

**\#\# ☁️ Phase 6: Deploy to Render (15 minutes)**

**\#\#\# Step 6.1: Create Deployment Files**  
Create \`requirements.txt\`:  
\`\`\`  
Django==5.0.2  
djangorestframework==3.14.0  
Pillow==10.2.0  
gunicorn==21.2.0  
psycopg2-binary==2.9.9  
\`\`\`

Create \`runtime.txt\`:  
\`\`\`  
python-3.11.0  
\`\`\`

Create \`build.sh\`:  
\`\`\`bash  
\#\!/usr/bin/env bash  
pip install \-r requirements.txt  
python manage.py collectstatic \--no-input  
python manage.py migrate  
\`\`\`

**\#\#\# Step 6.2: Push to GitHub**  
\`\`\`bash  
git init  
git add .  
git commit \-m "Initial Flexilance backend"  
\# Create repo on GitHub and push  
\`\`\`

**\#\#\# Step 6.3: Deploy on Render**  
1\. Go to \[render.com\](https://render.com)  
2\. Create account and connect GitHub  
3\. Create "Web Service"  
4\. Connect your GitHub repo  
5\. Set build command: \`./build.sh\`  
6\. Set start command: \`gunicorn flexilance.wsgi:application\`  
7\. Deploy\!

\---

**\#\# 🎉 What You've Built**

Your simple backend now has:

\- ✅ **\*\*User Management\*\***: Registration with freelancer/client roles  
\- ✅ **\*\*Authentication\*\***: Token-based security  
\- ✅ **\*\*Job System\*\***: Post and browse jobs  
\- ✅ **\*\*Proposals\*\***: Submit and view proposals  
\- ✅ **\*\*Admin Panel\*\***: Full Django admin for management  
\- ✅ **\*\*REST API\*\***: Clean endpoints for frontend  
\- ✅ **\*\*Deployment\*\***: Live on Render

\---

**\#\# 🚀 API Endpoints Summary**

| Method | Endpoint | Purpose |  
|--------|----------|---------|  
| POST | \`/api/register/\` | Create new user |  
| POST | \`/api-token-auth/\` | Get auth token |  
| GET/POST | \`/api/jobs/\` | List/create jobs |  
| GET/POST | \`/api/proposals/\` | List/create proposals |

\---

**\#\# 📝 Next Steps After Backend**

1\. **\*\*Test all endpoints\*\*** with Postman  
2\. **\*\*Build frontend\*\*** (React/Vue/HTML)  
3\. **\*\*Add more features\*\*** like messaging  
4\. **\*\*Set up payments\*\*** with Paystack

\---

**\#\# 🆘 Quick Troubleshooting**

**\*\*Common Issues:\*\***  
\- \`ModuleNotFoundError\`: Check virtual environment  
\- \`Port in use\`: Use \`python manage.py runserver 8001\`  
\- \`Migration errors\`: Run \`python manage.py makemigrations\`

**\*\*Success Check:\*\***  
\- Admin panel loads: ✅  
\- User registration works: ✅  
\- Job creation works: ✅  
\- API returns data: ✅

\---

**\*\*Total Time\*\***: \~1 hour    
**\*\*Difficulty\*\***: Beginner    
**\*\*Result\*\***: Working backend API deployed to Render 🎉  
