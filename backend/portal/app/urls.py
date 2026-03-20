# portal/app/urls.py
from django.urls import path
from .login_auth import login

urlpatterns = [
    path('login/', login, name="login"),  # maps to /api/login/
]