from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_utils import can_manage_users
from .models import AuditLog, Notification, UserPreferences
from .serializers import (
    AuditLogSerializer,
    NotificationSerializer,
    UserPreferencesSerializer,
)


class IsManagerForAudit(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and can_manage_users(u))


class AuditLogPagination(PageNumberPagination):
    page_size = 25
    max_page_size = 100


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationDetailView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    http_method_names = ["patch", "head", "options"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(user=request.user, read=False).update(
            read=True
        )
        return Response({"marked_read": updated})


class UserPreferencesDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        return Response(UserPreferencesSerializer(prefs).data)

    def patch(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        ser = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsManagerForAudit]
    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination
    queryset = AuditLog.objects.select_related("actor").all()
