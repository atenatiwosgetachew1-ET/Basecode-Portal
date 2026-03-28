from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import AuditLog, Profile


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_verify_login_and_bootstrap_me(self):
        with patch("app.registration_views.generate_code", return_value="123456"):
            response = self.client.post(
                "/api/register/",
                {
                    "username": "newuser",
                    "email": "newuser@example.com",
                    "password": "strong-pass-123",
                    "password_confirm": "strong-pass-123",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("123456", mail.outbox[0].body)

        user = User.objects.get(username="newuser")
        self.assertFalse(user.is_active)
        self.assertFalse(user.profile.email_verified)

        verify_response = self.client.post(
            "/api/verify-email/",
            {"email": "newuser@example.com", "code": "123456"},
            format="json",
        )
        self.assertEqual(verify_response.status_code, 200)

        user.refresh_from_db()
        user.profile.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.profile.email_verified)

        login_response = self.client.post(
            "/api/login/",
            {"username": "newuser", "password": "strong-pass-123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.data["user"]["username"], "newuser")

        me_response = self.client.get("/api/me/")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data["email"], "newuser@example.com")

        actions = list(
            AuditLog.objects.order_by("created_at").values_list("action", flat=True)
        )
        self.assertIn("auth.register", actions)
        self.assertIn("auth.email_verified", actions)
        self.assertIn("auth.login", actions)

    def test_me_patch_updates_user_and_profile_fields(self):
        user = User.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="strong-pass-123",
            is_active=True,
        )
        user.profile.email_verified = True
        user.profile.save(update_fields=["email_verified"])

        self.client.force_authenticate(user=user)
        response = self.client.patch(
            "/api/me/",
            {
                "first_name": "Alice",
                "last_name": "Ngugi",
                "phone": "+254700000000",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        user.profile.refresh_from_db()
        self.assertEqual(user.first_name, "Alice")
        self.assertEqual(user.last_name, "Ngugi")
        self.assertEqual(user.profile.phone, "+254700000000")
        self.assertTrue(
            AuditLog.objects.filter(
                actor=user,
                action="profile.update",
            ).exists()
        )


class UserManagementPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _create_user(self, username: str, role: str) -> User:
        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="strong-pass-123",
            is_active=True,
        )
        profile = user.profile
        profile.role = role
        profile.email_verified = True
        profile.save(update_fields=["role", "email_verified"])
        return user

    def test_admin_cannot_create_admin_accounts(self):
        admin_user = self._create_user("manager", Profile.ROLE_ADMIN)
        self.client.force_authenticate(user=admin_user)

        response = self.client.post(
            "/api/users/",
            {
                "username": "bad-admin",
                "password": "strong-pass-123",
                "email": "bad-admin@example.com",
                "role": "admin",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("role", response.data)

    def test_admin_cannot_manage_other_admin_accounts(self):
        acting_admin = self._create_user("manager", Profile.ROLE_ADMIN)
        target_admin = self._create_user("second-admin", Profile.ROLE_ADMIN)
        self.client.force_authenticate(user=acting_admin)

        response = self.client.patch(
            f"/api/users/{target_admin.pk}/",
            {"first_name": "Blocked"},
            format="json",
        )

        self.assertEqual(response.status_code, 404)

    def test_admin_can_create_customer_account(self):
        admin_user = self._create_user("manager", Profile.ROLE_ADMIN)
        self.client.force_authenticate(user=admin_user)

        response = self.client.post(
            "/api/users/",
            {
                "username": "customer1",
                "password": "strong-pass-123",
                "email": "customer1@example.com",
                "role": "customer",
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        created = User.objects.get(username="customer1")
        self.assertEqual(created.profile.role, Profile.ROLE_CUSTOMER)
        self.assertTrue(created.profile.email_verified)
