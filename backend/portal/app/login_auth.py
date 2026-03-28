from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .audit_log import log_audit
from .auth_utils import user_payload
from .models import Profile


@csrf_exempt
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        profile, _ = Profile.objects.get_or_create(
            user=user,
            defaults={"role": Profile.ROLE_CUSTOMER},
        )
        if not profile.email_verified and not user.is_superuser:
            return Response(
                {
                    "success": False,
                    "message": "Please verify your email before signing in.",
                },
                status=403,
            )
        if not user.is_active:
            return Response(
                {"success": False, "message": "This account is inactive."},
                status=403,
            )
        django_login(request, user)
        log_audit(
            user,
            "auth.login",
            resource_type="session",
            summary=f"User {user.username} signed in",
            metadata={"username": user.username},
        )
        return Response(
            {
                "success": True,
                "message": "Login successful",
                "user": user_payload(user),
            }
        )

    return Response(
        {"success": False, "message": "Invalid credentials"},
        status=401,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    log_audit(
        request.user,
        "auth.logout",
        resource_type="session",
        summary=f"User {request.user.username} signed out",
        metadata={"username": request.user.username},
    )
    django_logout(request)
    return Response({"success": True, "message": "Logged out"})
