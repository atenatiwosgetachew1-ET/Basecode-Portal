from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user:
        return Response({
            "success": True,
            "message": "Login successful"
        })
    else:
        return Response({
            "success": False,
            "message": "Invalid credentials"
        }, status=401)